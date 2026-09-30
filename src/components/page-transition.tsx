import { ViewTransition } from "react";

const direction = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "none" } as const;

/**
 * Slides a public page in or out. Links tag themselves with `transitionTypes`
 * ("nav-forward" going deeper, "nav-back" returning); untagged navigations,
 * such as the language toggle, don't animate. Put it in each page, not a layout,
 * because layouts persist and never enter or exit.
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition enter={direction} exit={direction} default="none">
      {children}
    </ViewTransition>
  );
}
