import { useMemo, useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, Database, Search, Sparkles, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CopilotEvidence, CopilotTraceStep } from '@/types/copilot'
import { getCopilotEvidenceSourceMeta } from './novelCopilotView'
import {
  copilotPanelClassName,
  copilotPanelMutedClassName,
  copilotPillClassName,
  copilotPillInteractiveClassName,
  copilotQuoteClassName,
} from './novelCopilotChrome'

type ResearchDetailSelection =
  | { type: 'evidence'; id: string }
  | { type: 'tool'; id: string }

function readEvidenceChapterLabel(evidence: CopilotEvidence) {
  const chapterNumber = typeof evidence.source_ref?.chapter_number === 'number'
    ? evidence.source_ref.chapter_number
    : null
  return chapterNumber ? `第${chapterNumber}章` : null
}

function getEvidencePreviewText(evidence: CopilotEvidence) {
  return evidence.preview_excerpt?.trim() ? evidence.preview_excerpt : evidence.excerpt
}

function getEvidenceDetailHeading(evidence: CopilotEvidence) {
  if (evidence.pack_id) return evidence.expanded ? '更多上下文' : '相关依据'
  return '完整依据'
}

function getEvidenceStateLabel(evidence: CopilotEvidence) {
  if (!evidence.pack_id) return null
  return evidence.expanded ? '已展开更多上下文' : '线索摘要'
}

function getEvidenceReasonText(evidence: CopilotEvidence) {
  const raw = evidence.why_relevant?.trim() ?? ''
  if (!raw) return evidence.pack_id ? '已从相关线索中整理' : ''

  if (/tool-discovered/i.test(raw)) {
    return evidence.expanded ? '已展开更多上下文' : '已从相关线索中整理'
  }

  const normalized = raw
    .replace(/Tool-discovered/gi, '已从检索结果整理')
    .replace(/\(support:\s*\d+\)/gi, '')
    .replace(/support[:：]?\s*\d+/gi, '')
    .replace(/证据包/g, '相关线索')
    .replace(/\s{2,}/g, ' ')
    .trim()

  return normalized || (evidence.pack_id ? '已从相关线索中整理' : '')
}

function getToolSummaryText(step: CopilotTraceStep) {
  return step.summary
    .replace(/^本轮启用工具研究模式，调用 (\d+) 次工具$/, '本轮通过分步检索整理信息，共执行 $1 步')
    .replace(/^本轮未触发工具调用，模型直接完成分析$/, '本轮未追加检索步骤，模型直接完成分析')
    .replace(/^当前模型不支持工具调用，已降级为单轮分析$/, '当前模型不支持分步检索，已切换为直接分析')
    .replace(/^工具链路异常（(.+)），已降级为单轮分析$/, '分步检索异常（$1），已切换为直接分析')
    .replace(/^正在整理工具结果并生成回答\.\.\.$/, '正在整理检索结果并生成回答...')
    .replace(/^工具检索：搜索/, '搜索')
    .replace(/^工具展开：打开证据包 .+?(，来源 \d+ 条)?$/, (_match, suffix?: string) =>
      `展开更多上下文${suffix ? suffix.replace('，来源', '，补充了').replace('条', '条来源') : ''}`,
    )
    .replace(/^展开更多上下文（.+?）/, '展开更多上下文')
    .replace(/^工具读取：读取 /, '读取 ')
    .replace(/^工具快照：/, '刷新当前设定：')
    .replace(/^工具模式：/, '研究过程：')
    .replace(/证据包/g, '相关线索')
    .replace(/命中 (\d+) 个证据包/g, '找到 $1 组相关线索')
}

function getToolMeta(step: CopilotTraceStep) {
  switch (step.kind) {
    case 'tool_find':
      return { label: '搜索线索', icon: Search }
    case 'tool_open':
      return { label: '展开上下文', icon: BookOpen }
    case 'tool_read':
    case 'tool_load_scope_snapshot':
      return { label: '读取设定', icon: Database }
    case 'tool_mode':
      return { label: '研究过程', icon: Wrench }
    default:
      return { label: '研究步骤', icon: Sparkles }
  }
}

function buildProcessSummary(toolCount: number, evidenceCount: number, hasRunningStep: boolean) {
  const parts: string[] = []
  if (toolCount > 0) parts.push(`${toolCount} 步检索`)
  if (evidenceCount > 0) parts.push(`${evidenceCount} 条依据`)
  if (parts.length === 0) return hasRunningStep ? '处理中' : '暂无依据'
  return parts.join(' · ')
}

export function NovelCopilotResearchProcess({
  trace,
  evidence,
}: {
  trace: CopilotTraceStep[]
  evidence: CopilotEvidence[]
}) {
  const toolModeStep = trace.find((step) => step.kind === 'tool_mode') ?? null
  const toolSteps = useMemo(
    () => trace.filter((step) => step.kind.startsWith('tool_') && step.kind !== 'tool_mode'),
    [trace],
  )
  const hasRunningStep = trace.some((step) => step.status === 'running')
  const hasProcessContent = trace.length > 0 || evidence.length > 0
  const [isExpanded, setIsExpanded] = useState(false)
  const [selection, setSelection] = useState<ResearchDetailSelection | null>(null)

  const selectedEvidence =
    selection?.type === 'evidence'
      ? evidence.find((item) => item.evidence_id === selection.id) ?? null
      : null
  const selectedTool =
    selection?.type === 'tool'
      ? toolSteps.find((item) => item.step_id === selection.id) ?? null
      : null

  if (!hasProcessContent) return null

  const processSummary = buildProcessSummary(toolSteps.length, evidence.length, hasRunningStep)

  return (
    <section className={cn('rounded-[22px] p-3.5', copilotPanelClassName)} data-testid="copilot-research-process">
      <button
        type="button"
        onClick={() => setIsExpanded((value) => !value)}
        className="flex w-full items-center justify-between gap-3 text-left"
        aria-expanded={isExpanded}
        aria-label={isExpanded ? '收起研究过程' : '展开研究过程'}
      >
        <div className="min-w-0">
          <div className="text-[11px] font-semibold tracking-[0.2em] text-foreground/82 uppercase">
            研究过程
          </div>
          <div className="mt-1 text-[12px] text-muted-foreground/78">
            {processSummary}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {toolModeStep ? (
            <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/78', copilotPillClassName)}>
              {toolModeStep.status === 'running' ? '处理中' : '可查看'}
            </span>
          ) : null}
          <span className={cn('inline-flex h-8 w-8 items-center justify-center rounded-full', copilotPillInteractiveClassName)}>
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </span>
        </div>
      </button>

      {isExpanded ? (
        <div className="mt-3 space-y-3 border-t border-[var(--nw-copilot-border)] pt-3">
          {toolModeStep ? (
            <div className={cn('rounded-[18px] px-3 py-2.5 text-[12px] text-muted-foreground/80', copilotPanelMutedClassName)}>
              {getToolSummaryText(toolModeStep)}
            </div>
          ) : null}

          {toolSteps.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/72">
                检索过程
              </div>
              <div className="space-y-2">
                {toolSteps.map((step) => {
                  const meta = getToolMeta(step)
                  const Icon = meta.icon
                  const active = selection?.type === 'tool' && selection.id === step.step_id
                  return (
                    <button
                      key={step.step_id}
                      type="button"
                      onClick={() => setSelection({ type: 'tool', id: step.step_id })}
                      className={cn(
                        'flex w-full items-start gap-3 rounded-[18px] px-3 py-2.5 text-left transition-colors',
                        active ? copilotPanelClassName : copilotPanelMutedClassName,
                      )}
                    >
                      <span className={cn('mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full', copilotPillClassName)}>
                        <Icon className="h-3.5 w-3.5 text-foreground/78" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[11px] text-muted-foreground/72">{meta.label}</span>
                        <span className="mt-1 block text-[12px] leading-5 text-foreground/90">{getToolSummaryText(step)}</span>
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {evidence.length > 0 ? (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/72">
                相关依据
              </div>
              <div className="space-y-2">
                {evidence.map((item) => {
                  const meta = getCopilotEvidenceSourceMeta(item.source_type)
                  const active = selection?.type === 'evidence' && selection.id === item.evidence_id
                  const previewText = getEvidencePreviewText(item)
                  const preview = previewText.length > 84 ? `${previewText.slice(0, 84)}…` : previewText
                  const chapterLabel = readEvidenceChapterLabel(item)
                  const evidenceStateLabel = getEvidenceStateLabel(item)
                  const evidenceReason = getEvidenceReasonText(item)
                  return (
                    <button
                      key={item.evidence_id}
                      type="button"
                      onClick={() => setSelection({ type: 'evidence', id: item.evidence_id })}
                      className={cn(
                        'flex w-full flex-col gap-2 rounded-[18px] px-3 py-3 text-left transition-colors',
                        active ? copilotPanelClassName : copilotPanelMutedClassName,
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                          <span className={cn('inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]', meta.chipClassName)}>
                            {meta.label}
                          </span>
                          {evidenceStateLabel ? (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/78', copilotPillClassName)}>
                              {evidenceStateLabel}
                            </span>
                          ) : null}
                          {chapterLabel ? (
                            <span className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/78', copilotPillClassName)}>
                              {chapterLabel}
                            </span>
                          ) : null}
                        </div>
                        {evidenceReason ? (
                          <span className={cn('truncate rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/80', copilotPillClassName)} title={evidenceReason}>
                            {evidenceReason}
                          </span>
                        ) : null}
                      </div>
                      <div className="text-[12px] font-medium text-foreground/92">{item.title}</div>
                      <div className="text-[12px] leading-5 text-muted-foreground/78">{preview}</div>
                      {item.anchor_terms && item.anchor_terms.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {item.anchor_terms.slice(0, 4).map((term) => (
                            <span
                              key={`${item.evidence_id}-${term}`}
                              className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/76', copilotPillClassName)}
                            >
                              {term}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : null}

          {(selectedEvidence || selectedTool) ? (
            <div className={cn('space-y-2 rounded-[20px] p-3.5', copilotPanelClassName)} data-testid="copilot-research-detail">
              {selectedEvidence ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/72">
                      {getEvidenceDetailHeading(selectedEvidence)}
                    </div>
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {getEvidenceStateLabel(selectedEvidence) ? (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/80', copilotPillClassName)}>
                          {getEvidenceStateLabel(selectedEvidence)}
                        </span>
                      ) : null}
                      {readEvidenceChapterLabel(selectedEvidence) ? (
                        <span className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/80', copilotPillClassName)}>
                          {readEvidenceChapterLabel(selectedEvidence)}
                        </span>
                      ) : null}
                      <span className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/80', copilotPillClassName)}>
                        {selectedEvidence.title}
                      </span>
                    </div>
                  </div>
                  {getEvidenceReasonText(selectedEvidence) ? (
                    <div className="text-[12px] text-muted-foreground/76">{getEvidenceReasonText(selectedEvidence)}</div>
                  ) : null}
                  <div className={cn('rounded-[18px] px-3 py-3', copilotQuoteClassName)}>
                    <div className="whitespace-pre-wrap text-[13px] leading-6 text-foreground/88">
                      {selectedEvidence.excerpt}
                    </div>
                  </div>
                </>
              ) : null}

              {selectedTool ? (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-foreground/72">
                      过程说明
                    </div>
                    <span className={cn('rounded-full px-2 py-0.5 text-[10px] text-muted-foreground/80', copilotPillClassName)}>
                      {getToolMeta(selectedTool).label}
                    </span>
                  </div>
                  <div className="text-[13px] leading-6 text-foreground/90">{getToolSummaryText(selectedTool)}</div>
                  <div className={cn('rounded-[18px] px-3 py-3 text-[12px] leading-5 text-muted-foreground/78', copilotPanelMutedClassName)}>
                    这里展示的是本轮检索步骤摘要，用来解释这次回答如何整理出来；它不是原文依据。
                  </div>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
