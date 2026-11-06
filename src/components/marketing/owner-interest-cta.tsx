"use client";

import { useCallback, useEffect, useState } from "react";
import { buttonStyles } from "@/components/marketing/button-link";
import { OwnerInterestForm } from "@/components/owner-interest-form";
import type { OwnerInterestSource } from "@/lib/surveys";

/**
 * Pill button that opens the owner interest form, with the restaurant typed in by the visitor.
 * `autoOpen` (one per page) also opens it for `?claim=1`, which the old /claim route redirects here with.
 */
export function OwnerInterestCta({ children, className, autoOpen }: { children: React.ReactNode; className?: string; autoOpen?: boolean }) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState<OwnerInterestSource>("for_restaurants");
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!autoOpen) return;
    const openFromQuery = () => {
      const params = new URLSearchParams(location.search);
      if (params.get("claim") !== "1") return;
      params.delete("claim");
      const rest = params.toString();
      history.replaceState(null, "", location.pathname + (rest ? `?${rest}` : "") + location.hash);
      setSource("claim_redirect");
      setOpen(true);
    };
    openFromQuery();
  }, [autoOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setSource("for_restaurants");
          setOpen(true);
        }}
        className={buttonStyles("primary", className)}
      >
        {children}
      </button>
      <OwnerInterestForm open={open} onClose={close} source={source} />
    </>
  );
}
