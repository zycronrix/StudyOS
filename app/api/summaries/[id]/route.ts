export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, summaries, lectures } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { id } = await params
  const result = await db
    .select({ summary: summaries, lecture: lectures })
    .from(summaries)
    .innerJoin(lectures, eq(summaries.lectureId, lectures.id))
    .where(eq(summaries.id, id))
  if (!result[0]) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(result[0])
}
