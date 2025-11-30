import { getUserId } from "./context";
import { UnauthorizedError } from "./errors";

/**
 * Permission Helpers
 * Centralized helper for all permission and access control logic.
 *
 * Current implementation: Simple authenticated/unauthenticated check
 * Future: Will support roles and permissions without breaking API changes
 */
export class PermissionHelpers {
  /**
   * Check if the current user is authenticated
   * @returns true if user is authenticated, false otherwise
   */
  public static isAuthenticated(): boolean {
    const userId = getUserId();
    return userId !== null;
  }

  /**
   * Check if the current user can access a resource or perform an action
   *
   * Current behavior: Returns true if user is authenticated, false otherwise
   * Future: Will support permission-based checks via the action parameter
   *
   * @param action - Optional action/permission identifier (e.g., 'invoice.read', 'settings.update')
   *                 Currently ignored, but maintains API stability for future role/permission support
   * @returns true if access is allowed, false if denied
   */
  public static canAccess(action?: string): boolean {
    // Current implementation: Simple authentication check
    // Future: Will evaluate roles and permissions when implemented
    return this.isAuthenticated();
  }

  /**
   * Assert that the current user is authenticated
   * @throws UnauthorizedError if user is not authenticated
   * @returns void
   */
  public static requireAuth(): void {
    if (!this.isAuthenticated()) {
      throw new UnauthorizedError();
    }
  }
}

