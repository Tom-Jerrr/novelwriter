// SPDX-FileCopyrightText: 2026 Isaac.X.Ω.Yuan
// SPDX-License-Identifier: AGPL-3.0-only

import { Navigate, useLocation, useParams } from 'react-router-dom'
import {
  readNovelShellArtifactPanelSearchParams,
  setNovelShellArtifactPanelSearchParams,
  setStudioResultsStageSearchParams,
} from '@/components/novel-shell/NovelShellRouteState'

export function GenerationResults() {
  const { novelId, chapterNum } = useParams<{ novelId: string; chapterNum: string }>()
  const location = useLocation()

  if (!novelId) return <Navigate to="/library" replace />

  let nextSearchParams = setStudioResultsStageSearchParams(new URLSearchParams(location.search), chapterNum ? Number(chapterNum) : null)
  nextSearchParams = setNovelShellArtifactPanelSearchParams(
    nextSearchParams,
    readNovelShellArtifactPanelSearchParams(new URLSearchParams(location.search)),
  )

  return (
    <Navigate
      to={{ pathname: `/novel/${novelId}`, search: nextSearchParams.toString() }}
      replace
      state={location.state}
    />
  )
}
