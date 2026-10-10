import { Phone } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { SectionHeading } from "@/components/section-heading"
import { getDictionary } from "@/lib/i18n/server"
import { site } from "@/lib/site"

export async function FaqSection() {
  const t = await getDictionary()

  return (
    <section className="py-16 lg:py-24">
      <div className="container-page grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            align="left"
            eyebrow={t.faq.eyebrow}
            title={t.faq.title}
            description={t.faq.description}
          />
          <a
            href={site.phone.href}
            className="mt-8 inline-flex items-center gap-3 rounded-2xl border border-border bg-card p-4 pr-6 shadow-sm transition-colors hover:border-primary/40"
          >
            <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Phone className="size-5" />
            </span>
            <span>
              <span className="block text-xs text-muted-foreground">{t.faq.talkTo}</span>
              <span className="block font-semibold text-foreground">{site.phone.display}</span>
            </span>
          </a>
        </div>
        <Accordion type="single" collapsible className="space-y-3 lg:col-span-7">
          {t.faq.items.map((faq) => (
            <AccordionItem key={faq.question} value={faq.question}>
              <AccordionTrigger>{faq.question}</AccordionTrigger>
              <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  )
}
