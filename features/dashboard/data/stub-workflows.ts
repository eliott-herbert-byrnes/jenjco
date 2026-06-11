export type WorkflowIntegration = {
  name: string
}

export type WorkflowStub = {
  id: string
  displayName: string
  description: string
  departmentName: string
  integrations: WorkflowIntegration[]
}

export const STUB_WORKFLOWS: WorkflowStub[] = [
  {
    id: "stub-ops-weekly-report",
    displayName: "Weekly Ops Report",
    description: "Compile and distribute a summary of operational metrics each week.",
    departmentName: "Operations",
    integrations: [{ name: "Google" }, { name: "Teams" }, { name: "Slack" }],
  },
  {
    id: "stub-ops-inventory-sync",
    displayName: "Inventory Sync",
    description: "Sync inventory levels across warehouse systems and notify stakeholders.",
    departmentName: "Operations",
    integrations: [{ name: "Google" }, { name: "Slack" }],
  },
  {
    id: "stub-finance-expense-approval",
    displayName: "Expense Approval",
    description: "Route expense submissions for review and notify approvers.",
    departmentName: "Finance",
    integrations: [{ name: "Teams" }, { name: "Slack" }],
  },
  {
    id: "stub-finance-invoice-processing",
    displayName: "Invoice Processing",
    description: "Extract invoice data and update accounting records automatically.",
    departmentName: "Finance",
    integrations: [{ name: "Google" }, { name: "Teams" }],
  },
  {
    id: "stub-hr-onboarding",
    displayName: "Onboarding Checklist",
    description: "Assign tasks and track progress for new employee onboarding.",
    departmentName: "HR",
    integrations: [{ name: "Google" }, { name: "Teams" }, { name: "Slack" }],
  },
  {
    id: "stub-hr-leave-request",
    displayName: "Leave Request",
    description: "Submit and track leave requests with manager approval workflows.",
    departmentName: "HR",
    integrations: [{ name: "Teams" }, { name: "Slack" }],
  },
]
