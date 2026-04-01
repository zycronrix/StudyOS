import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface EmailClassification {
  label: "reply-needed" | "read-and-note" | "fyi" | "spam"
  summary: string
  urgency: "high" | "normal" | "low"
}

export interface EmailDraft {
  subject: string
  body: string
}

export async function classifyEmail(
  fromName: string,
  fromEmail: string,
  subject: string,
  previewText: string
): Promise<EmailClassification> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 200,
    temperature: 0.1,
    system: `Classify this email for a UK university student.
Respond with JSON only: {
  "label": "reply-needed" | "read-and-note" | "fyi" | "spam",
  "summary": string,
  "urgency": "high" | "normal" | "low"
}
summary must be max 12 words.`,
    messages: [
      {
        role: "user",
        content: `From: ${fromName} <${fromEmail}>\nSubject: ${subject}\nPreview: ${previewText}`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text) as EmailClassification
  } catch {
    return { label: "fyi", summary: "Unable to classify", urgency: "low" }
  }
}

export async function generateDraftReply(
  studentName: string,
  course: string,
  university: string,
  fromName: string,
  subject: string,
  previewText: string
): Promise<EmailDraft> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 400,
    temperature: 0.7,
    system: `Write an email reply for a UK university student.
Professional but natural. Never use 'I hope this email finds you well'.
Respond with JSON only: { "subject": string, "body": string }`,
    messages: [
      {
        role: "user",
        content: `Student: ${studentName}, studying ${course} at ${university}\nOriginal email from ${fromName}:\nSubject: ${subject}\n${previewText}`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text) as EmailDraft
  } catch {
    return { subject: `Re: ${subject}`, body: "Thank you for your email." }
  }
}
