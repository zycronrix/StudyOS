"use client"

import { useEffect, useState } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"

interface SummaryItem {
  summary: { id: string; confidence: number | null; generatedAt: string | null }
  lecture: { moduleName: string; moduleColor: string | null; title: string | null; moduleId: string }
}

function ConfidenceSquares({ confidence }: { confidence: number | null }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <div
          key={n}
          className={`h-2 w-2 rounded-sm ${n <= (confidence ?? 0) ? "bg-primary" : "bg-border"}`}
        />
      ))}
    </div>
  )
}

export default function SummariesPage() {
  const [summaries, setSummaries] = useState<SummaryItem[]>([])
  const [search, setSearch] = useState("")
  const [activeModule, setActiveModule] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/summaries")
      .then((r) => r.json())
      .then((data) => { setSummaries(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const modules = Array.from(new Set(summaries.map((s) => s.lecture.moduleName)))

  const filtered = summaries.filter((s) => {
    const matchesSearch =
      !search ||
      s.lecture.title?.toLowerCase().includes(search.toLowerCase()) ||
      s.lecture.moduleName.toLowerCase().includes(search.toLowerCase())
    const matchesModule = !activeModule || s.lecture.moduleName === activeModule
    return matchesSearch && matchesModule
  })

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="search summaries..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-card border-border"
          />
        </div>
        {modules.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => setActiveModule(null)}
              className={`shrink-0 text-xs px-3 py-1 rounded-md border transition-colors ${
                !activeModule ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              All
            </button>
            {modules.map((mod) => (
              <button
                key={mod}
                onClick={() => setActiveModule(mod === activeModule ? null : mod)}
                className={`shrink-0 text-xs px-3 py-1 rounded-md border transition-colors ${
                  activeModule === mod ? "border-primary text-primary" : "border-border text-muted-foreground hover:border-primary/50"
                }`}
              >
                {mod}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">
          {summaries.length === 0 ? "No summaries yet — they generate overnight after your lectures" : "No summaries match your search"}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <Link
              key={item.summary.id}
              href={`/summaries/${item.summary.id}`}
              className="block rounded-md border border-border bg-card p-4 hover:bg-accent transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{item.lecture.moduleName}</p>
                  <p className="text-sm font-medium">{item.lecture.title ?? "Untitled Lecture"}</p>
                  {item.summary.generatedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(item.summary.generatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  )}
                </div>
                <ConfidenceSquares confidence={item.summary.confidence} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
