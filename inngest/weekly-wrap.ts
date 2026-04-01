import { inngest } from "./client"
import { db } from "@/lib/db"
import { users, scoreEvents, weeklyWraps, lectures, emails } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"

const TIERS = [
  { name: "Finding Your Feet", min: 0, max: 499 },
  { name: "Academic Rising", min: 500, max: 1499 },
  { name: "Scholar in Progress", min: 1500, max: 2999 },
  { name: "Distinction Bound", min: 3000, max: 4999 },
  { name: "First Class", min: 5000, max: Infinity },
]

export function getTier(score: number) {
  return TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0]
}

type User = typeof users.$inferSelect

export const weeklyWrap = inngest.createFunction(
  { id: "weekly-wrap", name: "Weekly Wrap", triggers: [{ cron: "0 20 * * 0" }] },
  async ({ step }: { step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const allUsers = await step.run("fetch-users", async () => {
      return db.select().from(users)
    })

    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - 7)

    for (const user of allUsers as User[]) {
      await step.run(`wrap-user-${user.id}`, async () => {
        const events = await db
          .select()
          .from(scoreEvents)
          .where(and(eq(scoreEvents.userId, user.id), gte(scoreEvents.createdAt!, weekStart)))

        const weeklyPoints = events.reduce((sum, e) => sum + e.points, 0)

        const weekLectures = await db
          .select()
          .from(lectures)
          .where(and(eq(lectures.userId, user.id), gte(lectures.startsAt, weekStart)))

        const attendedCount = weekLectures.filter((l) => l.attended).length

        const handledEmails = await db
          .select()
          .from(emails)
          .where(and(eq(emails.userId, user.id), gte(emails.receivedAt, weekStart)))

        const tier = getTier(user.scholarScore ?? 0)
        const weekNumber = Math.ceil(
          (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000)
        )

        const stats = {
          weeklyPoints,
          attendedCount,
          totalLectures: weekLectures.length,
          handledEmails: handledEmails.filter((e) => e.handledAt).length,
          tier: tier.name,
          weekNumber,
        }

        await db.insert(weeklyWraps).values({
          userId: user.id,
          weekStart: weekStart.toISOString().split("T")[0],
          stats,
        })
      })
    }

    return { wrapped: allUsers.length }
  }
)
