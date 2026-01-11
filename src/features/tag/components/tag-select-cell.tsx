interface ITagMetadata {
  id: string;
  color: string | null;
  emoticon: string | null;
}

interface ITagSelectCellProps {
  tagIds?: string[];
  primaryTagId?: string | null;
  tagMetadataJson?: string;
}

export function TagSelectCell({
  tagIds = [],
  primaryTagId = null,
  tagMetadataJson,
}: ITagSelectCellProps) {
  // Parse tag metadata from rawValues
  let tagMetadata: Record<string, ITagMetadata> = {};
  try {
    if (tagMetadataJson) {
      tagMetadata = JSON.parse(tagMetadataJson);
    }
  } catch {
    // Ignore parse errors
  }

  const tagNames = tagIds || [];
  const primaryTagName = primaryTagId || null;

  if (tagNames.length === 0 && !primaryTagName) {
    return <span className="text-sm text-text-muted">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {/* Primary tag */}
      {primaryTagName && (
        <div className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-hover border border-border">
          {tagMetadata[primaryTagName]?.emoticon && (
            <span className="text-sm">
              {tagMetadata[primaryTagName].emoticon}
            </span>
          )}
          {tagMetadata[primaryTagName]?.color && (
            <div
              className="size-2.5 rounded-full shrink-0"
              style={{
                backgroundColor: tagMetadata[primaryTagName].color,
              }}
            />
          )}
          <span className="font-medium">{primaryTagName}</span>
        </div>
      )}
      {/* Other tags */}
      {tagNames.map((tagName, idx) => {
        if (tagName === primaryTagName) return null; // Skip if it's the primary tag
        const metadata = tagMetadata[tagName];
        return (
          <div
            key={idx}
            className="flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-surface-hover border border-border">
            {metadata?.emoticon && (
              <span className="text-sm">{metadata.emoticon}</span>
            )}
            {metadata?.color && (
              <div
                className="size-2.5 rounded-full shrink-0"
                style={{ backgroundColor: metadata.color }}
              />
            )}
            <span>{tagName}</span>
          </div>
        );
      })}
    </div>
  );
}
