import { NextResponse } from "next/server";
import { getLogtoContext } from "@/lib/logto";

type ClaimsWithRoles = {
  roles?: unknown;
};

const DEFAULT_MEMBER_ADMIN_ROLES = ["admin"];

export function getMemberAdminRoles(): string[] {
  const configuredRoles = process.env.MEMBER_ADMIN_ROLES
    ?.split(",")
    .map(role => role.trim())
    .filter(Boolean);

  return configuredRoles?.length ? configuredRoles : DEFAULT_MEMBER_ADMIN_ROLES;
}

export function hasMemberAdminPermission(
  claims: ClaimsWithRoles | null | undefined
): boolean {
  const roles = Array.isArray(claims?.roles)
    ? claims.roles.filter((role): role is string => typeof role === "string")
    : [];

  return getMemberAdminRoles().some(role => roles.includes(role));
}

/**
 * Protect APIs that are available from the member-center admin pages.
 * The old standalone admin token remains supported for the legacy /admin UI.
 */
export async function requireMemberAdminPermission(): Promise<NextResponse | null> {
  const { isAuthenticated, claims } = await getLogtoContext();

  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "请先登录会员中心。" },
      { status: 401 }
    );
  }

  if (!hasMemberAdminPermission(claims)) {
    return NextResponse.json(
      { error: "您没有访问该管理页面的权限。" },
      { status: 403 }
    );
  }

  return null;
}
