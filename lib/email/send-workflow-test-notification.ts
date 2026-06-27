import { resend } from "@/lib/email/resend"

export async function sendWorkflowTestEmail(input: {
  to: string
  workflowName: string
}): Promise<{ resendId: string | null; error: string | null }> {
  try {
    const subject = `[JENJCO] Test notification: ${input.workflowName}`
    const text = [
      "This is a test workflow notification from JENJCO.",
      "",
      `Workflow: ${input.workflowName}`,
      "",
      "If you received this email, notification delivery is configured correctly.",
    ].join("\n")

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: input.to,
      subject,
      text,
      html: `<p>This is a test workflow notification from JENJCO.</p><p><strong>Workflow:</strong> ${input.workflowName}</p><p>If you received this email, notification delivery is configured correctly.</p>`,
    })

    return {
      resendId: data?.id ?? null,
      error: error?.message ?? null,
    }
  } catch (err) {
    return {
      resendId: null,
      error: err instanceof Error ? err.message : "Email send failed",
    }
  }
}
