import { withAuth } from "@/features/auth/context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import { CsvUploadResponseSchema } from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import {
  MAX_FILE_SIZE,
  MAX_ROWS,
  parseAllCsvRows,
} from "../../services/csv.service";

/**
 * POST /api/v1/transactions/csv/upload
 * Accept CSV file, validate type/size, parse headers, return columns + sample rows
 */
export async function POST({ request }: { request: Request }) {
  try {
    return await withAuth(async () => {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;

      if (!file) {
        return createErrorResponse(
          new ApiError(ErrorCodes.VALIDATION_ERROR, "No file provided", 400)
        );
      }

      // Validate file type
      const validMimeTypes = ["text/csv", "application/csv", "text/plain"];
      const validExtensions = [".csv"];
      const fileName = file.name.toLowerCase();
      const hasValidExtension = validExtensions.some((ext) =>
        fileName.endsWith(ext)
      );
      const hasValidMimeType =
        validMimeTypes.includes(file.type) || file.type === "";

      if (!hasValidExtension && !hasValidMimeType) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Invalid file type. Only CSV files are allowed.",
            400
          )
        );
      }

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `File too large. Maximum size is ${MAX_FILE_SIZE / 1024 / 1024}MB`,
            400
          )
        );
      }

      if (file.size === 0) {
        return createErrorResponse(
          new ApiError(ErrorCodes.VALIDATION_ERROR, "File is empty", 400)
        );
      }

      // Parse all CSV rows
      let columns: string[];
      let rows: Record<string, string>[];
      try {
        const parsed = await parseAllCsvRows(file);
        columns = parsed.columns;
        rows = parsed.rows;
      } catch (error) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            error instanceof Error ? error.message : "Failed to parse CSV",
            400
          )
        );
      }

      // Check row count limit
      if (rows.length > MAX_ROWS) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            `Too many rows. Maximum is ${MAX_ROWS} rows per import.`,
            400
          )
        );
      }

      const response = CsvUploadResponseSchema.parse({
        columns,
        rows,
      });

      return json(response, { status: 200 });
    });
  } catch (error) {
    return createErrorResponse(error);
  }
}
