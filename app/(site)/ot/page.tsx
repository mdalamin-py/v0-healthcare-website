import type { Metadata } from "next"
import { ShieldCheck } from "lucide-react"
import { CaseBoard } from "@/components/ot/case-board"
import { TheatreGrid } from "@/components/ot/theatre-grid"
import { PageHero } from "@/components/page-hero"
import { AutoRefresh } from "@/components/queue/auto-refresh"
import { getOtBoard } from "@/lib/clinic/queries"
import { formatDate } from "@/lib/clinic/format"
import { clinicToday } from "@/lib/clinic/time"
import { site } from "@/lib/site"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "OT Live Board",
  description: "Live operation theatre status and today's surgery list. Families can track an operation with its case code.",
}

export default async function OtBoardPage() {
  const { theatres, cases } = await getOtBoard()
  const inSurgery = cases.filter((item) => item.status === "in_progress").length

  return (
    <>
      <PageHero
        eyebrow="Operation theatres"
        title="OT live board"
        description={
          <p>
            Live status of every operation theatre and today&apos;s surgery list. Waiting family members can follow their
            patient&apos;s progress with the case code from the information desk.
          </p>
        }
      >
        <AutoRefresh seconds={30} />
      </PageHero>

      <section className="py-12 lg:py-16">
        <div className="container-page space-y-12">
          {theatres.length > 0 ? (
            <>
              <div>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-2xl font-bold text-foreground">Theatres</h2>
                  <p className="text-sm text-muted-foreground">
                    {inSurgery} {inSurgery === 1 ? "operation" : "operations"} in progress
                  </p>
                </div>
                <TheatreGrid theatres={theatres} cases={cases} />
              </div>

              <div>
                <h2 className="mb-4 text-2xl font-bold text-foreground">Today&apos;s list · {formatDate(clinicToday())}</h2>
                {cases.length > 0 ? (
                  <CaseBoard cases={cases} />
                ) : (
                  <p className="rounded-3xl border border-dashed border-border bg-card px-6 py-12 text-center text-muted-foreground">
                    No operations are scheduled today.
                  </p>
                )}
              </div>
            </>
          ) : (
            <p className="rounded-3xl border border-dashed border-border bg-card px-6 py-14 text-center text-muted-foreground">
              The OT board is being updated. Call {site.phone.display} for an update on a patient.
            </p>
          )}

          <p className="flex items-start gap-2 rounded-2xl bg-muted/60 px-5 py-4 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
            To protect patient privacy, this board never shows names — only the case code given to the family.
          </p>
        </div>
      </section>
    </>
  )
}
