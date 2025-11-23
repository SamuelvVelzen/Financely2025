/**
 * Hook that provides a function to highlight search query matches in text
 * @returns A function that takes text and a query string, and returns JSX with highlighted matches
 */
export function useHighlightText() {
  const highlightText = (
    text: string,
    query: string
  ): string | React.ReactNode => {
    if (!query.trim()) return text;

    const regex = new RegExp(
      `(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi"
    );
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, index) =>
          regex.test(part) ? (
            <mark key={index} className="bg-primary/20 text-primary">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return { highlightText };
}
