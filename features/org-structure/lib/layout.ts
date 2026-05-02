import dagre from "@dagrejs/dagre"
import { type Edge, type Node, Position } from "@xyflow/react"

export const NODE_WIDTH = 180
export const NODE_HEIGHT = 60

export type DeptRow = {
  id: string
  name: string
  parent_id: string | null
  sort_order: number
  process_count: number
}

export type OrgNodeData = {
  label: string
  isRoot: boolean
  processCount?: number
}

const ROOT_ID = "__org_root__"

export function buildOrgLayout(
  orgName: string,
  departments: DeptRow[]
): { nodes: Node<OrgNodeData>[]; edges: Edge[] } {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: "TB", ranksep: 80, nodesep: 40 })

  g.setNode(ROOT_ID, { width: NODE_WIDTH, height: NODE_HEIGHT })

  for (const dept of departments) {
    g.setNode(dept.id, { width: NODE_WIDTH, height: NODE_HEIGHT })
  }

  for (const dept of departments) {
    g.setEdge(dept.parent_id ?? ROOT_ID, dept.id)
  }

  dagre.layout(g)

  const toRfNode = (id: string, data: OrgNodeData): Node<OrgNodeData> => ({
    id,
    type: "orgNode",
    position: {
      x: g.node(id).x - NODE_WIDTH / 2,
      y: g.node(id).y - NODE_HEIGHT / 2,
    },
    targetPosition: Position.Top,
    sourcePosition: Position.Bottom,
    data,
  })

  const rootNode = toRfNode(ROOT_ID, { label: orgName, isRoot: true })

  const deptNodes = departments.map((d) =>
    toRfNode(d.id, {
      label: d.name,
      isRoot: false,
      processCount: d.process_count,
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
