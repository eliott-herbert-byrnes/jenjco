import { NextResponse } from 'next/server'
import { z } from 'zod'

import { getServerAuth } from '@/lib/auth'
import {
  buildSystemLogsQuery,
  SYSTEM_LOGS_EXPORT_LIMIT,
  systemLogsToCsv,
  systemLogsToExportRows,
  type SystemLogRecord,
} from '@/lib/system-logs-query'
import { createClient } from '@/lib/supabase/server'

const filterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  team: z.string().uuid().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  tz: z.string().optional(),
})

const exportBodySchema = z.object({
  format: z.enum(['json', 'csv']),
  ids: z.array(z.string().uuid()).optional(),
  filters: filterSchema.optional(),
})

function exportFilename(format: 'json' | 'csv'): string {
  const date = new Date().toISOString().slice(0, 10)
  return `system-logs-${date}.${format}`
}

export async function POST(request: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (appUser.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let body: z.infer<typeof exportBodySchema>
  try {
    const json = await request.json()
    const parsed = exportBodySchema.safeParse(json)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }
    body = parsed.data
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const supabase = await createClient()
  const orgId = appUser.orgId

  const { data: departments } = await supabase
    .from('departments')
    .select('id, name')
    .eq('org_id', orgId)

  const departmentNames = new Map(
    (departments ?? []).map((department) => [department.id, department.name]),
  )

  let rows: SystemLogRecord[] = []

  if (body.ids?.length) {
    if (body.ids.length > SYSTEM_LOGS_EXPORT_LIMIT) {
      return NextResponse.json(
        {
          error: `Cannot export more than ${SYSTEM_LOGS_EXPORT_LIMIT.toLocaleString()} rows at once`,
        },
        { status: 413 },
      )
    }

    const { data, error } = await buildSystemLogsQuery(supabase, orgId, {}, {
      ids: body.ids,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    rows = (data ?? []) as SystemLogRecord[]

    if (rows.length !== body.ids.length) {
      return NextResponse.json(
        { error: 'One or more selected rows were not found' },
        { status: 404 },
      )
    }
  } else if (body.filters) {
    const { count, error: countError } = await buildSystemLogsQuery(
      supabase,
      orgId,
      body.filters,
      { count: 'exact' },
    )

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    if ((count ?? 0) > SYSTEM_LOGS_EXPORT_LIMIT) {
      return NextResponse.json(
        {
          error: `Export exceeds the ${SYSTEM_LOGS_EXPORT_LIMIT.toLocaleString()} row limit (${count?.toLocaleString()} matching rows). Narrow your filters.`,
        },
        { status: 413 },
      )
    }

    const { data, error } = await buildSystemLogsQuery(
      supabase,
      orgId,
      body.filters,
    ).limit(SYSTEM_LOGS_EXPORT_LIMIT)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    rows = (data ?? []) as SystemLogRecord[]
  } else {
    return NextResponse.json(
      { error: 'Provide either ids or filters for export' },
      { status: 400 },
    )
  }

  const filename = exportFilename(body.format)
  const disposition = `attachment; filename="${filename}"`

  if (body.format === 'csv') {
    const csv = systemLogsToCsv(rows, departmentNames)
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': disposition,
      },
    })
  }

  const json = systemLogsToExportRows(rows, departmentNames)
  return new NextResponse(JSON.stringify(json, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Disposition': disposition,
    },
  })
}
