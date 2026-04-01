import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, users, scoreEvents } from "@/lib/db"
import { eq, desc } from "drizzle-orm"

const TIERS = [
  { name: "Finding Your Feet", min: 0, max: 499 },
  { name: "Academic Rising", min: 500, max: 1499 },
  { name: "Scholar in Progress", min: 1500, max: 2999 },
  { name: "Distinction Bound", min: 3000, max: 4999 },
  { name: "First Class", min: 5000, max: Infinity },
]

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const user = await db.query.users.findFirst({ where: eq(users.id, session.user.id) })
  const score = user?.scholarScore ?? 0
  const currentTier = TIERS.find((t) => score >= t.min && score <= t.max) ?? TIERS[0]
  const nextTier = TIERS[TIERS.indexOf(currentTier) + 1]
  const recentEvents = await db
    .select()
    .from(scoreEvents)
    .where(eq(scoreEvents.userId, session.user.id))
    .orderBy(desc(scoreEvents.createdAt))
    .limit(20)
  return NextResponse.json({
    score,
    tier: currentTier.name,
    nextTier: nextTier?.name ?? null,
    nextTierPoints: nextTier?.min ?? null,
    progressToNext: nextTier ? Math.round(((score - currentTier.min) / (nextTier.min - currentTier.min)) * 100) : 100,
    streak: user?.streakDays ?? 0,
    recentEvents,
  })
}
