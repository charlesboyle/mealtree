"use client";

import { useCallback, useEffect, useState } from "react";
import { LanguageToggle } from "@/components/language-toggle";
import { SearchSheet } from "@/components/search-sheet";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TabBar } from "@/components/tab-bar";
import { OPEN_SEARCH_EVENT } from "@/lib/search-events";
import { usePageScroll } from "@/lib/use-page-scroll";
import { useRoute } from "@/lib/use-route";

/** Header, content fade, footer, tab bar and phone search: the frame every public page sits in. */
export function SiteShell({ children }: { children: React.ReactNode }) {
  const route = useRoute();
  const onRestaurant = route.startsWith("/r/");
  const [searchOpen, setSearchOpen] = useState(false);
  const closeSearch = useCallback(() => setSearchOpen(false), []);

  usePageScroll(route);

  useEffect(() => {
    const open = () => setSearchOpen(true);
    window.addEventListener(OPEN_SEARCH_EVENT, open);
    return () => window.removeEventListener(OPEN_SEARCH_EVENT, open);
  }, []);

  return (
    <div className="flex min-h-dvh w-full flex-col overflow-x-clip bg-cream text-ink">
      <SiteHeader languageToggle={<LanguageToggle />} />
      <div className="flex-1">{children}</div>
      <SiteFooter bare={onRestaurant} />
      <TabBar hidden={onRestaurant} />
      <SearchSheet open={searchOpen} onClose={closeSearch} />
    </div>
  );
}
