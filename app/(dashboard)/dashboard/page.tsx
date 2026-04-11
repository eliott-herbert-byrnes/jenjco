import { permanentRedirect } from "next/navigation"
import { paths } from "@/app/paths"

/** Legacy URL; dashboard lives at {@link paths.home}. */
export default function DashboardPathRedirect() {
  permanentRedirect(paths.home)
}
