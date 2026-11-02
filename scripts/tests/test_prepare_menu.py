import importlib.util
import json
from pathlib import Path

import pytest

SCRIPT = Path(__file__).resolve().parents[1] / "prepare-menu.py"
spec = importlib.util.spec_from_file_location("prepare_menu", SCRIPT)
pm = importlib.util.module_from_spec(spec)
spec.loader.exec_module(pm)


def draft(items, section_id="mains", extra_sections=()):
    sections = [{"id": section_id, "name": "MAINS", "items": items}, *extra_sections]
    return {"menus": [{"id": "menu", "name": "Menu", "sections": sections}]}


def it(id, name, price, **kw):
    return {"id": id, "name": name, "price": price, **kw}


def items_of(menus):
    return [i for m in menus for s in m["sections"] for i in s["items"]]


def test_size_rows_merge_into_variants_with_lowest_price():
    [dish] = items_of(pm.build(draft([it("a", "Pizza (Small)", 20), it("b", "Pizza (Large)", 35)])))
    assert dish["name"] == "Pizza"
    assert dish["price"] == 20
    assert [(v["label"], v["price"]) for v in dish["variants"]] == [("Small", 20), ("Large", 35)]
    assert dish["variants"][0]["labelAr"] == "صغير"


def test_size_rows_stay_separate_when_any_is_unpriced():
    dishes = items_of(pm.build(draft([it("a", "Pizza (Small)", 20), it("b", "Pizza (Large)", None)])))
    assert len(dishes) == 2
    assert all("variants" not in d for d in dishes)


def test_unpriced_dish_is_kept_with_null_price():
    [dish] = items_of(pm.build(draft([it("a", "Fresh Fish", None)])))
    assert dish["price"] is None


def test_whole_prices_are_ints_and_fractions_rounded():
    a, b = items_of(pm.build(draft([it("a", "A", 12.0), it("b", "B", 12.456)])))
    assert a["price"] == 12 and isinstance(a["price"], int)
    assert b["price"] == 12.46


def test_ids_are_unique_across_sections():
    other = {"id": "sides", "name": "Sides", "items": [it("a", "Fries", 8)]}
    menus = pm.build(draft([it("a", "Burger", 30)], extra_sections=[other]))
    ids = [i["id"] for i in items_of(menus)]
    assert len(ids) == len(set(ids)) == 2


def test_duplicate_ids_within_a_section_are_made_unique():
    ids = [i["id"] for i in items_of(pm.build(draft([it("x", "One", 1), it("x", "Two", 2), it("x", "Three", 3)])))]
    assert len(set(ids)) == 3


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("CHICKEN BIRYANI", "Chicken Biryani"),
        ("BBQ CHICKEN", "BBQ Chicken"),
        ("already Fine", "Already Fine"),
        ("Mixed Case", "Mixed Case"),
        ("Soup (one size)", "Soup"),
    ],
)
def test_title_case(raw, expected):
    assert pm.tcase(raw) == expected


def test_section_names_are_title_cased():
    [sec] = pm.build(draft([it("a", "A", 1)]))[0]["sections"]
    assert sec["name"] == "Mains"


def test_main_writes_row_with_defaults(tmp_path):
    d = draft([it("a", "Burger", 30)])
    d["restaurant"] = {
        "slug": "demo", "name": "Demo", "neighborhood": "Reem", "address": "Abu Dhabi",
        "phone": "+971 4 321 7788", "verified_at": "2026-01-01", "links": [{"kind": "maps", "label": "Maps", "url": "u"}],
    }
    src, dst = tmp_path / "in.json", tmp_path / "out.json"
    src.write_text(json.dumps(d), encoding="utf-8")
    pm.main(str(src), str(dst))
    row = json.loads(dst.read_text(encoding="utf-8"))
    assert row["slug"] == "demo" and row["source"] == "owner" and row["currency"] == "AED"
    assert row["hours"] == {str(i): [] for i in range(7)}
    assert row["links"][0]["kind"] == "whatsapp" and row["links"][0]["url"] == "https://wa.me/97143217788"
    assert any(l["kind"] == "maps" and l["labelAr"] for l in row["links"])
