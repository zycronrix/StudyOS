import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export interface LectureSummary {
  tldr: string[]
  keyPoints: string[]
  examQuestions: string[]
  glossary: { term: string; definition: string }[]
}

export async function generateLectureSummary(
  moduleName: string,
  lectureTitle: string,
  extractedText: string
): Promise<LectureSummary> {
  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 1500,
    temperature: 0.3,
    system: `You are an expert academic summariser for UK university students.
Always respond with valid JSON only. No markdown. No preamble.
Schema: {
  "tldr": string[],
  "keyPoints": string[],
  "examQuestions": string[],
  "glossary": [{ "term": string, "definition": string }]
}
Rules:
- tldr: exactly 5 items, max 20 words each
- keyPoints: exactly 3 plain-English memorable concepts
- examQuestions: 2-3 likely exam or essay questions
- glossary: 3-5 key terms with definitions`,
    messages: [
      {
        role: "user",
        content: `Module: ${moduleName}\nLecture: ${lectureTitle}\nContent: ${extractedText.slice(0, 8000)}`,
      },
    ],
  })

  const text = message.content[0].type === "text" ? message.content[0].text : "{}"
  try {
    return JSON.parse(text) as LectureSummary
  } catch {
    // Retry once
    const retry = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1500,
      temperature: 0.3,
      system: "Return valid JSON only matching the schema provided.",
      messages: [
        {
          role: "user",
          content: `Module: ${moduleName}\nLecture: ${lectureTitle}\nContent: ${extractedText.slice(0, 4000)}\n\nReturn JSON with keys: tldr (array of 5 strings), keyPoints (array of 3 strings), examQuestions (array of 2-3 strings), glossary (array of {term, definition} objects).`,
        },
      ],
    })
    const retryText = retry.content[0].type === "text" ? retry.content[0].text : "{}"
    return JSON.parse(retryText) as LectureSummary
  }
}
