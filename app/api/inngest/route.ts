export const dynamic = 'force-dynamic'
import { serve } from "inngest/next"
import { inngest } from "@/inngest/client"
import { dailySync } from "@/inngest/daily-sync"
import { weeklyWrap } from "@/inngest/weekly-wrap"

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [dailySync, weeklyWrap],
})
