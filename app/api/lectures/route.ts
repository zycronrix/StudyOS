import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, lectures } from "@/lib/db"
import { eq, and, gte, lte } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const weekOffset = parseInt(searchParams.get("week") ?? "0")

  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1 + weekOffset * 7)
  startOfWeek.setHours(0, 0, 0, 0)
  const endOfWeek = new Date(startOfWeek)
  endOfWeek.setDate(startOfWeek.getDate() + 6)
  endOfWeek.setHours(23, 59, 59, 999)

  const result = await db.select().from(lectures).where(
    and(
      eq(lectures.userId, session.user.id),
      gte(lectures.startsAt, startOfWeek),
      lte(lectures.startsAt, endOfWeek)
    )
  )

  return NextResponse.json(result)
}
