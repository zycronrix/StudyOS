import { inngest } from "./client"
import { db } from "@/lib/db"
import { users, accounts, lectures, emails, morningBriefs } from "@/lib/db/schema"
import { eq, and, gte } from "drizzle-orm"
import { classifyEmail, generateDraftReply } from "@/lib/ai/email-triage"
import { generateMorningBrief } from "@/lib/ai/brief"

type User = typeof users.$inferSelect

export const dailySync = inngest.createFunction(
  { id: "daily-sync", name: "Daily Sync", triggers: [{ cron: "30 6 * * *" }] },
  async ({ step }: { step: { run: <T>(id: string, fn: () => Promise<T>) => Promise<T> } }) => {
    const allUsers = await step.run("fetch-users", async () => {
      return db.select().from(users)
    })

    for (const user of allUsers as User[]) {
      await step.run(`sync-user-${user.id}`, async () => {
        const userAccounts = await db
          .select()
          .from(accounts)
          .where(eq(accounts.userId, user.id))

        const googleAccount = userAccounts.find((a) => a.provider === "google")

        const now = new Date()
        const dayDate = now.toLocaleDateString("en-GB", {
          weekday: "long", year: "numeric", month: "long", day: "numeric",
        })

        const todayStart = new Date(now)
        todayStart.setHours(0, 0, 0, 0)

        const todayLectures = await db
          .select()
          .from(lectures)
          .where(and(eq(lectures.userId, user.id), gte(lectures.startsAt, todayStart)))

        const recentEmails = await db
          .select()
          .from(emails)
          .where(and(eq(emails.userId, user.id), eq(emails.label, "reply-needed")))

        if (googleAccount?.access_token) {
          try {
            await syncGmailEmails(user.id, googleAccount.access_token, {
              name: user.name,
              course: user.course ?? "your course",
              university: user.university ?? "your university",
            })
          } catch (e) {
            console.error("Gmail sync failed for user", user.id, e)
          }
        }

        const brief = await generateMorningBrief(
          user.name,
          user.course ?? "student",
          user.university ?? "university",
          dayDate,
          todayLectures,
          recentEmails,
          []
        )

        const today = now.toISOString().split("T")[0]
        await db.insert(morningBriefs).values({
          userId: user.id,
          briefDate: today,
          greeting: brief.greeting,
          dayRating: brief.dayRating,
          topPriority: brief.topPriority,
          data: brief as unknown as Record<string, unknown>,
        }).onConflictDoNothing()
      })
    }

    return { synced: allUsers.length }
  }
)

async function syncGmailEmails(
  userId: string,
  accessToken: string,
  userContext: { name: string; course: string; university: string }
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const query = `after:${Math.floor(since.getTime() / 1000)}`

  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!listRes.ok) return

  const listData = await listRes.json()
  const messages: { id: string }[] = listData.messages ?? []

  for (const msg of messages.slice(0, 10)) {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    )
    if (!msgRes.ok) continue

    const msgData = await msgRes.json()
    const headers: { name: string; value: string }[] = msgData.payload?.headers ?? []

    const fromHeader = headers.find((h) => h.name === "From")?.value ?? ""
    const subject = headers.find((h) => h.name === "Subject")?.value ?? "(no subject)"
    const dateHeader = headers.find((h) => h.name === "Date")?.value

    const fromMatch = fromHeader.match(/^(.*?)\s*<(.+?)>$/)
    const fromName = fromMatch ? fromMatch[1].trim().replace(/"/g, "") : fromHeader
    const fromEmail = fromMatch ? fromMatch[2] : fromHeader
    const snippet = ((msgData.snippet as string) ?? "").slice(0, 150)

    const classification = await classifyEmail(fromName, fromEmail, subject, snippet)

    let draftReply: string | undefined
    if (classification.label === "reply-needed") {
      const draft = await generateDraftReply(
        userContext.name, userContext.course, userContext.university, fromName, subject, snippet
      )
      draftReply = `Subject: ${draft.subject}\n\n${draft.body}`
    }

    await db.insert(emails).values({
      userId,
      provider: "gmail",
      providerMsgId: msg.id,
      fromName, fromEmail, subject,
      previewText: snippet,
      aiSummary: classification.summary,
      label: classification.label,
      draftReply,
      urgency: classification.urgency,
      receivedAt: dateHeader ? new Date(dateHeader) : new Date(),
    }).onConflictDoNothing()
  }
}
