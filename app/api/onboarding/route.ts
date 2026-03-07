import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { companyName, website, phone, locationName, city, state, timezone } = await req.json()

    // Create org
    const slug = companyName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")

    const org = await db.organization.create({
      data: {
        name: companyName,
        slug: `${slug}-${Date.now()}`,
        website: website || null,
        phone: phone || null,
      },
    })

    // Create first location
    await db.location.create({
      data: {
        organizationId: org.id,
        name: locationName,
        city: city || null,
        state: state || null,
        timezone: timezone || "America/New_York",
      },
    })

    // Mark user as onboarded
    await db.user.update({
      where: { id: (session.user as any).id },
      data: { organizationId: org.id, onboardingDone: true },
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
