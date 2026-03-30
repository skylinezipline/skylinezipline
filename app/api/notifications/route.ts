import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notifications = await db.notification.findMany({
    where: { organizationId: session.user.organizationId! },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  return NextResponse.json(notifications)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids, read } = await req.json()
  await db.notification.updateMany({
    where: {
      organizationId: session.user.organizationId!,
      ...(ids ? { id: { in: ids } } : {}),
    },
    data: { read },
  })
  return NextResponse.json({ success: true })
}
