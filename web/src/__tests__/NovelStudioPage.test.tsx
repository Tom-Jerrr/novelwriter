import type { ReactNode } from 'react'
import { describe, expect, it, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { NovelShell } from '@/components/novel-shell/NovelShell'
import { NovelStudioPage } from '@/pages/NovelStudioPage'
import { createTestQueryClient } from './helpers'

const mockUseUpdateChapter = vi.fn()
const mockUseCreateChapter = vi.fn()
const mockUseDeleteChapter = vi.fn()
const mockUseWorldEntities = vi.fn()
const mockUseWorldSystems = vi.fn()
const mockUseBootstrapStatus = vi.fn()
const mockUseTriggerBootstrap = vi.fn()
const mockUseDebouncedAutoSave = vi.fn()
const mockUseContinuationSetupState = vi.fn()
const mockReadGenerationResultsDebug = vi.fn()

vi.mock('@/components/layout/PageShell', () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/novel-shell/NovelShellLayout', () => ({
  NovelShellLayout: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/novel-shell/NovelShellRail', () => ({
  NovelShellRail: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/novel-shell/ArtifactStage', () => ({
  ArtifactStage: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/detail/ChapterContent', () => ({
  ChapterContent: ({
    content,
    isLoading,
  }: {
    content: string | null
    isLoading: boolean
  }) => <div>{isLoading ? '加载章节中' : content}</div>,
}))

vi.mock('@/components/detail/ChapterEditor', () => ({
  ChapterEditor: () => <div data-testid="chapter-editor" />,
}))

vi.mock('@/components/detail/EmptyWorldOnboarding', () => ({
  EmptyWorldOnboarding: () => <div data-testid="world-onboarding" />,
}))

vi.mock('@/components/world-model/shared/WorldGenerationDialog', () => ({
  WorldGenerationDialog: () => null,
}))

vi.mock('@/components/ui/glass-surface', () => ({
  GlassSurface: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/generation/DriftWarningPopover', () => ({
  DriftWarningPopover: () => null,
}))

vi.mock('@/components/studio/StudioAssistantPanel', () => ({
  StudioAssistantPanel: () => <div data-testid="studio-assistant" />,
}))

vi.mock('@/components/studio/panels/InjectionSummaryPanel', () => ({
  InjectionSummaryPanel: () => <div data-testid="injection-summary-panel" />,
}))

vi.mock('@/components/studio/stages/ContinuationSetupStage', () => ({
  ContinuationSetupStage: () => <div data-testid="continuation-setup" />,
}))

vi.mock('@/components/studio/stages/StudioEntityStage', () => ({
  StudioEntityStage: () => <div data-testid="studio-entity-stage" />,
}))

vi.mock('@/components/studio/stages/StudioDraftReviewStage', () => ({
  StudioDraftReviewStage: () => <div data-testid="studio-review-stage" />,
}))

vi.mock('@/components/studio/stages/StudioRelationshipStage', () => ({
  StudioRelationshipStage: () => <div data-testid="studio-relationship-stage" />,
}))

vi.mock('@/components/studio/stages/StudioSystemStage', () => ({
  StudioSystemStage: () => <div data-testid="studio-system-stage" />,
}))

vi.mock('@/components/studio/stages/ContinuationResultsStage', () => ({
  ContinuationResultsStage: () => <div data-testid="continuation-results-stage" />,
}))

vi.mock('@/components/novel-copilot/NovelCopilotDrawer', () => ({
  NovelCopilotDrawer: () => <div data-testid="novel-copilot-drawer" />,
}))

vi.mock('@/hooks/novel/useUpdateChapter', () => ({
  useUpdateChapter: (...args: unknown[]) => mockUseUpdateChapter(...args),
}))

vi.mock('@/hooks/novel/useCreateChapter', () => ({
  useCreateChapter: (...args: unknown[]) => mockUseCreateChapter(...args),
}))

vi.mock('@/hooks/novel/useDeleteChapter', () => ({
  useDeleteChapter: (...args: unknown[]) => mockUseDeleteChapter(...args),
}))

vi.mock('@/hooks/world/useEntities', () => ({
  useWorldEntities: (...args: unknown[]) => mockUseWorldEntities(...args),
}))

vi.mock('@/hooks/world/useSystems', () => ({
  useWorldSystems: (...args: unknown[]) => mockUseWorldSystems(...args),
}))

vi.mock('@/hooks/world/useBootstrap', () => ({
  useBootstrapStatus: (...args: unknown[]) => mockUseBootstrapStatus(...args),
  useTriggerBootstrap: (...args: unknown[]) => mockUseTriggerBootstrap(...args),
}))

vi.mock('@/hooks/useDebouncedAutoSave', () => ({
  useDebouncedAutoSave: (...args: unknown[]) => mockUseDebouncedAutoSave(...args),
}))

vi.mock('@/hooks/novel/useContinuationSetupState', () => ({
  useContinuationSetupState: (...args: unknown[]) => mockUseContinuationSetupState(...args),
}))

vi.mock('@/lib/generationResultsDebugStorage', () => ({
  readGenerationResultsDebug: (...args: unknown[]) => mockReadGenerationResultsDebug(...args),
}))

vi.mock('@/services/api', () => ({
  api: {
    getNovel: vi.fn(),
    listChaptersMeta: vi.fn(),
    getChapter: vi.fn(),
    listChapters: vi.fn(),
  },
  ApiError: class ApiError extends Error {
    code?: string
  },
}))

import { api } from '@/services/api'

const mockGetNovel = api.getNovel as ReturnType<typeof vi.fn>
const mockListChaptersMeta = api.listChaptersMeta as ReturnType<typeof vi.fn>
const mockGetChapter = api.getChapter as ReturnType<typeof vi.fn>

function LocationProbe() {
  const location = useLocation()
  return (
    <>
      <div data-testid="location-path">{location.pathname}</div>
      <div data-testid="location-search">{location.search}</div>
    </>
  )
}

describe('NovelStudioPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockUseUpdateChapter.mockReturnValue({
      mutate: vi.fn(),
      mutateAsync: vi.fn().mockResolvedValue(undefined),
    })
    mockUseCreateChapter.mockReturnValue({
      isPending: false,
      mutate: vi.fn(),
    })
    mockUseDeleteChapter.mockReturnValue({
      mutate: vi.fn(),
    })
    mockUseWorldEntities.mockReturnValue({
      data: [{ id: 1, name: '主角' }],
      isLoading: false,
    })
    mockUseWorldSystems.mockReturnValue({
      data: [],
      isLoading: false,
    })
    mockUseBootstrapStatus.mockReturnValue({
      data: null,
      isLoading: false,
    })
    mockUseTriggerBootstrap.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    })
    mockUseDebouncedAutoSave.mockReturnValue({
      status: 'idle',
      schedule: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      saveNow: vi.fn().mockResolvedValue(undefined),
      cancel: vi.fn(),
    })
    mockUseContinuationSetupState.mockReturnValue({
      instruction: '',
      setInstruction: vi.fn(),
      selectedLength: 'medium',
      setSelectedLength: vi.fn(),
      advancedOpen: false,
      setAdvancedOpen: vi.fn(),
      contextChapters: 3,
      setContextChapters: vi.fn(),
      numVersions: 2,
      setNumVersions: vi.fn(),
      temperature: 0.7,
      setTemperature: vi.fn(),
      handleGenerate: vi.fn(),
    })

    mockGetNovel.mockResolvedValue({
      id: 7,
      title: '测试小说',
      created_at: '2026-03-01T00:00:00Z',
    })
    mockListChaptersMeta.mockResolvedValue([
      {
        id: 11,
        novel_id: 7,
        chapter_number: 1,
        title: '第一章',
        created_at: '2026-03-01T00:00:00Z',
      },
      {
        id: 13,
        novel_id: 7,
        chapter_number: 3,
        title: '第三章',
        created_at: '2026-03-03T00:00:00Z',
      },
    ])
    mockGetChapter.mockImplementation(async (_novelId: number, chapterNum: number) => ({
      id: chapterNum,
      novel_id: 7,
      chapter_number: chapterNum,
      title: chapterNum === 3 ? '第三章' : '第一章',
      content: chapterNum === 3 ? '第三章内容' : '第一章内容',
      created_at: '2026-03-03T00:00:00Z',
      updated_at: null,
    }))
    mockReadGenerationResultsDebug.mockReturnValue(null)
  })

  it('uses the requested chapter from the studio URL instead of falling back to chapter one', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('第三章内容')).toBeInTheDocument()
    })

    expect(screen.getAllByText('第 3 章').length).toBeGreaterThan(0)
    expect(screen.queryByText('第一章内容')).not.toBeInTheDocument()
    expect(mockGetChapter).toHaveBeenCalledWith(7, 3)
  })

  it('renders the in-shell entity inspection stage when the studio route requests an entity target', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?stage=entity&entity=1&chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('studio-entity-stage')).toBeInTheDocument()
    })
  })

  it('renders the in-shell review stage when the studio route requests review mode', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?stage=review&reviewKind=relationships&chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('studio-review-stage')).toBeInTheDocument()
    })
  })

  it('renders the in-shell relationship stage when the studio route requests relationship mode', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?stage=relationship&entity=1&chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('studio-relationship-stage')).toBeInTheDocument()
    })
  })

  it('renders the in-shell system stage when the studio route requests system mode', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?stage=system&system=1&chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('studio-system-stage')).toBeInTheDocument()
    })
  })

  it('renders the in-shell results stage from the studio host route', async () => {
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?stage=results&chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('continuation-results-stage')).toBeInTheDocument()
    })
  })

  it('keeps the injection summary rail visible during results-derived studio inspection', async () => {
    mockReadGenerationResultsDebug.mockReturnValue({
      context_chapters: 3,
      injected_entities: ['主角'],
      injected_relationships: [],
      injected_systems: [],
      relevant_entity_ids: [1],
      ambiguous_keywords_disabled: [],
      postcheck_warnings: [],
    })

    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?stage=entity&entity=1&chapter=3&resultsChapter=3&resultsContinuations=0:101&resultsTotalVariants=1&artifactPanel=injection_summary&summaryCategory=entities']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route path="/novel/:novelId" element={<NovelStudioPage />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByTestId('studio-entity-stage')).toBeInTheDocument()
    })

    expect(screen.getByTestId('injection-summary-panel')).toBeInTheDocument()
    expect(screen.queryByTestId('studio-assistant')).not.toBeInTheDocument()
  })

  it('waits for chapter save success before navigating from studio to atlas', async () => {
    let resolveSave: (() => void) | null = null
    const saveNow = vi.fn().mockImplementation(() => new Promise<void>((resolve) => {
      resolveSave = resolve
    }))
    mockUseDebouncedAutoSave.mockReturnValue({
      status: 'unsaved',
      schedule: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      saveNow,
      cancel: vi.fn(),
    })

    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route
                path="/novel/:novelId"
                element={(
                  <>
                    <NovelStudioPage />
                    <LocationProbe />
                  </>
                )}
              />
              <Route path="/world/:novelId" element={<LocationProbe />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('第三章内容')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    expect(screen.getByTestId('chapter-editor')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Atlas 世界模型/ }))

    expect(saveNow).toHaveBeenCalledWith('第三章内容')
    expect(screen.getByTestId('location-path')).toHaveTextContent('/novel/7')
    expect(screen.getByTestId('location-search')).toHaveTextContent('chapter=3')

    resolveSave?.()

    await waitFor(() => {
      expect(screen.getByTestId('location-path')).toHaveTextContent('/world/7')
    })
    expect(screen.getByTestId('location-search')).toHaveTextContent('originStage=chapter')
    expect(screen.getByTestId('location-search')).toHaveTextContent('originChapter=3')
  })

  it('stays in studio when chapter save fails before atlas navigation', async () => {
    const saveNow = vi.fn().mockRejectedValue(new Error('save failed'))
    mockUseDebouncedAutoSave.mockReturnValue({
      status: 'unsaved',
      schedule: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
      saveNow,
      cancel: vi.fn(),
    })

    const user = userEvent.setup()
    const queryClient = createTestQueryClient()

    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/novel/7?chapter=3']}>
          <Routes>
            <Route element={<NovelShell />}>
              <Route
                path="/novel/:novelId"
                element={(
                  <>
                    <NovelStudioPage />
                    <LocationProbe />
                  </>
                )}
              />
              <Route path="/world/:novelId" element={<LocationProbe />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>,
    )

    await waitFor(() => {
      expect(screen.getByText('第三章内容')).toBeInTheDocument()
    })

    await user.click(screen.getByRole('button', { name: '编辑' }))
    await user.click(screen.getByRole('button', { name: /Atlas 世界模型/ }))

    await waitFor(() => {
      expect(saveNow).toHaveBeenCalledWith('第三章内容')
    })
    expect(screen.getByTestId('location-path')).toHaveTextContent('/novel/7')
    expect(screen.getByTestId('location-search')).toHaveTextContent('chapter=3')
    expect(screen.getByTestId('chapter-editor')).toBeInTheDocument()
  })
})
