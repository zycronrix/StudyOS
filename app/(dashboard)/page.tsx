"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Progress } from "@/components/ui/progress"
import type { MorningBrief } from "@/lib/ai/brief"

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
}
const item = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }

function DayRatingBadge({ rating }: { rating: string }) {
  if (rating === "heavy")
    return <span className="text-xs px-2 py-0.5 rounded border border-amber-500/20 bg-amber-500/10 text-amber-400 uppercase tracking-widest">heavy day</span>
  if (rating === "light")
    return <span className="text-xs px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 uppercase tracking-widest">light day</span>
  return <span className="text-xs px-2 py-0.5 rounded border border-border bg-secondary text-muted-foreground uppercase tracking-widest">normal day</span>
}

export default function MorningBriefPage() {
  const [brief, setBrief] = useState<MorningBrief | null>(null)
  const [score, setScore] = useState<{ score: number; tier: string; progressToNext: number } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch("/api/brief/today").then((r) => r.json()),
      fetch("/api/score").then((r) => r.json()),
    ]).then(([b, s]) => {
      setBrief(b)
      setScore(s)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  })

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl mx-auto space-y-8">
      {/* Greeting */}
      <motion.div variants={item} className="space-y-2">
        <h1 className="font-display text-3xl text-foreground">
          {brief?.greeting ?? "Good morning."}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">{today}</span>
          {brief?.dayRating && <DayRatingBadge rating={brief.dayRating} />}
        </div>
        {brief?.topPriority && (
          <p className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3 mt-2">
            {brief.topPriority}
          </p>
        )}
      </motion.div>

      {/* Today's Schedule */}
      <motion.div variants={item} className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">today</p>
        {brief?.schedule && brief.schedule.length > 0 ? (
          <div className="space-y-2">
            {brief.schedule.map((lecture, i) => (
              <div key={i} className="border-l-2 border-primary/60 pl-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{lecture.module}</span>
                  {lecture.isOnline && (
                    <span className="text-xs px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">online</span>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{lecture.time} · {lecture.room}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No lectures today</p>
        )}
      </motion.div>

      {/* Needs Attention */}
      <motion.div variants={item} className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">needs attention</p>
        {brief?.emailActions && brief.emailActions.length > 0 ? (
          <div className="space-y-2">
            {brief.emailActions.map((email, i) => (
              <div key={i} className="rounded-md border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className="text-sm font-medium block">{email.from}</span>
                    <span className="text-sm text-muted-foreground truncate block">{email.subject}</span>
                  </div>
                  <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                    email.urgency === "high"
                      ? "border border-red-500/20 bg-red-500/10 text-red-400"
                      : "border border-amber-500/20 bg-amber-500/10 text-amber-400"
                  }`}>{email.urgency}</span>
                </div>
                {email.summary && (
                  <p className="text-xs text-muted-foreground italic mt-1">{email.summary}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Inbox clear</p>
        )}
      </motion.div>

      {/* Due Soon */}
      <motion.div variants={item} className="space-y-3">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">due soon</p>
        {brief?.deadlines && brief.deadlines.length > 0 ? (
          <div className="divide-y divide-border/50">
            {brief.deadlines.map((d, i) => (
              <div key={i} className="flex justify-between items-center py-2">
                <div>
                  <span className="text-sm">{d.title}</span>
                  <span className="text-xs text-muted-foreground block">{d.module}</span>
                </div>
                <span className={`text-xs font-medium ${
                  d.daysLeft <= 1 ? "text-red-400" : d.daysLeft <= 3 ? "text-amber-400" : "text-muted-foreground"
                }`}>
                  {d.daysLeft === 0 ? "today" : d.daysLeft === 1 ? "1 day" : `${d.daysLeft} days`}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Nothing due this week</p>
        )}
      </motion.div>

      {/* Scholar Score Strip */}
      {score && (
        <motion.div variants={item} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-end justify-between mb-3">
            <div>
              <span className="font-display text-5xl text-primary">{score.score}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest block mt-1">{score.tier}</span>
            </div>
          </div>
          <Progress value={score.progressToNext} className="h-1" />
        </motion.div>
      )}
    </motion.div>
  )
}
