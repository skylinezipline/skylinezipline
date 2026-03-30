import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const staffId = searchParams.get("staffId")

  const certs = await db.certificate.findMany({
    where: {
      staff: { organizationId: session.user.organizationId! },
      ...(staffId && { staffId }),
    },
    include: { staff: true },
    orderBy: { expiryDate: "asc" },
  })

  return NextResponse.json(certs)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const cert = await db.certificate.create({ data: body, include: { staff: true } })
  return NextResponse.json(cert, { status: 201 })
}
