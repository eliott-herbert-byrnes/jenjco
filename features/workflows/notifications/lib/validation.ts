import { z } from "zod"

import {
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_TEAM_SCOPES,
} from "@/features/workflows/notifications/types"

export const notificationConfigSchema = z
  .object({
    orgWorkflowId: z.string().uuid(),
    notifyOnCompletion: z.boolean(),
    notifyOnError: z.boolean(),
    teamScope: z.enum(NOTIFICATION_TEAM_SCOPES),
    departmentId: z.string().uuid().nullable(),
    audience: z.enum(NOTIFICATION_AUDIENCES),
  })
  .superRefine((data, ctx) => {
    if (!data.notifyOnCompletion && !data.notifyOnError) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select at least one event type",
        path: ["notifyOnCompletion"],
      })
    }

    if (data.teamScope === "department" && !data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Select a team when using specific team scope",
        path: ["departmentId"],
      })
    }

    if (data.teamScope !== "department" && data.departmentId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Department is only used for specific team scope",
        path: ["departmentId"],
      })
    }
  })

export type NotificationConfigInput = z.infer<typeof notificationConfigSchema>

export const orgWorkflowIdSchema = z.object({
  orgWorkflowId: z.string().uuid(),
})
