import { getSession } from "./server";
import { UnauthorizedError } from "./errors";
import type { Request } from "@tanstack/react-start";

/**
 * Permission Helpers
 * Centralized helper for all permission and access control logic.
 *
 * Current implementation: Simple authenticated/unauthenticated check
 * Future: Will support roles and permissions without breaking API changes
 */
export class PermissionHelpers {
  /**
   * Check if the current user is authenticated (server-side)
   * @param request - The incoming request object
   * @returns true if user is authenticated, false otherwise
   */
  public static async isAuthenticated(request: Request): Promise<boolean> {
    const session = await getSession(request);
    return session !== null;
  }

  /**
   * Check if the current user can access a resource or perform an action (server-side)
   *
   * Current behavior: Returns true if user is authenticated, false otherwise
   * Future: Will support permission-based checks via the action parameter
   *
   * @param request - The incoming request object
   * @param action - Optional action/permission identifier (e.g., 'invoice.read', 'settings.update')
   *                 Currently ignored, but maintains API stability for future role/permission support
   * @returns true if access is allowed, false if denied
   */
  public static async canAccess(request: Request, action?: string): Promise<boolean> {
    // Current implementation: Simple authentication check
    // Future: Will evaluate roles and permissions when implemented
    return this.isAuthenticated(request);
  }

  /**
   * Assert that the current user is authenticated (server-side)
   * @param request - The incoming request object
   * @throws UnauthorizedError if user is not authenticated
   * @returns void
   */
  public static async requireAuth(request: Request): Promise<void> {
    const isAuth = await this.isAuthenticated(request);
    if (!isAuth) {
      throw new UnauthorizedError();
    }
  }
}

