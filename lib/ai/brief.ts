import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface MorningBrief {
  greeting: string
  dayRating: "light" | "normal" | "heavy"
  topPriority: string
  schedule: { time: string; module: string; room: string; isOnline: boolean }[]
  emailActions: { from: string; subject: string; summary: string; urgency: string }[]
  deadlines: { title: string; module: string; dueDate: string; daysLeft: number }[]
}

export async function generateMorningBrief(
  name: string,
  course: string,
  university: string,
  dayDate: string,
  lectures: unknown[],
  emailActions: unknown[],
  deadlines: unknown[]
): Promise<MorningBrief> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 800,
    temperature: 0.5,
    system: `Generate a daily academic brief for a UK university student.
Respond with JSON only: {
  "greeting": string,
  "dayRating": "light" | "normal" | "heavy",
  "topPriority": string,
  "schedule": [{ "time": string, "module": string, "room": string, "isOnline": boolean }],
  "emailActions": [{ "from": string, "subject": string, "summary": string, "urgency": string }],
  "deadlines": [{ "title": string, "module": string, "dueDate": string, "daysLeft": number }]
}`,
    messages: [
      {
        role: "user",
        content: `Student: ${name}, ${course} at ${university}
Today: ${dayDate}
Timetable: ${JSON.stringify(lectures)}
Emails: ${JSON.stringify(emailActions)}
Deadlines: ${JSON.stringify(deadlines)}`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text) as MorningBrief
  } catch {
    return {
      greeting: `Good morning, ${name}.`,
      dayRating: "normal",
      topPriority: "Check your schedule",
      schedule: [],
      emailActions: [],
      deadlines: [],
    }
  }
}
