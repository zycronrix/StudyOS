export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, morningBriefs, lectures, emails, assignments, users } from "@/lib/db"
import { eq, and, gte, lte } from "drizzle-orm"
import { generateMorningBrief } from "@/lib/ai/brief"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const today = new Date().toISOString().split("T")[0]

  const existing = await db.query.morningBriefs.findFirst({
    where: and(eq(morningBriefs.userId, session.user.id), eq(morningBriefs.briefDate, today)),
  })
  if (existing?.data) return NextResponse.json(existing.data)

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(now)
  todayEnd.setHours(23, 59, 59, 999)

  const [todayLectures, pendingEmails, upcomingDeadlines, user] = await Promise.all([
    db.select().from(lectures).where(
      and(eq(lectures.userId, session.user.id), gte(lectures.startsAt, todayStart), lte(lectures.startsAt, todayEnd))
    ),
    db.select().from(emails).where(
      and(eq(emails.userId, session.user.id), eq(emails.label, "reply-needed"))
    ).limit(5),
    db.select().from(assignments).where(
      and(eq(assignments.userId, session.user.id), gte(assignments.dueDate, now))
    ).limit(5),
    db.query.users.findFirst({ where: eq(users.id, session.user.id) }),
  ])

  const dayDate = now.toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  const brief = await generateMorningBrief(
    user?.name ?? session.user.name ?? "Student",
    user?.course ?? "your course",
    user?.university ?? "your university",
    dayDate, todayLectures, pendingEmails, upcomingDeadlines
  )

  await db.insert(morningBriefs).values({
    userId: session.user.id,
    briefDate: today,
    greeting: brief.greeting,
    dayRating: brief.dayRating,
    topPriority: brief.topPriority,
    data: brief as unknown as Record<string, unknown>,
  }).onConflictDoNothing()

  return NextResponse.json(brief)
}
