import { redirect } from "next/navigation";
import { getLogtoContext } from "@/lib/logto";
import { hasMemberAdminPermission } from "@/lib/member/permissions";

export const dynamic = "force-dynamic";

export default async function MemberAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, claims } = await getLogtoContext();

  if (!isAuthenticated) {
    redirect("/member/sign-in");
  }

  if (!hasMemberAdminPermission(claims)) {
    redirect("/member/dashboard");
  }

  return children;
}
