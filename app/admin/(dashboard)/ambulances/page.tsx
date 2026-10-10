import { Ambulance as AmbulanceIcon, MapPin, Phone } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/admin-page-header"
import { AmbulanceForm } from "@/components/admin/ambulance-form"
import { AmbulanceStatusControl, RequestControls } from "@/components/admin/ambulance-controls"
import { requireAdmin } from "@/lib/admin/auth"
import { ambulanceStatuses, ambulanceTypes } from "@/lib/clinic/ambulance"
import { formatDateTime } from "@/lib/clinic/format"
import type { Ambulance, AmbulanceRequest } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

export default async function AdminAmbulancesPage() {
  const { supabase } = await requireAdmin()
  const [{ data: fleetData }, { data: requestData }] = await Promise.all([
    supabase.from("ambulances").select("*").order("code"),
    supabase.from("ambulance_requests").select("*").order("created_at", { ascending: false }).limit(50),
  ])
  const fleet = (fleetData ?? []) as Ambulance[]
  const requests = (requestData ?? []) as AmbulanceRequest[]
  const open = requests.filter((request) => request.status === "pending" || request.status === "dispatched")
  const closed = requests.filter((request) => !open.includes(request)).slice(0, 10)
  const available = fleet.filter((ambulance) => ambulance.status === "available")
  const codeOf = (id: string | null) => fleet.find((ambulance) => ambulance.id === id)?.code

  return (
    <>
      <AdminPageHeader
        title="Ambulances"
        description={`${available.length} of ${fleet.length} available · ${open.length} open ${open.length === 1 ? "request" : "requests"}`}
      />

      <section className="mb-10">
        <h2 className="mb-4 text-lg font-semibold text-foreground">Transport requests</h2>
        {open.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center text-muted-foreground">
            No open requests.
          </p>
        ) : (
          <ul className="space-y-3">
            {open.map((request) => (
              <li key={request.id} className="flex flex-col gap-4 rounded-2xl border border-red-500/30 bg-card p-5 shadow-sm lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-foreground">{request.full_name}</p>
                    <a href={`tel:${request.phone}`} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
                      <Phone className="size-3.5" />
                      {request.phone}
                    </a>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", request.status === "pending" ? "bg-red-500/10 text-red-600" : "bg-star/15 text-foreground")}>
                      {request.status === "dispatched" ? `Dispatched · ${codeOf(request.ambulance_id) ?? ""}` : "Pending"}
                    </span>
                  </div>
                  <p className="mt-2 flex items-start gap-1.5 text-sm text-foreground/90">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    {request.pickup_address}
                  </p>
                  {request.details && <p className="mt-1 text-sm text-muted-foreground">{request.details}</p>}
                  <p className="mt-2 text-xs text-muted-foreground">Requested {formatDateTime(request.created_at)}</p>
                </div>
                <RequestControls
                  requestId={request.id}
                  status={request.status as "pending" | "dispatched"}
                  available={available.map(({ id, code, type }) => ({ id, code, type }))}
                />
              </li>
            ))}
          </ul>
        )}
        {closed.length > 0 && (
          <details className="mt-4 rounded-2xl border border-border bg-card p-4 text-sm">
            <summary className="cursor-pointer font-medium text-foreground">Recently closed ({closed.length})</summary>
            <ul className="mt-3 divide-y divide-border">
              {closed.map((request) => (
                <li key={request.id} className="flex flex-wrap justify-between gap-2 py-2 text-muted-foreground">
                  <span>{request.full_name} · {request.pickup_address}</span>
                  <span className="capitalize">{request.status}{request.ambulance_id ? ` · ${codeOf(request.ambulance_id)}` : ""}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-foreground">Fleet</h2>
        <ul className="space-y-3">
          {fleet.map((ambulance) => (
            <li key={ambulance.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-sm lg:flex-row lg:items-start">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-600">
                <AmbulanceIcon className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg font-bold text-foreground">{ambulance.code}</p>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{ambulanceTypes[ambulance.type].label}</span>
                  <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", ambulanceStatuses[ambulance.status].className)}>
                    {ambulanceStatuses[ambulance.status].label}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {ambulance.vehicle_model} · {ambulance.registration}
                  {ambulance.driver_name && ` · Driver: ${ambulance.driver_name}`}
                  {ambulance.base_location && ` · ${ambulance.base_location}`}
                </p>
              </div>
              <div className="lg:w-[28rem]">
                <AmbulanceStatusControl ambulance={ambulance} />
              </div>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h3 className="mb-4 font-semibold text-foreground">Add an ambulance</h3>
          <AmbulanceForm />
        </div>
      </section>
    </>
  )
}
