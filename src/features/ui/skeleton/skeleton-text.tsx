import { useMemo } from "react";
import { Skeleton } from "./skeleton";

export interface ISkeletonTextProps {
  className?: string;
  lines?: number;
  width?: string | number;
  randomizeWidth?: boolean;
  minWidth?: number;
  maxWidth?: number;
  alineas?: number;
}

/**
 * Generate a random width based on base width with ±20% variation
 */
function getRandomWidth(baseWidth: number): number {
  // Add random variation between -20% and +20%
  const variation = (Math.random() - 0.5) * 40; // -20 to +20
  const randomWidth = baseWidth + variation;

  // Clamp between 0 and 100
  // If base is 100%, it can vary from 80% to 100%
  return Math.max(0, Math.min(100, randomWidth));
}

export function SkeletonText({
  className = "",
  lines = 1,
  width = "100%",
  randomizeWidth = true,
  alineas = 1,
}: ISkeletonTextProps) {
  // Extract numeric value from width prop
  const baseWidth =
    typeof width === "string" && width.includes("%")
      ? parseFloat(width)
      : typeof width === "number"
        ? width
        : 100;

  // Generate random widths once and memoize them
  const randomWidths = useMemo(() => {
    if (!randomizeWidth || lines <= 1) {
      return null;
    }
    return Array.from({ length: lines }, () => getRandomWidth(baseWidth));
  }, [randomizeWidth, lines, baseWidth]);

  // Calculate lines per paragraph
  const linesPerParagraph = Math.ceil(lines / alineas);
  let lineIndex = 0;

  return (
    <div className={className}>
      {Array.from({ length: alineas }).map((_, paragraphIndex) => {
        const paragraphLines = Math.min(linesPerParagraph, lines - lineIndex);

        return (
          <div
            key={paragraphIndex}
            className={paragraphIndex > 0 ? "mt-4" : ""}>
            {Array.from({ length: paragraphLines }).map(
              (_, lineInParagraph) => {
                const currentLineIndex = lineIndex++;
                let lineWidth: string | number = width;

                if (randomWidths) {
                  lineWidth = `${randomWidths[currentLineIndex]}%`;
                }

                return (
                  <Skeleton
                    key={lineInParagraph}
                    height={16}
                    width={lineWidth}
                    className="h-4 mb-2"
                  />
                );
              }
            )}
          </div>
        );
      })}
    </div>
  );
}
