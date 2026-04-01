"use client"

import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Copy, Check } from "lucide-react"

interface Email {
  id: string
  fromName: string | null
  fromEmail: string
  subject: string
  previewText: string | null
  aiSummary: string | null
  label: string
  draftReply: string | null
  urgency: string | null
  receivedAt: string
  handledAt: string | null
}

function EmailItem({ email, onHandle }: { email: Email; onHandle: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  function copyDraft() {
    if (!email.draftReply) return
    navigator.clipboard.writeText(email.draftReply)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="border border-border rounded-md bg-card overflow-hidden">
      <button
        className="w-full text-left p-4 hover:bg-accent/50 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">{email.fromName ?? email.fromEmail}</span>
              {email.urgency && (
                <span className={`text-xs px-1.5 py-0.5 rounded border ${
                  email.urgency === "high"
                    ? "border-red-500/20 bg-red-500/10 text-red-400"
                    : "border-border bg-secondary text-muted-foreground"
                }`}>{email.urgency}</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground truncate">{email.subject}</p>
            {email.aiSummary && (
              <p className="text-xs text-muted-foreground italic mt-1">{email.aiSummary}</p>
            )}
          </div>
          <span className="text-xs text-muted-foreground shrink-0">
            {new Date(email.receivedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border p-4 space-y-3">
          {email.draftReply ? (
            <>
              <p className="text-xs text-muted-foreground uppercase tracking-widest">draft reply</p>
              <textarea
                defaultValue={email.draftReply}
                rows={6}
                className="w-full text-sm bg-background border border-border rounded-md p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={copyDraft}>
                  {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                  {copied ? "Copied" : "Copy reply"}
                </Button>
                {!email.handledAt && (
                  <Button variant="outline" size="sm" onClick={() => onHandle(email.id)}>
                    Mark handled (+8 pts)
                  </Button>
                )}
              </div>
            </>
          ) : (
            !email.handledAt && (
              <Button variant="outline" size="sm" onClick={() => onHandle(email.id)}>
                Mark handled (+8 pts)
              </Button>
            )
          )}
        </div>
      )}
    </div>
  )
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/emails")
      .then((r) => r.json())
      .then((data) => { setEmails(Array.isArray(data) ? data : []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function handleEmail(id: string) {
    await fetch(`/api/emails/${id}/handle`, { method: "PATCH" })
    setEmails((prev) => prev.map((e) => e.id === id ? { ...e, handledAt: new Date().toISOString(), label: "handled" } : e))
  }

  const replyNeeded = emails.filter((e) => e.label === "reply-needed" && !e.handledAt)
  const readAndNote = emails.filter((e) => e.label === "read-and-note" && !e.handledAt)
  const handled = emails.filter((e) => e.handledAt || e.label === "handled")

  function EmailList({ items }: { items: Email[] }) {
    if (loading) return <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
    if (items.length === 0) return <p className="text-sm text-muted-foreground py-8 text-center">Nothing here</p>
    return <div className="space-y-2">{items.map((e) => <EmailItem key={e.id} email={e} onHandle={handleEmail} />)}</div>
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Tabs defaultValue="reply">
        <TabsList className="bg-transparent border-b border-border w-full justify-start rounded-none h-auto pb-0 mb-6">
          <TabsTrigger value="reply" className="text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground pb-3">
            Reply Needed {replyNeeded.length > 0 && <span className="ml-1.5 text-xs bg-primary text-primary-foreground rounded px-1">{replyNeeded.length}</span>}
          </TabsTrigger>
          <TabsTrigger value="read" className="text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground pb-3">
            Read & Note
          </TabsTrigger>
          <TabsTrigger value="handled" className="text-xs tracking-widest uppercase rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:text-foreground text-muted-foreground pb-3">
            Handled
          </TabsTrigger>
        </TabsList>
        <TabsContent value="reply"><EmailList items={replyNeeded} /></TabsContent>
        <TabsContent value="read"><EmailList items={readAndNote} /></TabsContent>
        <TabsContent value="handled"><EmailList items={handled} /></TabsContent>
      </Tabs>
    </div>
  )
}
