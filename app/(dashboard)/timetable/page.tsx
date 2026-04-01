"use client"

import { useEffect, useState } from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface Lecture {
  id: string
  moduleName: string
  moduleColor: string | null
  title: string | null
  startsAt: string
  endsAt: string | null
  room: string | null
  isOnline: boolean | null
  summaryReady: boolean | null
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const MODULE_COLORS = [
  "#c4956a", "#7c9a8c", "#8b7eb8", "#9a7c7c", "#7c8b9a", "#9a8b7c", "#7c9a7c",
]

function getModuleColor(moduleName: string, storedColor: string | null): string {
  if (storedColor) return storedColor
  let hash = 0
  for (let i = 0; i < moduleName.length; i++) hash = moduleName.charCodeAt(i) + ((hash << 5) - hash)
  return MODULE_COLORS[Math.abs(hash) % MODULE_COLORS.length]
}

function groupByDay(lectures: Lecture[]): Record<string, Lecture[]> {
  const grouped: Record<string, Lecture[]> = {}
  DAYS.forEach((d) => (grouped[d] = []))
  lectures.forEach((l) => {
    const date = new Date(l.startsAt)
    const dayIndex = (date.getDay() + 6) % 7
    const dayName = DAYS[dayIndex]
    grouped[dayName] = [...(grouped[dayName] ?? []), l]
  })
  return grouped
}

function getWeekLabel(offset: number): string {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1 + offset * 7)
  const weekNum = Math.ceil((startOfWeek.getTime() - new Date(startOfWeek.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))
  return offset === 0 ? `This Week (Week ${weekNum})` : offset === 1 ? `Next Week (Week ${weekNum})` : `Week ${weekNum}`
}

export default function TimetablePage() {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [weekOffset, setWeekOffset] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    fetch(`/api/lectures?week=${weekOffset}`)
      .then((r) => r.json())
      .then((data) => { setLectures(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [weekOffset])

  const grouped = groupByDay(lectures)
  const activeDays = DAYS.filter((d) => grouped[d].length > 0)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-xs text-muted-foreground tracking-widest uppercase">{getWeekLabel(weekOffset)}</span>
        <Button variant="ghost" size="icon" onClick={() => setWeekOffset((w) => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : activeDays.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No lectures this week</div>
      ) : (
        <div className="space-y-6">
          {DAYS.map((day) => {
            const dayLectures = grouped[day]
            if (dayLectures.length === 0) return null
            return (
              <div key={day}>
                <p className="text-xs text-muted-foreground uppercase tracking-widest mb-2">{day}</p>
                <div className="space-y-2">
                  {dayLectures
                    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
                    .map((lecture) => {
                      const color = getModuleColor(lecture.moduleName, lecture.moduleColor)
                      const isPast = new Date(lecture.startsAt) < new Date()
                      return (
                        <Link
                          key={lecture.id}
                          href={lecture.summaryReady ? `/summaries/${lecture.id}` : "#"}
                          className={`block rounded-md border border-border bg-card p-3 transition-opacity ${isPast ? "opacity-40" : "hover:bg-accent"}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-0.5 self-stretch rounded-full shrink-0" style={{ backgroundColor: color }} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-medium">{lecture.moduleName}</span>
                                {lecture.isOnline && (
                                  <span className="text-xs px-1.5 py-0.5 rounded border border-blue-500/20 bg-blue-500/10 text-blue-400">online</span>
                                )}
                                {lecture.summaryReady && (
                                  <span className="text-xs px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">summary ready</span>
                                )}
                              </div>
                              {lecture.title && <p className="text-xs text-muted-foreground mt-0.5">{lecture.title}</p>}
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(lecture.startsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
                                  {lecture.endsAt && ` — ${new Date(lecture.endsAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`}
                                </span>
                                {lecture.room && <span className="text-xs text-muted-foreground">{lecture.room}</span>}
                              </div>
                            </div>
                          </div>
                        </Link>
                      )
                    })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
