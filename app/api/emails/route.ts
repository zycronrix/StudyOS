export const dynamic = 'force-dynamic'
import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, emails } from "@/lib/db"
import { eq, and, isNull, isNotNull } from "drizzle-orm"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { searchParams } = new URL(request.url)
  const label = searchParams.get("label")

  const conditions: ReturnType<typeof eq>[] = [eq(emails.userId, session.user.id) as ReturnType<typeof eq>]
  if (label === "handled") {
    conditions.push(isNotNull(emails.handledAt) as ReturnType<typeof eq>)
  } else {
    conditions.push(isNull(emails.handledAt) as ReturnType<typeof eq>)
    if (label && label !== "all") {
      conditions.push(eq(emails.label, label) as ReturnType<typeof eq>)
    }
  }

  const result = await db.select().from(emails).where(and(...conditions)).orderBy(emails.receivedAt)
  return NextResponse.json(result)
}
