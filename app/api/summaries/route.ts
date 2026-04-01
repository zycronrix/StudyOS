export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, summaries, lectures } from "@/lib/db"
import { eq, ilike, and, desc } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get("search")
  const module = searchParams.get("module")

  const conditions = [eq(lectures.userId, session.user.id)]
  if (module) conditions.push(eq(lectures.moduleId, module))

  const result = await db
    .select({ summary: summaries, lecture: lectures })
    .from(summaries)
    .innerJoin(lectures, eq(summaries.lectureId, lectures.id))
    .where(and(...conditions))
    .orderBy(desc(summaries.generatedAt))

  if (search) {
    const lower = search.toLowerCase()
    return NextResponse.json(
      result.filter(
        (r) =>
          r.lecture.title?.toLowerCase().includes(lower) ||
          r.lecture.moduleName.toLowerCase().includes(lower)
      )
    )
  }

  return NextResponse.json(result)
}
