import type { MetadataRoute } from "next"
import { getDoctors } from "@/lib/clinic/queries"
import { site } from "@/lib/site"

export const revalidate = 3600

const staticRoutes = [
  { path: "", priority: 1 },
  { path: "/services", priority: 0.9 },
  { path: "/doctors", priority: 0.9 },
  { path: "/appointments/book", priority: 0.9 },
  { path: "/schedule", priority: 0.8 },
  { path: "/about", priority: 0.7 },
  { path: "/reviews", priority: 0.7 },
  { path: "/contact", priority: 0.8 },
  { path: "/privacy", priority: 0.3 },
  { path: "/terms", priority: 0.3 },
  { path: "/hipaa", priority: 0.3 },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const doctors = await getDoctors()

  return [
    ...staticRoutes.map((route) => ({ url: `${site.url}${route.path}`, priority: route.priority })),
    ...doctors.map((doctor) => ({
      url: `${site.url}/doctors/${doctor.slug}`,
      lastModified: doctor.updated_at,
      priority: 0.6,
    })),
  ]
}
