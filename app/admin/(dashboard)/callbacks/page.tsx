import { Phone } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { ResolveCallbackButton } from "@/components/admin/resolve-callback-button"
import { requireAdmin } from "@/lib/admin/auth"
import { formatDateTime } from "@/lib/clinic/format"
import type { CallbackRequest } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export default async function AdminCallbacksPage() {
  const { supabase } = await requireAdmin()
  const { data } = await supabase
    .from("callback_requests")
    .select("*")
    .order("status")
    .order("created_at", { ascending: false })
    .limit(200)
  const requests = (data ?? []) as CallbackRequest[]
  const open = requests.filter((item) => item.status === "open")

  return (
    <>
      <AdminPageHeader
        title="Callback requests"
        description={`${open.length} open ${open.length === 1 ? "request" : "requests"} from the emergency page.`}
      />
      {requests.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
          No callback requests yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {requests.map((item) => (
            <li
              key={item.id}
              className={cn(
                "flex flex-col gap-4 rounded-2xl border bg-card p-5 shadow-sm sm:flex-row sm:items-start",
                item.status === "open" ? "border-red-500/30" : "border-border opacity-70",
              )}
            >
              <span
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-xl",
                  item.status === "open" ? "bg-red-500/10 text-red-600" : "bg-muted text-muted-foreground",
                )}
              >
                <Phone className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-foreground">{item.full_name}</p>
                  <a href={`tel:${item.phone}`} className="text-sm font-medium text-primary hover:underline">
                    {item.phone}
                  </a>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
                      item.status === "open" ? "bg-red-500/10 text-red-600" : "bg-accent/15 text-accent",
                    )}
                  >
                    {item.status}
                  </span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm text-foreground/90">{item.concern}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  Requested {formatDateTime(item.created_at)}
                  {item.resolved_at && ` · resolved ${formatDateTime(item.resolved_at)}`}
                </p>
              </div>
              {item.status === "open" && <ResolveCallbackButton id={item.id} />}
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
