import Link from "next/link"
import { ExternalLink, LogOut } from "lucide-react"
import { AdminNav } from "@/components/admin/admin-nav"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { signOut } from "@/app/admin/actions"
import { requireAdmin } from "@/lib/admin/auth"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user } = await requireAdmin()

  return (
    <div className="min-h-svh bg-muted/40 lg:grid lg:grid-cols-[260px_1fr]">
      <aside className="sticky top-0 z-40 flex flex-col gap-4 bg-slate-950 p-4 lg:h-svh lg:gap-8 lg:p-6">
        <div className="flex items-center justify-between">
          <Logo inverted />
          <ThemeToggle className="border-white/10 bg-white/5 text-slate-300 lg:hidden" />
        </div>
        <AdminNav />
        <div className="mt-auto hidden space-y-3 border-t border-white/10 pt-6 lg:block">
          <p className="truncate text-xs text-slate-400" title={user.email}>
            Signed in as
            <span className="block truncate text-sm font-medium text-white">{user.email}</span>
          </p>
          <Link href="/" target="_blank" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
            <ExternalLink className="size-4" />
            View website
          </Link>
          <form action={signOut}>
            <button type="submit" className="flex items-center gap-2 text-sm text-slate-400 hover:text-white">
              <LogOut className="size-4" />
              Sign out
            </button>
          </form>
        </div>
      </aside>
      <div className="min-w-0">
        <header className="flex items-center justify-end gap-3 border-b border-border bg-background/80 px-4 py-3 backdrop-blur lg:px-8">
          <ThemeToggle className="hidden lg:inline-flex" />
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
