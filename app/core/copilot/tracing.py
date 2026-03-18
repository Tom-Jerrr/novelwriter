# SPDX-FileCopyrightText: 2026 Isaac.X.Ω.Yuan
# SPDX-License-Identifier: AGPL-3.0-only

"""Tool-loop journal and trace helpers for copilot."""

from __future__ import annotations

import json
from typing import Any, TYPE_CHECKING

if TYPE_CHECKING:
    from app.core.copilot.workspace import Workspace


def _truncate_trace_text(value: str, limit: int = 48) -> str:
    text = value.strip()
    if len(text) <= limit:
        return text
    return f"{text[:limit - 1]}…"


def _maybe_parse_json_object(raw: str) -> dict[str, Any] | None:
    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        return None
    return parsed if isinstance(parsed, dict) else None


def _tool_kind_for_name(tool_name: str) -> str:
    return {
        "find": "tool_find",
        "open": "tool_open",
        "read": "tool_read",
        "load_scope_snapshot": "tool_load_scope_snapshot",
    }.get(tool_name, "tool_other")


def _build_tool_trace_summary(tool_name: str, tool_args: dict[str, Any], tool_result: str) -> str:
    payload = _maybe_parse_json_object(tool_result) or {}
    if isinstance(payload.get("error"), str):
        return f"检索步骤未完成：{_truncate_trace_text(payload['error'], limit=64)}"

    if tool_name == "find":
        query = _truncate_trace_text(str(tool_args.get("query", "") or "（空查询）"))
        scope = str(tool_args.get("scope", "all") or "all")
        total_found = payload.get("total_found")
        summary = f"搜索「{query}」"
        if scope != "all":
            summary += f"（范围：{scope}）"
        if isinstance(total_found, int):
            summary += f"，找到 {total_found} 组相关线索"
        return summary

    if tool_name == "open":
        source_refs = payload.get("source_refs")
        source_count = len(source_refs) if isinstance(source_refs, list) else None
        summary = "展开更多上下文"
        if source_count is not None:
            summary += f"，补充了 {source_count} 条来源"
        return summary

    if tool_name == "read":
        target_refs = tool_args.get("target_refs")
        target_count = len(target_refs) if isinstance(target_refs, list) else 0
        results = payload.get("results")
        result_count = len(results) if isinstance(results, list) else None
        summary = f"读取 {target_count} 个设定目标"
        if result_count is not None:
            summary += f"，返回 {result_count} 条结果"
        return summary

    if tool_name == "load_scope_snapshot":
        entity_count = payload.get("entity_count")
        relationship_count = payload.get("relationship_count")
        draft_count = payload.get("draft_count")
        parts = ["刷新当前设定快照"]
        if isinstance(entity_count, int):
            parts.append(f"实体 {entity_count}")
        if isinstance(relationship_count, int):
            parts.append(f"关系 {relationship_count}")
        if isinstance(draft_count, int):
            parts.append(f"草稿 {draft_count}")
        return "：".join(parts[:1]) + (f"，{' / '.join(parts[1:])}" if len(parts) > 1 else "：已刷新上下文")

    return f"检索步骤「{tool_name}」已执行"


def build_tool_journal_entry(
    *,
    tool_name: str,
    tool_args: dict[str, Any],
    tool_result: str,
    round_number: int,
    call_index: int,
) -> dict[str, Any]:
    return {
        "step_id": f"tool_{call_index}",
        "kind": _tool_kind_for_name(tool_name),
        "status": "completed",
        "summary": _build_tool_trace_summary(tool_name, tool_args, tool_result),
        "tool": tool_name,
        "args": tool_args,
        "result_summary": tool_result[:200],
        "round": round_number,
    }


def _build_trace_from_tool_journal(workspace: Workspace) -> list[dict[str, Any]]:
    trace_steps: list[dict[str, Any]] = []
    tool_calls = max(0, workspace.tool_call_count)
    if tool_calls > 0:
        trace_steps.append({
            "step_id": "tool_mode",
            "kind": "tool_mode",
            "status": "completed",
            "summary": f"本轮通过分步检索整理信息，共执行 {tool_calls} 步",
        })
    else:
        trace_steps.append({
            "step_id": "tool_mode",
            "kind": "tool_mode",
            "status": "completed",
            "summary": "本轮未追加检索步骤，模型直接完成分析",
        })

    for index, entry in enumerate(workspace.tool_journal, start=1):
        trace_steps.append({
            "step_id": entry.get("step_id", f"tool_{index}"),
            "kind": entry.get("kind", _tool_kind_for_name(str(entry.get("tool", "")))),
            "status": entry.get("status", "completed"),
            "summary": entry.get("summary") or f"工具 {entry.get('tool', 'unknown')}：已执行",
        })

    return trace_steps


def build_running_trace(workspace: Workspace) -> list[dict[str, Any]]:
    trace_steps = _build_trace_from_tool_journal(workspace)
    trace_steps.append({
        "step_id": "analyze_running",
        "kind": "analyze",
        "status": "running",
        "summary": "正在整理检索结果并生成回答...",
    })
    return trace_steps


def build_completed_trace(
    *,
    workspace: Workspace | None,
    execution_mode: str,
    degraded_reason: str | None,
    evidence_count: int,
    suggestion_count: int,
) -> list[dict[str, Any]]:
    trace_steps: list[dict[str, Any]] = []

    if execution_mode == "tool_loop":
        if workspace is not None:
            trace_steps.extend(_build_trace_from_tool_journal(workspace))
        else:
            trace_steps.append({
                "step_id": "tool_mode",
                "kind": "tool_mode",
                "status": "completed",
                "summary": "本轮工具研究已完成",
            })
    elif execution_mode == "one_shot_unsupported":
        trace_steps.append({
            "step_id": "tool_mode",
            "kind": "tool_mode",
            "status": "completed",
            "summary": "当前模型不支持分步检索，已切换为直接分析",
        })
    elif execution_mode == "one_shot_fallback":
        reason = _truncate_trace_text(degraded_reason or "tool_loop_failed", limit=44)
        trace_steps.append({
            "step_id": "tool_mode",
            "kind": "tool_mode",
            "status": "completed",
            "summary": f"分步检索异常（{reason}），已切换为直接分析",
        })

    trace_steps.append({
        "step_id": "evidence_complete",
        "kind": "evidence",
        "status": "completed",
        "summary": f"整理出 {evidence_count} 条可展示依据",
    })
    trace_steps.append({
        "step_id": "analyze_complete",
        "kind": "analyze",
        "status": "completed",
        "summary": f"分析完成，生成 {suggestion_count} 条建议",
    })
    return trace_steps
