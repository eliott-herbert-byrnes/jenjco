import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components"

export type InviteUserEmailProps = {
  inviteLink: string
  inviteeEmail: string
  inviteeName?: string
  orgName: string
  inviterName: string
}

const colors = {
  background: "#f8fafc",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
  primary: "#1e293b",
  primaryForeground: "#f8fafc",
}

export function InviteUserEmail({
  inviteLink,
  inviteeEmail,
  inviteeName,
  orgName,
  inviterName,
}: InviteUserEmailProps) {
  const greetingName = inviteeName?.trim() || inviteeEmail
  const previewText = `${inviterName} invited you to join ${orgName} on JENJCO`

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>JENJCO</Text>

          <Heading style={heading}>You&apos;ve been invited to join {orgName}</Heading>

          <Text style={paragraph}>Hi {greetingName},</Text>

          <Text style={paragraph}>
            <strong>{inviterName}</strong> has invited you to join{" "}
            <strong>{orgName}</strong> on JENJCO. Click the button below to accept
            your invite and set up your account.
          </Text>

          <Section style={buttonSection}>
            <Button href={inviteLink} style={button}>
              Accept invite
            </Button>
          </Section>

          <Text style={footnote}>
            This link expires in 24 hours. If it has expired, ask your admin to send
            a new invite.
          </Text>

          <Hr style={hr} />

          <Text style={muted}>
            If the button doesn&apos;t work, copy and paste this link into your
            browser:
          </Text>
          <Link href={inviteLink} style={link}>
            {inviteLink}
          </Link>
        </Container>
      </Body>
    </Html>
  )
}

export function inviteUserPlainText({
  inviteLink,
  inviteeEmail,
  inviteeName,
  orgName,
  inviterName,
}: InviteUserEmailProps): string {
  const greetingName = inviteeName?.trim() || inviteeEmail

  return [
    `Hi ${greetingName},`,
    "",
    `${inviterName} has invited you to join ${orgName} on JENJCO.`,
    "",
    "Accept your invite:",
    inviteLink,
    "",
    "This link expires in 24 hours. If it has expired, ask your admin to send a new invite.",
  ].join("\n")
}

export default InviteUserEmail

const main = {
  backgroundColor: colors.background,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const container = {
  margin: "0 auto",
  padding: "40px 24px",
  maxWidth: "560px",
}

const brand = {
  color: colors.muted,
  fontSize: "12px",
  fontWeight: "600" as const,
  letterSpacing: "0.08em",
  margin: "0 0 24px",
  textTransform: "uppercase" as const,
}

const heading = {
  color: colors.foreground,
  fontSize: "24px",
  fontWeight: "600" as const,
  lineHeight: "32px",
  margin: "0 0 24px",
}

const paragraph = {
  color: colors.foreground,
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
}

const buttonSection = {
  margin: "32px 0",
}

const button = {
  backgroundColor: colors.primary,
  borderRadius: "8px",
  color: colors.primaryForeground,
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600" as const,
  lineHeight: "100%",
  padding: "14px 24px",
  textDecoration: "none",
}

const footnote = {
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 24px",
}

const hr = {
  borderColor: colors.border,
  margin: "24px 0",
}

const muted = {
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 8px",
}

const link = {
  color: colors.primary,
  fontSize: "14px",
  lineHeight: "22px",
  wordBreak: "break-all" as const,
}
