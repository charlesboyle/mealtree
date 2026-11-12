/**
 * "Question? Action" link text: the question stays plain and only the action part after the question mark
 * (`?` or Arabic `؟`) gets the dashed underline, so the underline marks what tapping does. The whole line is
 * still one button/link. Text without a question mark is underlined in full.
 */
export function ActionText({ text }: { text: string }) {
  const m = text.match(/^(.*?[?؟])\s*(.+)$/);
  const action = "underline decoration-dashed decoration-1 underline-offset-4";
  if (!m) return <span className={action}>{text}</span>;
  return (
    // One wrapper so a flex parent keeps the space between the two parts.
    <span>
      {m[1]} <span className={action}>{m[2]}</span>
    </span>
  );
}
