import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components"

import type { WorkflowRunSummary } from "@/src/workflows/notifications/build-run-summary"

export type WorkflowNotificationEmailProps = {
  workflowName: string
  eventType: "completion" | "error" | "digest"
  runSummary?: WorkflowRunSummary | null
  steps?: WorkflowRunSummary["steps"]
  isDigest?: boolean
  digestCount?: number
  digestSummaries?: WorkflowRunSummary[]
}

const colors = {
  background: "#f8fafc",
  foreground: "#0f172a",
  muted: "#64748b",
  border: "#e2e8f0",
}

function formatDuration(durationMs: number | null): string {
  if (durationMs == null) return "—"
  if (durationMs < 1000) return `${Math.round(durationMs)}ms`
  return `${(durationMs / 1000).toFixed(1)}s`
}

function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  })
}

function eventLabel(eventType: WorkflowNotificationEmailProps["eventType"]): string {
  switch (eventType) {
    case "completion":
      return "Completed"
    case "error":
      return "Failed"
    case "digest":
      return "Digest"
  }
}

function previewTextForProps(props: WorkflowNotificationEmailProps): string {
  if (props.isDigest && props.digestCount) {
    return `${props.digestCount} workflow updates: ${props.workflowName}`
  }

  return `${eventLabel(props.eventType)}: ${props.workflowName}`
}

function StepRows({ steps }: { steps: WorkflowRunSummary["steps"] }) {
  if (steps.length === 0) {
    return <Text style={muted}>No step details available.</Text>
  }

  return (
    <Section style={stepSection}>
      {steps.map((step) => (
        <Text key={step.step_id} style={stepRow}>
          <strong>{step.step_id}</strong> ({step.kind}) — {step.status}
          {step.error ? ` — ${step.error}` : ""}
        </Text>
      ))}
    </Section>
  )
}

function RunSummaryBlock({ summary }: { summary: WorkflowRunSummary }) {
  return (
    <Section style={summaryBlock}>
      <Text style={meta}>
        {formatTimestamp(summary.timestamp)} · {summary.trigger} ·{" "}
        {formatDuration(summary.durationMs)}
      </Text>
      {summary.runError ? (
        <Text style={errorText}>Error: {summary.runError}</Text>
      ) : null}
      <StepRows steps={summary.steps} />
    </Section>
  )
}

export function WorkflowNotificationEmail(props: WorkflowNotificationEmailProps) {
  const previewText = previewTextForProps(props)

  return (
    <Html lang="en">
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>JENJCO</Text>

          {props.isDigest && props.digestCount ? (
            <>
              <Heading style={heading}>
                {props.digestCount} workflow updates
              </Heading>
              <Text style={paragraph}>
                <strong>{props.workflowName}</strong> completed{" "}
                {props.digestCount} time{props.digestCount === 1 ? "" : "s"} in
                the last hour.
              </Text>
              {props.digestSummaries?.map((summary, index) => (
                <RunSummaryBlock key={`${summary.timestamp}-${index}`} summary={summary} />
              ))}
            </>
          ) : (
            <>
              <Heading style={heading}>
                Workflow {eventLabel(props.eventType).toLowerCase()}:{" "}
                {props.workflowName}
              </Heading>
              {props.runSummary ? (
                <RunSummaryBlock summary={props.runSummary} />
              ) : (
                <StepRows steps={props.steps ?? []} />
              )}
            </>
          )}

          <Hr style={hr} />
          <Text style={muted}>
            This is an automated notification from JENJCO. No action is required
            unless an error was reported.
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export function workflowNotificationPlainText(
  props: WorkflowNotificationEmailProps
): string {
  const lines: string[] = []

  if (props.isDigest && props.digestCount) {
    lines.push(
      `${props.digestCount} workflow updates: ${props.workflowName}`,
      "",
      `${props.workflowName} completed ${props.digestCount} time${
        props.digestCount === 1 ? "" : "s"
      } in the last hour.`,
      ""
    )

    for (const summary of props.digestSummaries ?? []) {
      lines.push(
        `Run at ${formatTimestamp(summary.timestamp)} (${summary.trigger}, ${formatDuration(summary.durationMs)})`
      )
      if (summary.runError) {
        lines.push(`Error: ${summary.runError}`)
      }
      for (const step of summary.steps) {
        lines.push(
          `  ${step.step_id} (${step.kind}) — ${step.status}${
            step.error ? ` — ${step.error}` : ""
          }`
        )
      }
      lines.push("")
    }
  } else {
    lines.push(
      `Workflow ${eventLabel(props.eventType).toLowerCase()}: ${props.workflowName}`,
      ""
    )

    const summary = props.runSummary
    if (summary) {
      lines.push(
        `Time: ${formatTimestamp(summary.timestamp)}`,
        `Trigger: ${summary.trigger}`,
        `Duration: ${formatDuration(summary.durationMs)}`,
        ""
      )
      if (summary.runError) {
        lines.push(`Error: ${summary.runError}`, "")
      }
      for (const step of summary.steps) {
        lines.push(
          `${step.step_id} (${step.kind}) — ${step.status}${
            step.error ? ` — ${step.error}` : ""
          }`
        )
      }
    }
  }

  lines.push("", "This is an automated notification from JENJCO.")

  return lines.join("\n")
}

export default WorkflowNotificationEmail

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

const summaryBlock = {
  margin: "0 0 20px",
  padding: "16px",
  backgroundColor: "#ffffff",
  border: `1px solid ${colors.border}`,
  borderRadius: "8px",
}

const meta = {
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

const errorText = {
  color: "#b91c1c",
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 12px",
}

const stepSection = {
  margin: "0",
}

const stepRow = {
  color: colors.foreground,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0 0 6px",
  fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
}

const hr = {
  borderColor: colors.border,
  margin: "24px 0",
}

const muted = {
  color: colors.muted,
  fontSize: "14px",
  lineHeight: "22px",
  margin: "0",
}
