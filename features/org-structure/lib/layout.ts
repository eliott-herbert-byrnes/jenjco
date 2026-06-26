import dagre from "@dagrejs/dagre"
import { type Edge, type Node, Position } from "@xyflow/react"

import type { BrandColorKey } from "@/lib/brand-colors"

export const NODE_WIDTH = 180
export const NODE_HEIGHT = 90
export const ROOT_NODE_HEIGHT = 80

export type DeptRow = {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  color?: BrandColorKey | null
  process_count: number
  workflow_count: number
  process_ids: string[]
  workflow_ids: string[]
  process_names: string[]
  workflow_names: string[]
}

export type OrgNodeData = {
  label: string
  isRoot: boolean
  color?: BrandColorKey
  logoUrl?: string
  processCount?: number
  workflowCount?: number
}

const ROOT_ID = "__org_root__"

export function buildOrgLayout(
  orgName: string,
  departments: DeptRow[],
  logoUrl?: string
): { nodes: Node<OrgNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 })

  g.setNode(ROOT_ID, { width: NODE_WIDTH, height: ROOT_NODE_HEIGHT })

  for (const dept of departments) {
    g.setNode(dept.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const dept of departments) {
    g.setEdge(dept.parent_id ?? ROOT_ID, dept.id)
  }

  dagre.layout(g)

  const toRfNode = (id: string, data: OrgNodeData): Node<OrgNodeData> => {
    const dagreNode = g.node(id)
    return {
      id,
      type: "orgNode",
      position: {
        x: dagreNode.x - dagreNode.width / 2,
        y: dagreNode.y - dagreNode.height / 2,
      },
      targetPosition: Position.Top,
      sourcePosition: Position.Bottom,
      data,
    }
  }

  const rootNode = toRfNode(ROOT_ID, {
    label: orgName,
    isRoot: true,
    logoUrl,
  })

  const deptNodes = departments.map((d) =>
    toRfNode(d.id, {
      label: d.name,
      isRoot: false,
      color: d.color ?? undefined,
      processCount: d.process_count,
      workflowCount: d.workflow_count,
    })
  )

  const edges: Edge[] = departments.map((d) => ({
    id: `${d.parent_id ?? ROOT_ID}→${d.id}`,
    source: d.parent_id ?? ROOT_ID,
    target: d.id,
    type: "smoothstep",
  }))

  return { nodes: [rootNode, ...deptNodes], edges }
}
