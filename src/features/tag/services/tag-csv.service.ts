import {
  CreateTagInput,
  CreateTagInputSchema,
  type TagCsvCandidate,
  type TagCsvFieldMapping,
} from "@/features/shared/validation/schemas";
import { parseCsvHeaders, parseCsvRows, MAX_FILE_SIZE, MAX_ROWS } from "@/features/transaction/services/csv.service";

/**
 * Tag CSV Import Service
 * Handles CSV parsing, field mapping, and validation for tags
 */

// Field name heuristics for auto-detection
const TAG_FIELD_NAME_PATTERNS: Record<string, string[]> = {
  name: ["name", "tag", "title", "label"],
  color: ["color", "colour", "hex", "hexcolor"],
  description: ["description", "desc", "note", "notes", "comment"],
};

// Required fields for tags
const TAG_REQUIRED_FIELDS = ["name"] as const;

/**
 * Auto-detect field mapping from column names
 */
export function autoDetectTagMapping(
  columns: string[]
): Partial<TagCsvFieldMapping> {
  const mapping: Partial<TagCsvFieldMapping> = {};

  // Normalize column names for matching
  const normalizedColumns = columns.map((col) =>
    col.toLowerCase().trim().replace(/[_\s-]/g, "_")
  );

  // For each tag field, find best matching column
  Object.entries(TAG_FIELD_NAME_PATTERNS).forEach(([field, patterns]) => {
    const normalizedPatterns = patterns.map((p) =>
      p.toLowerCase().replace(/[_\s-]/g, "_")
    );

    for (let i = 0; i < normalizedColumns.length; i++) {
      const normalizedCol = normalizedColumns[i];
      if (normalizedPatterns.some((pattern) => normalizedCol.includes(pattern))) {
        mapping[field] = columns[i];
        break;
      }
    }
  });

  return mapping;
}

/**
 * Validate mapping against required fields
 */
export function validateTagMapping(
  mapping: TagCsvFieldMapping
): { valid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];

  for (const field of TAG_REQUIRED_FIELDS) {
    const mappedColumn = mapping[field];
    if (!mappedColumn || mappedColumn.trim() === "") {
      missingFields.push(field);
    }
  }

  return {
    valid: missingFields.length === 0,
    missingFields,
  };
}

/**
 * Convert CSV row to candidate tag
 */
export function convertRowToTag(
  row: Record<string, string>,
  mapping: TagCsvFieldMapping
): Partial<CreateTagInput> {
  const tag: Partial<CreateTagInput> = {};

  // Map each field
  for (const [field, column] of Object.entries(mapping)) {
    if (!column) continue;

    const rawValue = row[column]?.trim() || "";

    switch (field) {
      case "name":
        tag.name = rawValue;
        break;
      case "color":
        // Validate hex color format
        if (rawValue && /^#[0-9A-Fa-f]{6}$/.test(rawValue)) {
          tag.color = rawValue;
        } else if (rawValue) {
          // Try to add # if missing
          const cleaned = rawValue.replace(/^#/, "");
          if (/^[0-9A-Fa-f]{6}$/.test(cleaned)) {
            tag.color = `#${cleaned}`;
          }
        }
        break;
      case "description":
        tag.description = rawValue || null;
        break;
    }
  }

  return tag;
}

/**
 * Validate candidate tag
 */
export function validateCandidateTag(
  candidate: Partial<CreateTagInput>,
  rawValues: Record<string, string>
): Array<{ field: string; message: string }> {
  const errors: Array<{ field: string; message: string }> = [];

  // Validate required fields
  if (!candidate.name || candidate.name.trim() === "") {
    errors.push({
      field: "name",
      message: "Tag name is required",
    });
  }

  // Try to validate with schema
  try {
    CreateTagInputSchema.parse(candidate);
  } catch (error: any) {
    if (error.errors) {
      for (const err of error.errors) {
        const field = err.path.join(".");
        errors.push({
          field,
          message: err.message || "Validation error",
        });
      }
    }
  }

  return errors;
}

/**
 * Convert rows to candidate tags with validation
 */
export function convertRowsToTagCandidates(
  rows: Record<string, string>[],
  mapping: TagCsvFieldMapping
): TagCsvCandidate[] {
  const candidates: TagCsvCandidate[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    try {
      const tag = convertRowToTag(row, mapping);
      const errors = validateCandidateTag(tag, row);

      // Determine status
      let status: "valid" | "invalid" | "warning" = "valid";
      if (errors.length > 0) {
        status = "invalid";
      }

      candidates.push({
        rowIndex: i,
        status,
        data: tag as CreateTagInput,
        rawValues: row,
        errors,
      });
    } catch (error) {
      candidates.push({
        rowIndex: i,
        status: "invalid",
        data: {} as CreateTagInput,
        rawValues: row,
        errors: [
          {
            field: "general",
            message:
              error instanceof Error ? error.message : "Unknown error occurred",
          },
        ],
      });
    }
  }

  return candidates;
}

// Re-export CSV parsing functions
export { parseCsvHeaders, parseCsvRows, MAX_FILE_SIZE, MAX_ROWS };

