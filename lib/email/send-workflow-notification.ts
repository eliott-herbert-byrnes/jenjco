import { createElement } from "react"
import { render } from "@react-email/render"

import {
  WorkflowNotificationEmail,
  workflowNotificationPlainText,
  type WorkflowNotificationEmailProps,
} from "@/emails/workflow-notification"
import { resend } from "@/lib/email/resend"
import type { WorkflowRunSummary } from "@/src/workflows/notifications/build-run-summary"

export type SendWorkflowNotificationInput = {
  to: string
  workflowName: string
  eventType: "completion" | "error" | "digest"
  runSummary?: WorkflowRunSummary | null
  digestCount?: number
  digestSummaries?: WorkflowRunSummary[]
}

function subjectForEvent(
  eventType: SendWorkflowNotificationInput["eventType"],
  workflowName: string,
  digestCount?: number
): string {
  switch (eventType) {
    case "completion":
      return `[JENJCO] Workflow completed: ${workflowName}`
    case "error":
      return `[JENJCO] Workflow failed: ${workflowName}`
    case "digest":
      return `[JENJCO] ${digestCount ?? 0} workflow updates: ${workflowName}`
  }
}

function toEmailProps(input: SendWorkflowNotificationInput): WorkflowNotificationEmailProps {
  const isDigest = input.eventType === "digest"

  return {
    workflowName: input.workflowName,
    eventType: input.eventType,
    runSummary: isDigest ? null : input.runSummary,
    isDigest,
    digestCount: input.digestCount,
    digestSummaries: input.digestSummaries,
  }
}

export async function sendWorkflowNotification(
  input: SendWorkflowNotificationInput
): Promise<{ resendId: string | null; error: string | null }> {
  try {
    const emailProps = toEmailProps(input)
    const html = await render(createElement(WorkflowNotificationEmail, emailProps))
    const text = workflowNotificationPlainText(emailProps)

    const { data, error } = await resend.emails.send({
      from: process.env.RESEND_FROM!,
      to: input.to,
      subject: subjectForEvent(
        input.eventType,
        input.workflowName,
        input.digestCount
      ),
      html,
      text,
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
