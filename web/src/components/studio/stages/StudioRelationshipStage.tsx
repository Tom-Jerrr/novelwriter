import { useMemo, useState, type KeyboardEvent } from 'react'
import { ArrowLeft, Compass, Sparkles } from 'lucide-react'
import { RelationshipInspector } from '@/components/world-model/relationships/RelationshipInspector'
import { NwButton } from '@/components/ui/nw-button'
import { useWorldEntities } from '@/hooks/world/useEntities'
import {
  useConfirmRelationships,
  useDeleteRelationship,
  useUpdateRelationship,
  useWorldRelationships,
} from '@/hooks/world/useRelationships'
import { cn } from '@/lib/utils'

export function StudioRelationshipStage({
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
  const { data: entities = [] } = useWorldEntities(novelId)
  const { data: relationships = [] } = useWorldRelationships(
    novelId,
    entityId !== null ? { entity_id: entityId } : undefined,
    entityId !== null,
  )
  const updateRelationship = useUpdateRelationship(novelId)
  const deleteRelationship = useDeleteRelationship(novelId)
  const confirmRelationships = useConfirmRelationships(novelId)
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<number | null>(null)

  const entityName = entityId === null
    ? null
    : entities.find((entity) => entity.id === entityId)?.name ?? null
  const effectiveSelectedRelationshipId = (
    selectedRelationshipId !== null && relationships.some((relationship) => relationship.id === selectedRelationshipId)
  )
    ? selectedRelationshipId
    : (relationships[0]?.id ?? null)
  const selectedRelationship = useMemo(
    () => relationships.find((relationship) => relationship.id === effectiveSelectedRelationshipId) ?? null,
    [effectiveSelectedRelationshipId, relationships],
  )

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden" data-testid="studio-relationship-stage">
      <div className="shrink-0 border-b border-[var(--nw-glass-border)] px-6 py-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-1">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground">
              Studio
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              关系检查
            </h2>
            <p className="text-sm text-muted-foreground">
              围绕 {entityName ?? '当前实体'} 轻量检查关系描述、一致性与草稿确认；图谱与拓扑修改仍留在 Atlas。
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
              关系 Copilot
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

      {entityId === null ? (
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          未找到可检查的实体上下文。
        </div>
      ) : (
        <div className="flex-1 min-h-0 flex overflow-hidden">
          <div className="w-[280px] shrink-0 border-r border-[var(--nw-glass-border)] bg-[var(--nw-glass-bg)] backdrop-blur-2xl overflow-hidden flex flex-col min-h-0">
            <div className="shrink-0 p-4 space-y-2">
              <div className="text-sm font-medium text-foreground">
                {entityName ?? `实体 ${entityId}`} 的关系
              </div>
              <div className="text-xs text-muted-foreground">
                共 {relationships.length} 条关系
              </div>
            </div>

            <div className="nw-scrollbar-thin min-h-0 flex-1 overflow-y-auto">
              {relationships.length === 0 ? (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  暂无关系
                </div>
              ) : (
                relationships.map((relationship) => {
                  const targetName = entities.find((entity) => entity.id === relationship.target_id)?.name ?? String(relationship.target_id)
                  const selected = relationship.id === effectiveSelectedRelationshipId
                  return (
                    <div
                      key={relationship.id}
                      className={cn(
                        'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors cursor-pointer',
                        selected
                          ? 'bg-[var(--nw-glass-bg-hover)] border-l-2 border-l-accent'
                          : 'hover:bg-[var(--nw-glass-bg-hover)]',
                      )}
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedRelationshipId(relationship.id)}
                      onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault()
                          setSelectedRelationshipId(relationship.id)
                        }
                      }}
                    >
                      {relationship.status === 'draft' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-[hsl(var(--color-status-draft))] shrink-0" />
                      )}
                      <span className="truncate flex-1 text-foreground">
                        {relationship.label || '未命名关系'}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[100px]">
                        → {targetName}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          <div className="flex-1 min-w-0 overflow-hidden">
            <RelationshipInspector
              rel={selectedRelationship}
              entities={entities}
              onUpdate={(relId, data) => updateRelationship.mutate({ relId, data })}
              onConfirm={(relId) => confirmRelationships.mutate([relId])}
              onDelete={(relId) => deleteRelationship.mutate(relId)}
              allowDelete={false}
              layout="full"
              className="h-full min-h-0"
            />
          </div>
        </div>
      )}
    </div>
  )
}
