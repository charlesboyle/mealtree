import { CheckIcon } from "lucide-react";
import React from "react";

export type ComparisonRow = { label: string; ours: string; theirs: string };

/** Two-column comparison. On narrow screens each row's label becomes a small heading above its values. */
export function ComparisonTable({
  caption,
  topic,
  oursHeading,
  theirsHeading,
  rows,
}: {
  caption: string;
  topic: string;
  oursHeading: string;
  theirsHeading: string;
  rows: ComparisonRow[];
}) {
  return (
    <div className="mt-6 overflow-hidden rounded-lg border border-line bg-surface">
      <table className="w-full table-fixed text-start text-sm sm:text-[15px]">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="border-b border-line text-[13px] text-muted">
            <th scope="col" className="hidden w-1/3 px-6 py-4 text-start font-medium sm:table-cell">
              <span className="sr-only">{topic}</span>
            </th>
            <th scope="col" className="px-4 py-4 text-start text-lg font-bold text-plum sm:px-6">
              {oursHeading}
            </th>
            <th scope="col" className="px-4 py-4 text-start font-medium sm:px-6">
              {theirsHeading}
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <React.Fragment key={p.label}>
              <tr className="border-t border-line sm:hidden">
                <th colSpan={2} scope="rowgroup" className="bg-paper px-4 py-2 text-start text-xs font-semibold text-muted">
                  {p.label}
                </th>
              </tr>
              <tr className="border-line sm:border-t">
                <th scope="row" className="hidden px-6 py-4 text-start font-medium text-plum sm:table-cell">
                  {p.label}
                </th>
                <td className="px-4 py-4 font-semibold text-plum sm:px-6">
                  <span className="flex items-center gap-2">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-fresh text-white" aria-hidden>
                      <CheckIcon className="h-3 w-3" strokeWidth={3} />
                    </span>
                    <span>{p.ours}</span>
                  </span>
                </td>
                <td className="px-4 py-4 text-muted sm:px-6">{p.theirs}</td>
              </tr>
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
