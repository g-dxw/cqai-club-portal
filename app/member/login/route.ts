import { redirect } from "next/navigation";
import { getLogtoContext, logtoConfig, signIn } from "@/lib/logto";

export const dynamic = "force-dynamic";

export async function GET() {
  const { isAuthenticated } = await getLogtoContext();

  if (isAuthenticated) {
    redirect("/member/dashboard");
  }

  await signIn(`${logtoConfig.baseUrl}/callback`);
}
