"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { MenuSubmissionHost } from "@/components/menu-submission-form";
import { SearchSheet } from "@/components/search-sheet";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TabBar } from "@/components/tab-bar";
import { noteRouteChange } from "@/lib/nav-history";
import { OPEN_SEARCH_EVENT } from "@/lib/search-events";
import { usePageScroll } from "@/lib/use-page-scroll";
import { useRoute } from "@/lib/use-route";

/** Header, content fade, footer, tab bar and phone search: the frame every public page sits in. `knownSlugs` are the published restaurants, so the Saved badge skips removed ones. */
export function SiteShell({ children, knownSlugs }: { children: React.ReactNode; knownSlugs: string[] }) {
  const route = useRoute();
  const onRestaurant = route.startsWith("/r/");
  // The map fills the screen below the header: no footer, no tab bar.
  const onMap = route === "/map";
  const lastRoute = useRef(route);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  usePageScroll(route);

  useEffect(() => {
    if (lastRoute.current === route) return;
    lastRoute.current = route;
    noteRouteChange();
  }, [route]);

  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-clip bg-cream text-ink">
      <SiteHeader languageToggle={<LanguageToggle />} knownSlugs={knownSlugs} />
      <div className="flex-1">{children}</div>
      {!onMap && <SiteFooter bare={onRestaurant} />}
      <TabBar hidden={onRestaurant || onMap} knownSlugs={knownSlugs} />
      <SearchSheet open={searchOpen} onClose={closeSearch} />
      <MenuSubmissionHost />
    </div>
  );
}
