import { ArrowLeft, Compass, Sparkles } from 'lucide-react'
import { EntityDetail } from '@/components/world-model/entities/EntityDetail'
import { NwButton } from '@/components/ui/nw-button'

export function StudioEntityStage({
  novelId,
  entityId,
  onReturnToArtifact,
  onOpenAtlas,
  onOpenCopilot,
}: {
  novelId: number
  entityId: number | null
  onReturnToArtifact?: () => void
  onOpenAtlas: () => void
  onOpenCopilot: () => void
}) {
  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" data-testid="studio-entity-stage">
      <div className="shrink-0 border-b border-[var(--nw-glass-border)] px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Studio
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              实体检查
            </h2>
            <p className="text-sm text-muted-foreground">
              查看并轻量编辑当前上下文关联的实体；复杂结构治理仍留给 Atlas。
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {onReturnToArtifact ? (
              <NwButton
                onClick={onReturnToArtifact}
                variant="glass"
                className="rounded-[10px] px-4 py-2 text-sm font-medium"
              >
                <ArrowLeft size={14} />
                返回结果
              </NwButton>
            ) : null}
            <NwButton
              onClick={onOpenCopilot}
              variant="glass"
              className="rounded-[10px] px-4 py-2 text-sm font-medium"
            >
              <Sparkles size={14} />
              实体 Copilot
            </NwButton>
            <NwButton
              onClick={onOpenAtlas}
              variant="accentOutline"
              className="rounded-[10px] px-4 py-2 text-sm font-medium"
            >
              <Compass size={14} />
              在 Atlas 中打开
            </NwButton>
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex overflow-hidden">
        <EntityDetail
          novelId={novelId}
          entityId={entityId}
          allowDelete={false}
          copilotSurface="studio"
          copilotStage="entity"
        />
      </div>
    </div>
  )
}
