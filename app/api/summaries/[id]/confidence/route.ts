export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, summaries, scoreEvents, users } from "@/lib/db"
import { eq, sql } from "drizzle-orm"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const { confidence } = await request.json()
  if (typeof confidence !== "number" || confidence < 1 || confidence > 5) {
    return NextResponse.json({ error: "Invalid confidence" }, { status: 400 })
  }
  await db.update(summaries).set({ confidence }).where(eq(summaries.id, id))
  await db.insert(scoreEvents).values({
    userId: session.user.id, action: "confidence_rating", points: 5,
  })
  await db.update(users)
    .set({ scholarScore: sql`scholar_score + 5` })
    .where(eq(users.id, session.user.id))
  return NextResponse.json({ success: true })
}
