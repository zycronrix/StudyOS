import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db, users } from "@/lib/db"
import { eq } from "drizzle-orm"

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const { university, course } = await request.json()
  await db.update(users).set({ university, course }).where(eq(users.id, session.user.id))
  return NextResponse.json({ success: true })
}
