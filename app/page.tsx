import { redirect } from "next/navigation"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect("/signup")
  }

  if (!(session.user as any)?.onboardingDone) {
    redirect("/onboarding")
  }

  redirect("/ops/dashboard")
}
