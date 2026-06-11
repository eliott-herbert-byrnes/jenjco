type WelcomeSectionProps = {
  displayName: string | null
}

export function WelcomeSection({ displayName }: WelcomeSectionProps) {
  return (
    <h1 className="text-3xl font-bold">
      Welcome{displayName ? `, ${displayName}` : " back"}
    </h1>
  )
}
