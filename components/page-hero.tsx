import Image from "next/image"
import { cn } from "@/lib/utils"

type PageHeroProps = {
  eyebrow: string
  title: React.ReactNode
  description: React.ReactNode
  image?: { src: string; alt: string }
  children?: React.ReactNode
}

export function PageHero({ eyebrow, title, description, image, children }: PageHeroProps) {
  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="bg-grid pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_at_top_left,black,transparent_70%)]" />
      <div className="pointer-events-none absolute -left-32 -top-32 size-[420px] rounded-full bg-primary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[420px] rounded-full bg-accent/15 blur-3xl" />

      <div
        className={cn(
          "container-page relative grid items-center gap-12 py-16 lg:py-24",
          image && "lg:grid-cols-2",
        )}
      >
        <div className="max-w-3xl animate-in fade-in slide-in-from-bottom-4 duration-700">
          <p className="mb-4 inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            {eyebrow}
          </p>
          <h1 className="text-4xl font-extrabold leading-[1.1] text-foreground text-balance md:text-5xl">{title}</h1>
          <div className="mt-6 space-y-4 text-lg leading-relaxed text-muted-foreground">{description}</div>
          {children && <div className="mt-8">{children}</div>}
        </div>

        {image && (
          <div className="relative animate-in fade-in zoom-in-95 duration-700">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-primary/25 to-accent/25 blur-2xl" />
            <div className="relative aspect-[4/3] overflow-hidden rounded-[2rem] border border-white/40 shadow-2xl">
              <Image
                src={image.src}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-cover"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
