import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "@/app/admin/actions"
import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()
  const initial = (user.email ?? "A").charAt(0).toUpperCase()

  return (
    <div className="min-h-svh bg-muted/40 lg:grid lg:grid-cols-[272px_1fr]">
      <aside className="sticky top-0 z-40 flex flex-col gap-4 overflow-hidden bg-slate-950 p-4 lg:h-svh lg:gap-8 lg:p-5">
        <div className="pointer-events-none absolute -left-24 -top-24 size-64 rounded-full bg-primary/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 size-64 rounded-full bg-accent/15 blur-3xl" />
        <div className="relative flex items-center justify-between">
          <Logo inverted />
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-300 lg:hidden" />
        </div>
        <div className="relative">
          <AdminNav />
        </div>
        <div className="relative mt-auto hidden space-y-1 lg:block">
          <Link
            href="/"
            target="_blank"
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
          >
            <ExternalLink className="size-4" />
            View website
          </Link>
          <div className="mt-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent font-semibold text-white">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-slate-500">Administrator</span>
              <span className="block truncate text-sm font-medium text-white" title={user.email}>
                {user.email}
              </span>
            </span>
            <form action={signOut}>
              <button
                type="submit"
                aria-label="Sign out"
                className="flex size-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <LogOut className="size-4" />
              </button>
            </form>
          </div>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-end gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-xl lg:px-8">
          <ThemeToggle className="hidden size-9 lg:inline-flex" />
          <form action={signOut} className="lg:hidden">
            <button type="submit" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </header>
        <main className="px-4 py-8 lg:px-8">{children}</main>
      </div>
    </div>
  )
}
