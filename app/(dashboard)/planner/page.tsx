"use client"

import { useEffect, useState } from "react"
import { Skeleton } from "@/components/ui/skeleton"

interface Assignment {
  id: string
  moduleName: string
  title: string
  dueDate: string
  submittedAt: string | null
}

function getDaysLeft(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function PlannerPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // For now show a placeholder — Aula sync not yet connected
    setLoading(false)
  }, [])

  const upcoming = assignments.filter((a) => !a.submittedAt && getDaysLeft(a.dueDate) >= 0)
  const submitted = assignments.filter((a) => a.submittedAt)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl text-foreground">Smart Planner</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Deadlines and assignments from Aula, combined into one view.
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : upcoming.length === 0 ? (
        <div className="rounded-md border border-border bg-card p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          <p className="text-xs text-muted-foreground">Connect your Aula account to see assignments here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">upcoming</p>
          {upcoming
            .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
            .map((assignment) => {
              const daysLeft = getDaysLeft(assignment.dueDate)
              return (
                <div key={assignment.id} className="flex items-center justify-between rounded-md border border-border bg-card p-4">
                  <div>
                    <p className="text-sm font-medium">{assignment.title}</p>
                    <p className="text-xs text-muted-foreground">{assignment.moduleName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {new Date(assignment.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                    <p className={`text-xs font-medium ${daysLeft <= 1 ? "text-red-400" : daysLeft <= 3 ? "text-amber-400" : "text-muted-foreground"}`}>
                      {daysLeft === 0 ? "due today" : daysLeft === 1 ? "1 day left" : `${daysLeft} days left`}
                    </p>
                  </div>
                </div>
              )
            })}
        </div>
      )}
    </div>
  )
}
