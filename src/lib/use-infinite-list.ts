"use client";

import { useCallback, useEffect, useState } from "react";

/** Reveals a list page by page as a sentinel scrolls into view. `resetKey` restarts from page one. */
export function useInfiniteList<T>(items: T[], pageSize: number, resetKey: string) {
  const [state, setState] = useState({ key: resetKey, visible: pageSize });
  const [loading, setLoading] = useState(false);
  const [sentinel, setSentinel] = useState<HTMLElement | null>(null);
  // A new filter set starts again from the first page.
  if (state.key !== resetKey) setState({ key: resetKey, visible: pageSize });
  const visible = state.key === resetKey ? state.visible : pageSize;
  const hasMore = visible < items.length;

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return;
    setLoading(true);
    // A short beat so the skeleton rows read as a page loading.
    window.setTimeout(() => {
      setState((s) => ({ ...s, visible: s.visible + pageSize }));
      setLoading(false);
    }, 450);
  }, [loading, hasMore, pageSize]);

  useEffect(() => {
    if (!sentinel || !hasMore) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), { rootMargin: "240px" });
    io.observe(sentinel);
    return () => io.disconnect();
  }, [sentinel, hasMore, loadMore]);

  return { shown: items.slice(0, visible), hasMore, loading, watchEnd: setSentinel };
}
