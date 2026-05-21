import { withWorkspaceAuth } from "@/features/auth/workspace-context";
import {
  ApiError,
  createErrorResponse,
  ErrorCodes,
} from "@/features/shared/api/errors";
import {
  CsvTransformRequestSchema,
  CsvTransformResponseSchema,
  CurrencySchema,
  type ICurrency,
} from "@/features/shared/validation/schemas";
import { json } from "@tanstack/react-start";
import { BankSchema } from "../../validation/transaction.schema";
import { convertRowsToCandidates, MAX_ROWS } from "../../services/csv.service";

/**
 * POST /api/v1/:workspaceId/transactions/csv-transform
 * Transform raw CSV rows into candidate transactions using the provided mapping
 * No file upload needed - accepts rows as JSON
 */
export async function POST({
  request,
  params,
}: {
  request: Request;
  params: { workspaceId: string };
}) {
  try {
    return await withWorkspaceAuth(
      params.workspaceId,
      async ({ userId, workspaceId }) => {
      const body = await request.json();

      // Validate request body
      const parseResult = CsvTransformRequestSchema.safeParse(body);
      if (!parseResult.success) {
        return createErrorResponse(
          new ApiError(
            ErrorCodes.VALIDATION_ERROR,
            "Invalid request body",
            400,
            { errors: parseResult.error.issues }
          )
        );
      }

      const { rows, mapping, typeDetectionStrategy, defaultCurrency, bank } =
        parseResult.data;

      const parsedDefaultCurrency =
        defaultCurrency !== undefined
          ? CurrencySchema.parse(defaultCurrency)
          : undefined;
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

      // Validate bank if provided
      const validatedBank = bank ? BankSchema.parse(bank) : undefined;

      // Convert rows to candidates
      const candidates = await convertRowsToCandidates(
        rows,
        mapping,
        userId,
        workspaceId,
        typeDetectionStrategy || "default",
        parsedDefaultCurrency as ICurrency | undefined,
        validatedBank
      );

      // Calculate stats
      const totalValid = candidates.filter((c) => c.status === "valid").length;
      const totalInvalid = candidates.filter(
        (c) => c.status === "invalid"
      ).length;

      const response = CsvTransformResponseSchema.parse({
        candidates,
        total: rows.length,
        totalValid,
        totalInvalid,
      });

      return json(response, { status: 200 });
      }
    );
  } catch (error) {
    return createErrorResponse(error);
  }
}

