import Link from "next/link"
import type { Metadata } from "next"
import { CalendarPlus, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageHero } from "@/components/page-hero"
import { AutoRefresh } from "@/components/queue/auto-refresh"
import { QueueCard } from "@/components/queue/queue-card"
import { getTodayQueue } from "@/lib/clinic/queries"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Live Queue",
  description: "See which serial number each doctor is serving right now and how many patients are waiting.",
}

export default async function QueuePage() {
  const sessions = await getTodayQueue()

  return (
    <>
      <PageHero
        eyebrow="Live queue"
        title="Know exactly when it's your turn"
        description={
          <p>
            Follow each doctor&apos;s queue in real time. Compare the number being served with the serial on your
            booking and arrive just in time.
          </p>
        }
      >
        <AutoRefresh />
      </PageHero>

      <section className="py-12 lg:py-16">
        <div className="container-page">
          {sessions.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {sessions.map((session) => (
                <QueueCard key={session.schedule_id} session={session} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center rounded-3xl border border-dashed border-border bg-card px-6 py-16 text-center">
              <h2 className="text-xl font-semibold text-foreground">No clinic sessions today</h2>
              <p className="mt-2 max-w-md text-muted-foreground">
                There are no doctor sessions scheduled for today. Book ahead for an upcoming day.
              </p>
              <Button asChild className="mt-6 rounded-full">
                <Link href="/appointments/book">
                  <CalendarPlus className="size-4" />
                  Book an appointment
                </Link>
              </Button>
            </div>
          )}

          <p className="mx-auto mt-10 flex max-w-2xl items-start gap-2 rounded-2xl bg-muted/60 px-5 py-4 text-sm text-muted-foreground">
            <Info className="mt-0.5 size-4 shrink-0 text-primary" />
            Queue times are estimates. Patients with urgent needs may be seen first. Please stay nearby when your serial
            is within three of the number being served.
          </p>
        </div>
      </section>
    </>
  )
}
