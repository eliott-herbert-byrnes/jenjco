import { cn } from "@/lib/utils"

type JenjcoLogoProps = Omit<React.SVGProps<SVGSVGElement>, "width" | "height"> & {
  className?: string
}

export function JenjcoLogo({ className, ...props }: JenjcoLogoProps) {
  return (
    <span
      className={cn(
        "inline-flex aspect-460/512 shrink-0",
        className,
      )}
    >
      <svg
        viewBox="0 0 460 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="size-full! text-black dark:text-white"
        {...props}
      >
        <path
          fill="currentColor"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M411.282 434.784C515.362 282.692 441.694 9.8637 294.057 0.644326C266.867 -1.05378 266.521 -0.156432 289.331 12.8267C439.79 98.4477 437.027 432.341 285.288 502.038C267.922 510.017 268.528 512.66 287.55 511.865C335.041 509.881 378.357 482.899 411.282 434.784ZM282.567 449.138C367.71 343.267 359.246 134.839 266.091 43.3675C156.415 -64.3249 8.29605 44.8784 0.353681 239.291C-8.893 465.595 165.217 595.059 282.567 449.138ZM211.253 422.538C156.809 326.941 158.689 163.319 215.158 82.6128C223.347 70.9066 223.347 70.9065 237.701 88.6C306.388 173.258 304.552 356.717 234.32 426.369C220.973 439.606 220.973 439.606 211.253 422.538ZM145.324 453.431C15.6675 404.815 30.556 64.9411 162.833 53.7448C182.197 52.1079 183.232 54.1686 171.113 70.2653C102.98 160.762 99.7286 327.059 164.059 430.893C183.499 462.276 180.035 466.448 145.324 453.431Z"
        />
      </svg>
    </span>
  )
}
