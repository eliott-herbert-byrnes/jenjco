import { SiGoogle, SiNotion } from "@icons-pack/react-simple-icons"
import { Box, Database, Globe, Mail, Phone } from "lucide-react"

import { cn } from "@/lib/utils"

type ProviderIconProps = {
  provider: string
  className?: string
}

type IconComponent = React.ComponentType<{ className?: string; color?: string }>

const PROVIDER_ICON_MAP: Record<string, IconComponent> = {
  google: SiGoogle,
  notion: SiNotion,
  browser: Globe,
  crm: Database,
  email: Mail,
  phone: Phone,
}

export function ProviderIcon({ provider, className }: ProviderIconProps) {
  const key = provider.toLowerCase()
  const Icon = PROVIDER_ICON_MAP[key] ?? Box

  return <Icon className={cn("size-4 shrink-0", className)} aria-hidden />
}
