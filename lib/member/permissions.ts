import { NextResponse } from "next/server";
import { getLogtoContext } from "@/lib/logto";
import { CQAI_API_RESOURCE } from "@/lib/logto/config";

export const PLUGIN_ADMIN_PERMISSION = "plugin:admin";
export const MEMBER_ADMIN_PERMISSION = "member:admin";

type PermissionContext = {
  isAuthenticated: boolean;
  scopes?: unknown;
};

export function hasApiPermission(
  scopes: unknown,
  requiredPermission: string
): boolean {
  return Array.isArray(scopes) && scopes.some(scope => scope === requiredPermission);
}

async function hasResourcePermission(requiredPermission: string): Promise<boolean> {
  try {
    const context = await getLogtoContext(CQAI_API_RESOURCE);
    return context.isAuthenticated && hasApiPermission(context.scopes, requiredPermission);
  } catch (error) {
    console.error("Member-center permission check failed:", error);
    return false;
  }
}

/** Check the resource-scoped member permission used by member admin pages. */
export function hasMemberAdminPermission(): Promise<boolean> {
  return hasResourcePermission(MEMBER_ADMIN_PERMISSION);
}

/** Check the resource-scoped plugin permission used by the plugin market. */
export function hasPluginAdminPermission(): Promise<boolean> {
  return hasResourcePermission(PLUGIN_ADMIN_PERMISSION);
}

/**
 * Protect member-center APIs with a scope granted on the CQAI API resource.
 * The old role and standalone admin-token checks are intentionally not used.
 */
export async function requireMemberAdminPermission(
  requiredPermission = MEMBER_ADMIN_PERMISSION
): Promise<NextResponse | null> {
  let context: PermissionContext;

  try {
    context = await getLogtoContext(CQAI_API_RESOURCE);
  } catch (error) {
    console.error("Member-center authorization check failed:", error);
    return NextResponse.json(
      { error: "请先登录会员中心。" },
      { status: 401 }
    );
  }

  if (!context.isAuthenticated) {
    return NextResponse.json(
      { error: "请先登录会员中心。" },
      { status: 401 }
    );
  }

  if (!hasApiPermission(context.scopes, requiredPermission)) {
    return NextResponse.json(
      { error: `您没有 ${requiredPermission} 权限。` },
      { status: 403 }
    );
  }

  return null;
}
