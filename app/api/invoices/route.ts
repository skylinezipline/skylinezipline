import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")

  const invoices = await db.invoice.findMany({
    where: {
      location: { organizationId: session.user.organizationId! },
      ...(locationId && { locationId }),
    },
    include: { lineItems: true },
    orderBy: { issuedDate: "desc" },
  })

  return NextResponse.json(invoices)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { lineItems, ...data } = await req.json()
  const invoice = await db.invoice.create({
    data: { ...data, lineItems: { create: lineItems ?? [] } },
    include: { lineItems: true },
  })
  return NextResponse.json(invoice, { status: 201 })
}
