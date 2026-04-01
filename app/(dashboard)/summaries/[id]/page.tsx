"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"

interface GlossaryItem { term: string; definition: string }
interface Summary {
  id: string
  tldr: string[] | null
  keyPoints: string[] | null
  examQuestions: string[] | null
  glossary: GlossaryItem[] | null
  confidence: number | null
}
interface Lecture { moduleName: string; title: string | null }

function ConfidenceSquares({ value, onChange }: { value: number | null; onChange: (v: number) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(null)}
          onClick={() => onChange(n)}
          className={`h-5 w-5 rounded-sm border transition-colors ${
            n <= (hovered ?? value ?? 0)
              ? "bg-primary border-primary"
              : "bg-transparent border-border hover:border-primary/50"
          }`}
        />
      ))}
    </div>
  )
}

export default function SummaryDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [data, setData] = useState<{ summary: Summary; lecture: Lecture } | null>(null)
  const [loading, setLoading] = useState(true)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch(`/api/summaries/${id}`)
      .then((r) => r.json())
      .then((d) => {
        setData(d)
        setConfidence(d?.summary?.confidence ?? null)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  async function saveConfidence(value: number) {
    setConfidence(value)
    await fetch(`/api/summaries/${id}/confidence`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ confidence: value }),
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  if (!data) return <div className="text-center py-16 text-muted-foreground text-sm">Summary not found</div>

  const { summary, lecture } = data

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{lecture.moduleName}</p>
        <h1 className="font-display text-2xl text-foreground">{lecture.title ?? "Untitled Lecture"}</h1>
      </div>

      {/* TL;DR */}
      {summary.tldr && summary.tldr.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">tl;dr</p>
          <div className="space-y-2">
            {summary.tldr.map((item, i) => (
              <div key={i} className="flex gap-3">
                <span className="text-xs text-muted-foreground shrink-0 mt-0.5 tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Points — Remember */}
      {summary.keyPoints && summary.keyPoints.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">remember</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {summary.keyPoints.map((point, i) => (
              <div key={i} className="rounded-md border border-primary/30 bg-accent p-3">
                <p className="text-sm">{point}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exam Questions */}
      {summary.examQuestions && summary.examQuestions.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">exam questions</p>
          <div className="space-y-2">
            {summary.examQuestions.map((q, i) => (
              <div key={i} className="flex gap-2">
                <span className="text-primary shrink-0">?</span>
                <p className="text-sm">{q}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Glossary */}
      {summary.glossary && summary.glossary.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">glossary</p>
          <div className="rounded-md border border-border overflow-hidden">
            {summary.glossary.map((item, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 gap-4 px-4 py-3 ${i % 2 === 0 ? "bg-card" : "bg-accent/50"}`}
              >
                <span className="text-sm font-medium">{item.term}</span>
                <span className="text-sm text-muted-foreground">{item.definition}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confidence Rating */}
      <div className="space-y-3 border-t border-border pt-6">
        <p className="text-xs text-muted-foreground uppercase tracking-widest">how confident are you?</p>
        <div className="flex items-center gap-4">
          <ConfidenceSquares value={confidence} onChange={saveConfidence} />
          {saved && <span className="text-xs text-primary">saved (+5 pts)</span>}
        </div>
      </div>
    </div>
  )
}
