#!/usr/bin/env python3
"""Turn a handoff draft ({"restaurant", "menus", "needs_review"}) into a row for admin_upsert_restaurant.

Usage: python3 scripts/prepare-menu.py <draft.json> <out.json>

- Items listed as "Name (Small)", "Name (Large)" (or any shared base with different trailing
  parenthetical options) become one dish with variants; the dish price is the lowest option.
- Item ids are made unique across the whole restaurant (the app needs that).
- ALL CAPS names become Title Case (known acronyms kept).
- Missing hours stay empty (the app then shows nothing about hours); cuisine and tagline stay empty.
- Held-out items (needs_review) are never included.
- `source` comes from the draft's restaurant.source (e.g. "menu" for a menu a venue sent us); default "owner".
"""
import collections
import json
import re
import sys

ACRONYMS = {"BBQ", "KFC", "ABC", "UAE", "VIP", "XL", "XXL", "MM", "CB", "PB", "BLT", "OK"}
OPTION_AR = {
    "small": "صغير", "medium": "وسط", "large": "كبير", "half": "نصف", "full": "كامل", "regular": "عادي",
    "chicken": "دجاج", "beef": "لحم بقر", "veg": "خضار", "veg.": "خضار", "mutton": "لحم ضأن", "egg": "بيض",
    "prawn": "روبيان", "prawns": "روبيان", "seafood": "مأكولات بحرية", "mix": "مشكل", "hot": "ساخن", "iced": "مثلج",
}
TRAILING = re.compile(r"^(.*?)\s*\(([^()]+)\)\s*$")


def slug(s):
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "x"


def tcase(s):
    s = re.sub(r"\s*\(one size\)", "", s, flags=re.I).strip()
    if s.upper() == s and len(s) > 3 and any(c.isalpha() for c in s):
        s = re.sub(r"[A-Za-z']+", lambda m: m.group(0) if m.group(0) in ACRONYMS else m.group(0).capitalize(), s)
    if s[:1].islower():
        s = s[0].upper() + s[1:]
    return s


def label(tok):
    t = tok.strip()
    key = t.lower()
    en = tcase(t.upper()) if t.isupper() else (t[0].upper() + t[1:])
    m = re.match(r"^(\d+)\s*pcs?\.?$", key)
    if m:
        return f"{m.group(1)} pcs", f"{m.group(1)} قطعة"
    m = re.match(r"^(\d+)\s*oz$", key)
    if m:
        return f"{m.group(1)} oz", f"{m.group(1)} أونصة"
    en = re.sub(r"(\d+)\s*oz\b", r"\1 oz", en, flags=re.I)
    return en, OPTION_AR.get(key)


def num(x):
    return int(x) if float(x) == int(x) else round(float(x), 2)


def build(draft):
    used, menus_out = set(), []
    for m in draft["menus"]:
        secs = []
        for s in m["sections"]:
            groups = collections.OrderedDict()
            for it in s["items"]:
                mt = TRAILING.match(it["name"])
                key = ("v", mt.group(1).strip().lower()) if mt and mt.group(1).strip() else ("s", it["id"])
                groups.setdefault(key, []).append((it, mt))
            items = []
            for key, lst in groups.items():
                if key[0] == "v" and len(lst) > 1 and len({mt.group(2).strip().lower() for _, mt in lst}) == len(lst):
                    first = lst[0][0]
                    base = lst[0][1].group(1).strip()
                    out = {"id": slug(base), "name": tcase(base)}
                    for k in ("nameAr", "description", "descriptionAr", "tags", "popular"):
                        if first.get(k):
                            out[k] = first[k]
                    vs = []
                    for it, mt in lst:
                        en, ar = label(mt.group(2))
                        v = {"label": en}
                        if ar:
                            v["labelAr"] = ar
                        v["price"] = num(it["price"])
                        vs.append(v)
                    out["price"] = min(v["price"] for v in vs)
                    out["variants"] = vs
                    items.append(out)
                else:
                    for it, _ in lst:
                        out = {k: it[k] for k in ("id", "name", "nameAr", "description", "descriptionAr", "tags", "popular") if it.get(k)}
                        out["name"] = tcase(out["name"])
                        out["price"] = num(it["price"])
                        items.append(out)
            sec = {"id": s["id"], "name": tcase(s["name"])}
            for k in ("nameAr", "description", "descriptionAr"):
                if s.get(k):
                    sec[k] = s[k]
            for it in items:
                base = it["id"]
                nid, n = base, 2
                if nid in used:
                    nid = f"{slug(s['id'])}-{base}"
                while nid in used:
                    nid = f"{slug(s['id'])}-{base}-{n}"
                    n += 1
                it["id"] = nid
                used.add(nid)
            sec["items"] = items
            secs.append(sec)
        menus_out.append({"id": m["id"], "name": m["name"], **({"nameAr": m["nameAr"]} if m.get("nameAr") else {}),
                          **({"note": m["note"]} if m.get("note") else {}), "sections": secs})
    return menus_out


def main(src, dst):
    draft = json.load(open(src, encoding="utf-8"))
    r = draft["restaurant"]
    menus = build(draft)
    links = [dict(l) for l in r.get("links", [])]
    for l in links:
        if l["kind"] == "maps":
            l.setdefault("labelAr", "خرائط جوجل")
    digits = re.sub(r"\D", "", r.get("phone") or "")
    if digits and not any(l["kind"] == "whatsapp" for l in links):
        links.insert(0, {"kind": "whatsapp", "label": "WhatsApp", "labelAr": "واتساب", "url": f"https://wa.me/{digits}"})
    row = {
        "slug": r["slug"], "name": r["name"], "name_ar": r.get("name_ar") or None, "tagline": "", "cuisine": [],
        "price_level": 2, "neighborhood": r["neighborhood"], "address": r["address"], "phone": r["phone"],
        "timezone": "Asia/Dubai", "currency": r.get("currency", "AED"), "hours": {str(i): [] for i in range(7)},
        "links": links, "source": r.get("source") or "owner", "verified_at": r["verified_at"], "menus": menus, "published": True,
    }
    json.dump(row, open(dst, "w", encoding="utf-8"), ensure_ascii=False)
    items = [i for m in menus for s in m["sections"] for i in s["items"]]
    ids = [i["id"] for i in items]
    print(f"{r['slug']}: {len(items)} dishes, {sum(1 for i in items if i.get('variants'))} with options, "
          f"{sum(len(m['sections']) for m in menus)} sections, ids unique: {len(ids) == len(set(ids))}")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
