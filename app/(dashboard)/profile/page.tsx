"use client"

import { useEffect, useRef, useState } from "react"
import { motion, useMotionValue, useTransform, animate } from "framer-motion"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface ScoreData {
  score: number
  tier: string
  nextTier: string | null
  nextTierPoints: number | null
  progressToNext: number
  streak: number
  recentEvents: { id: string; action: string; points: number; createdAt: string }[]
}

function AnimatedScore({ target }: { target: number }) {
  const count = useMotionValue(0)
  const rounded = useTransform(count, Math.round)
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const controls = animate(count, target, { duration: 1.5, ease: "easeOut" })
    const unsub = rounded.on("change", setDisplay)
    return () => { controls.stop(); unsub() }
  }, [target])

  return <span className="font-display text-7xl text-primary tabular-nums">{display}</span>
}

function ScoreArc({ progress }: { progress: number }) {
  const r = 80
  const cx = 100
  const cy = 100
  const circumference = Math.PI * r
  const offset = circumference - (progress / 100) * circumference

  return (
    <svg viewBox="0 0 200 110" className="w-48 h-28">
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke="hsl(220, 10%, 16%)"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d={`M ${cx - r},${cy} A ${r},${r} 0 0 1 ${cx + r},${cy}`}
        fill="none"
        stroke="hsl(38, 45%, 64%)"
        strokeWidth="8"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1.5s ease-out" }}
      />
    </svg>
  )
}

const ACTION_LABELS: Record<string, string> = {
  confidence_rating: "Rated a summary",
  email_handled: "Handled an email",
  lecture_attended: "Attended a lecture",
  summary_read: "Read a summary",
}

export default function ProfilePage() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch("/api/score")
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function downloadCard() {
    const { default: html2canvas } = await import("html2canvas")
    if (!cardRef.current) return
    const canvas = await html2canvas(cardRef.current, { backgroundColor: "hsl(220, 13%, 9%)", scale: 2 })
    const link = document.createElement("a")
    link.download = "studyos-weekly-wrapped.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="max-w-2xl mx-auto space-y-10">
      {/* Score Hero */}
      <div className="flex flex-col items-center text-center space-y-2">
        <ScoreArc progress={data.progressToNext} />
        <AnimatedScore target={data.score} />
        <p className="text-xs text-muted-foreground uppercase tracking-widest">{data.tier}</p>
        {data.nextTier && (
          <p className="text-xs text-muted-foreground">
            {data.nextTierPoints! - data.score} pts to <span className="text-primary">{data.nextTier}</span>
          </p>
        )}
        {data.streak > 0 && (
          <p className="text-xs text-muted-foreground">{data.streak} day streak</p>
        )}
      </div>

      {/* Recent Activity */}
      {data.recentEvents.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">recent activity</p>
          <div className="space-y-1">
            {data.recentEvents.slice(0, 10).map((event) => (
              <div key={event.id} className="flex justify-between items-center py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">{ACTION_LABELS[event.action] ?? event.action}</span>
                <span className="text-xs text-primary">+{event.points} pts</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weekly Wrapped Card */}
      <div className="space-y-4">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">weekly wrapped</p>
        <div
          ref={cardRef}
          className="rounded-lg border border-border bg-card p-6 aspect-square max-w-xs mx-auto flex flex-col justify-between"
        >
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest">studyos</p>
            <p className="text-xs text-muted-foreground mt-1">weekly wrapped</p>
          </div>
          <div className="text-center">
            <p className="font-display text-6xl text-primary">{data.score}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-2">{data.tier}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">by morrix labs</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Button variant="outline" size="sm" onClick={downloadCard}>
            <Download className="h-3.5 w-3.5 mr-2" />
            Download card
          </Button>
        </div>
      </div>
    </div>
  )
}
