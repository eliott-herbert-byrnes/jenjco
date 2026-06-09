import type { JsonSchemaProps } from '../types'

export function defaultInputFromSchema(
  inputSchema: Record<string, unknown> | undefined
): Record<string, string> {
  const schema = inputSchema as JsonSchemaProps | undefined
  const props = schema?.properties ?? {}
  const out: Record<string, string> = {}
  for (const key of Object.keys(props)) {
    if (key === 'orgId') continue
    out[key] = ''
  }
  return out
}

/** Property keys: required fields first (schema order), then remaining keys in definition order. */
export function orderedInputKeys(schema: JsonSchemaProps | undefined): string[] {
  if (!schema?.properties) return []
  const props = schema.properties
  const required = schema.required ?? []
  const seen = new Set<string>()
  const out: string[] = []
  for (const k of required) {
    if (k === 'orgId' || !(k in props) || seen.has(k)) continue
    out.push(k)
    seen.add(k)
  }
  for (const k of Object.keys(props)) {
    if (k === 'orgId' || seen.has(k)) continue
    out.push(k)
    seen.add(k)
  }
  return out
}
