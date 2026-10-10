import Image from "next/image"
import { initials } from "@/lib/clinic/format"
import { cn } from "@/lib/utils"

export function DoctorAvatar({
  name,
  photoUrl,
  className,
}: {
  name: string
  photoUrl: string | null
  className?: string
}) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-accent font-display font-bold text-white",
        className,
      )}
    >
      {photoUrl ? (
        <Image src={photoUrl} alt={name} fill sizes="128px" className="object-cover" unoptimized />
      ) : (
        <span aria-hidden="true">{initials(name)}</span>
      )}
    </span>
  )
}
