import { Badge } from '@/components/ui/badge'
import { isRunningRunStatus } from '@/features/workflows/lib/format-duration'
import {
  RUNNING_BADGE_CLASS,
  RUN_SUCCESS_BADGE_CLASS,
  STEP_KIND_BADGE_CLASSES,
} from '@/lib/brand-colors'

export function StepStatusBadge({ status }: { status: string }) {
  if (status === 'failed' || status === 'cancelled') {
    return <Badge variant="destructive">{status}</Badge>
  }
  if (status === 'completed') {
    return <Badge className={RUN_SUCCESS_BADGE_CLASS}>{status}</Badge>
  }
  if (isRunningRunStatus(status)) {
    return <Badge className={RUNNING_BADGE_CLASS}>{status}</Badge>
  }
  return <Badge variant="outline">{status}</Badge>
}

export function StepKindBadge({ kind }: { kind: string }) {
  if (kind === 'deterministic') {
    return (
      <Badge className={STEP_KIND_BADGE_CLASSES.deterministic}>{kind}</Badge>
    )
  }
  if (kind === 'ai') {
    return <Badge className={STEP_KIND_BADGE_CLASSES.ai}>{kind}</Badge>
  }
  return <Badge variant="outline">{kind}</Badge>
}
