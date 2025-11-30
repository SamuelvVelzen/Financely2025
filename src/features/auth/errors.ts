/**
 * Unauthorized Error
 * Thrown when a user attempts to access a resource without proper authentication
 */
export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

