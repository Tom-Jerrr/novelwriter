import {
  FileSearch,
  FileText,
  Link2,
  type LucideIcon,
  Search,
  Sparkles,
} from 'lucide-react'
import type { CopilotPrefill } from '@/types/copilot'
import { getCopilotScenario } from './novelCopilotHelpers'

export interface CopilotQuickActionSpec {
  id: string
  label: string
  description: string
  prompt: string
  icon: LucideIcon
  iconClassName: string
  glowClassName: string
  layoutClassName?: string
}

export interface CopilotWorkbenchMeta {
  introEyebrow: string
  introTitle: string
  composerLabel: string
  composerPlaceholder: string
  quickActions: CopilotQuickActionSpec[]
}

function wholeBookActions(): CopilotQuickActionSpec[] {
  return [
    {
      id: 'scan_world_gaps',
      label: '盘点设定缺口',
      description: '找出反复出现却仍未入模的对象与规则',
      prompt: '请从全书角度盘点反复出现但尚未进入世界模型的势力、地点、规则或概念。',
      icon: Search,
      iconClassName: 'bg-[hsl(var(--accent)/0.12)] text-accent-foreground ring-1 ring-[hsl(var(--accent)/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-1),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
      layoutClassName: 'sm:col-span-2',
    },
    {
      id: 'trace_recurring_signals',
      label: '梳理高频线索',
      description: '聚焦势力、地点与规则的关键锚点',
      prompt: '请梳理全书里反复出现的势力、地点与规则线索，并指出最值得进一步研究的世界锚点。',
      icon: Sparkles,
      iconClassName: 'bg-[hsl(270_80%_65%/0.10)] text-[hsl(270_80%_65%)] ring-1 ring-[hsl(270_80%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-2),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
    {
      id: 'find_world_conflicts',
      label: '定位冲突风险',
      description: '提前发现命名漂移与设定空洞',
      prompt: '请检查章节高频提及与当前世界模型之间的命名冲突、设定漂移和明显空洞。',
      icon: FileSearch,
      iconClassName: 'bg-[hsl(220_90%_65%/0.10)] text-[hsl(220_90%_65%)] ring-1 ring-[hsl(220_90%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-3),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
  ]
}

function currentEntityActions(subject: string): CopilotQuickActionSpec[] {
  return [
    {
      id: 'complete_entity',
      label: '补完当前实体',
      description: '补足类别、属性、别名与关键约束',
      prompt: `请补完 ${subject} 的关键设定。实体不只可能是人物，也可能是势力、地点、组织、物件或概念；请先判断类型，再补足别名、属性、约束和关联线索。`,
      icon: Sparkles,
      iconClassName: 'bg-[hsl(var(--accent)/0.12)] text-accent-foreground ring-1 ring-[hsl(var(--accent)/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-1),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
      layoutClassName: 'sm:col-span-2',
    },
    {
      id: 'find_relations',
      label: '挖掘关系线索',
      description: '检索互动证据与潜在连接',
      prompt: `请围绕 ${subject} 梳理最值得确认的关系线索与潜在连接。`,
      icon: Link2,
      iconClassName: 'bg-[hsl(270_80%_65%/0.10)] text-[hsl(270_80%_65%)] ring-1 ring-[hsl(270_80%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-2),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
    {
      id: 'collect_entity_evidence',
      label: '汇总章节证据',
      description: '集中查看支撑补完的关键片段',
      prompt: `请汇总最能支撑 ${subject} 补完的章节证据，并按重要性排序。`,
      icon: FileSearch,
      iconClassName: 'bg-[hsl(220_90%_65%/0.10)] text-[hsl(220_90%_65%)] ring-1 ring-[hsl(220_90%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-3),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
  ]
}

function relationshipActions(subject: string): CopilotQuickActionSpec[] {
  return [
    {
      id: 'find_relations',
      label: '补全缺失关系',
      description: '围绕中心实体找出最值得确认的连接',
      prompt: `请围绕 ${subject} 梳理最值得确认的关系线索、缺失连接与关系方向。`,
      icon: Link2,
      iconClassName: 'bg-[hsl(var(--accent)/0.12)] text-accent-foreground ring-1 ring-[hsl(var(--accent)/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-1),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
      layoutClassName: 'sm:col-span-2',
    },
    {
      id: 'label_relationships',
      label: '统一关系标签',
      description: '清理含混、重复或过弱的表述',
      prompt: `请统一 ${subject} 相关关系的标签表述，并指出含混、重复或语义过弱的关系。`,
      icon: Sparkles,
      iconClassName: 'bg-[hsl(270_80%_65%/0.10)] text-[hsl(270_80%_65%)] ring-1 ring-[hsl(270_80%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-2),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
    {
      id: 'collect_interactions',
      label: '汇总互动证据',
      description: '回看关键人物、势力与章节片段',
      prompt: `请汇总 ${subject} 与关键人物、势力互动的章节证据，并标出最值得建模的连接。`,
      icon: FileSearch,
      iconClassName: 'bg-[hsl(220_90%_65%/0.10)] text-[hsl(220_90%_65%)] ring-1 ring-[hsl(220_90%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-3),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
  ]
}

function draftCleanupActions(): CopilotQuickActionSpec[] {
  return [
    {
      id: 'review_drafts',
      label: '筛出优先草稿',
      description: '找出最值得优先确认或补完的条目',
      prompt: '请整理当前草稿并指出最值得优先处理的缺口。',
      icon: FileText,
      iconClassName: 'bg-[hsl(var(--accent)/0.12)] text-accent-foreground ring-1 ring-[hsl(var(--accent)/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-1),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
      layoutClassName: 'sm:col-span-2',
    },
    {
      id: 'normalize_terms',
      label: '统一草稿命名',
      description: '收束重复概念与别名漂移',
      prompt: '请统一当前草稿中的命名、别名和重复概念，优先指出可直接清理的候选。',
      icon: Sparkles,
      iconClassName: 'bg-[hsl(270_80%_65%/0.10)] text-[hsl(270_80%_65%)] ring-1 ring-[hsl(270_80%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-2),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
    {
      id: 'fill_missing_fields',
      label: '补足缺失字段',
      description: '找出描述过短或字段缺失的草稿',
      prompt: '请找出当前草稿中字段缺失、描述过短或明显可补完的条目，并按价值排序。',
      icon: FileSearch,
      iconClassName: 'bg-[hsl(220_90%_65%/0.10)] text-[hsl(220_90%_65%)] ring-1 ring-[hsl(220_90%_65%/0.20)]',
      glowClassName: 'bg-[radial-gradient(circle_at_top_left,var(--nw-copilot-glow-3),transparent_62%)] [mix-blend-mode:var(--nw-copilot-glow-blend)]',
    },
  ]
}

export function getCopilotWorkbenchMeta(prefill: CopilotPrefill, displayTitle: string): CopilotWorkbenchMeta {
  const scenario = getCopilotScenario(prefill)
  const subject = displayTitle || '当前对象'

  switch (scenario) {
    case 'whole_book':
      return {
        introEyebrow: '研究工作台',
        introTitle: '从全书视角检索世界状态、设定缺口与潜在线索。',
        composerLabel: '研究问题',
        composerPlaceholder: '输入研究问题，例如“盘点全书里反复出现但尚未入模的势力、地点和规则”',
        quickActions: wholeBookActions(),
      }
    case 'relationships':
      return {
        introEyebrow: '关系研究',
        introTitle: `围绕 ${subject} 梳理缺失关系、互动证据与标签表述。`,
        composerLabel: '关系研究目标',
        composerPlaceholder: `输入关系研究目标，例如“找出${subject}与各势力之间缺失但有证据的连接”`,
        quickActions: relationshipActions(subject),
      }
    case 'draft_cleanup':
      return {
        introEyebrow: '草稿清理',
        introTitle: '整理现有草稿，统一命名、补足缺失字段，并标记可直接确认的候选。',
        composerLabel: '清理目标',
        composerPlaceholder: '输入清理目标，例如“统一草稿命名并标出最值得先确认的条目”',
        quickActions: draftCleanupActions(),
      }
    default:
      return {
        introEyebrow: '实体补完',
        introTitle: `围绕 ${subject} 补足类型、属性、约束与关联线索，不要默认它只是人物。`,
        composerLabel: '补充要求',
        composerPlaceholder: `输入补充要求，例如“优先补足${subject}与宗门的关联线索”`,
        quickActions: currentEntityActions(subject),
      }
  }
}
