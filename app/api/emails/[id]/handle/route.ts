export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, emails, scoreEvents, users } from "@/lib/db"
import { eq, sql } from "drizzle-orm"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  await db.update(emails)
    .set({ handledAt: new Date(), label: "handled" })
    .where(eq(emails.id, id))
  await db.insert(scoreEvents).values({
    userId: session.user.id, action: "email_handled", points: 8,
  })
  await db.update(users)
    .set({ scholarScore: sql`scholar_score + 8` })
    .where(eq(users.id, session.user.id))
  return NextResponse.json({ success: true })
}
