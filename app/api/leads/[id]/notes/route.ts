import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { text } = await req.json()
  const note = await db.leadNote.create({
    data: {
      leadId: params.id,
      text,
      author: session.user.name ?? session.user.email ?? "Unknown",
    },
  })
  return NextResponse.json(note, { status: 201 })
}
