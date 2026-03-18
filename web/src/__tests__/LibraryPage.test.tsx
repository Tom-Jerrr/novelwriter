import { createElement, type ReactNode } from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LibraryPage } from '@/pages/LibraryPage'

const listNovels = vi.fn()
const uploadNovel = vi.fn()

vi.mock('@/services/api', () => ({
  api: {
    listNovels: (...args: unknown[]) => listNovels(...args),
    uploadNovel: (...args: unknown[]) => uploadNovel(...args),
    deleteNovel: vi.fn(),
  },
}))

vi.mock('@/components/layout/PageShell', () => ({
  PageShell: ({ children }: { children: ReactNode }) => <div>{children}</div>,
}))

vi.mock('@/components/library/WorkCard', () => ({
  WorkCard: () => <div>work-card</div>,
}))

vi.mock('@/components/library/EmptyState', () => ({
  EmptyState: ({ onCreate }: { onCreate: () => void }) => (
    <button type="button" onClick={onCreate}>empty-create</button>
  ),
}))

vi.mock('@/lib/worldOnboardingStorage', () => ({
  clearWorldOnboardingDismissed: vi.fn(),
}))

function renderPage() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    createElement(
      MemoryRouter,
      null,
      createElement(QueryClientProvider, { client }, createElement(LibraryPage)),
    ),
  )
}

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    listNovels.mockResolvedValue([])
    uploadNovel.mockResolvedValue({ novel_id: 1, total_chapters: 2 })
  })

  it('shows create actions without a legal consent gate', async () => {
    renderPage()

    const createButton = await screen.findByTestId('library-create-novel')
    expect(createButton).not.toBeDisabled()
    expect(screen.queryByText('上传前先确认权利边界')).not.toBeInTheDocument()
  })

  it('uploads immediately without a library-side consent step', async () => {
    renderPage()

    const input = screen.getByTestId('library-file-input') as HTMLInputElement
    const file = new File(['hello'], 'test.txt', { type: 'text/plain' })
    await userEvent.upload(input, file)

    await waitFor(() => {
      expect(uploadNovel).toHaveBeenCalledWith(file, 'test')
    })
  })
})
