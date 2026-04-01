"use client"

import { useState } from "react"
import { useSession } from "next-auth/react"
import { GraduationCap, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signIn } from "next-auth/react"
import Link from "next/link"

export default function OnboardingPage() {
  const { data: session } = useSession()
  const [university, setUniversity] = useState("")
  const [course, setCourse] = useState("")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ university, course }),
    })
    setSaved(true)
    setSaving(false)
  }

  if (saved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="w-full max-w-sm text-center space-y-6">
          <CheckCircle className="h-12 w-12 text-primary mx-auto" />
          <div>
            <h2 className="font-display text-2xl">You&apos;re all set</h2>
            <p className="text-sm text-muted-foreground mt-2">
              StudyOS will sync your data overnight. Check back tomorrow morning for your first brief.
            </p>
          </div>
          <Link href="/">
            <Button className="w-full">Go to dashboard</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="flex items-center justify-center h-10 w-10 rounded-md bg-primary text-primary-foreground">
              <GraduationCap className="h-5 w-5" />
            </div>
          </div>
          <h1 className="font-display text-2xl text-foreground">welcome, {session?.user?.name?.split(" ")[0] ?? "student"}</h1>
          <p className="text-xs text-muted-foreground">a couple quick questions to personalise your brief</p>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">university</label>
            <Input
              placeholder="e.g. University of Manchester"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="bg-card border-border"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-widest">course</label>
            <Input
              placeholder="e.g. Computer Science BSc"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              className="bg-card border-border"
            />
          </div>
          <Button type="submit" className="w-full" disabled={saving}>
            {saving ? "Saving..." : "Continue"}
          </Button>
        </form>

        <div className="space-y-3">
          <p className="text-xs text-muted-foreground uppercase tracking-widest text-center">connect your accounts</p>
          <Button variant="outline" className="w-full" onClick={() => signIn("google")}>
            Connect Gmail
          </Button>
          <Button variant="outline" className="w-full" onClick={() => signIn("microsoft-entra-id")}>
            Connect Outlook
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Read-only access only. We never write to your accounts.
          </p>
        </div>
      </div>
    </div>
  )
}
