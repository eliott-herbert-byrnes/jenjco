import { createElement } from "react"
import { render } from "@react-email/render"

import {
  InviteUserEmail,
  inviteUserPlainText,
  type InviteUserEmailProps,
} from "@/emails/invite-user"
import { resend } from "@/lib/email/resend"

export type SendInviteEmailInput = {
  to: string
  inviteeName?: string
  orgName: string
  inviterName: string
  inviteLink: string
}

function toEmailProps(input: SendInviteEmailInput): InviteUserEmailProps {
  return {
    inviteLink: input.inviteLink,
    inviteeEmail: input.to,
    inviteeName: input.inviteeName,
    orgName: input.orgName,
    inviterName: input.inviterName,
  }
}

export async function sendInviteEmail(
  input: SendInviteEmailInput
): Promise<{ error: string | null }> {
  try {
    const emailProps = toEmailProps(input)
    const html = await render(createElement(InviteUserEmail, emailProps))
    const text = inviteUserPlainText(emailProps)

    const { error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: input.to,
      subject: `You've been invited to join ${input.orgName}`,
      html,
      text,
    })

    return { error: error?.message ?? null }
  } catch (err) {
    return {
      error: err instanceof Error ? err.message : "Email send failed",
    }
  }
}
