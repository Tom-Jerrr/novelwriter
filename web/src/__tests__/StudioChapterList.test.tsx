import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StudioChapterList } from '@/components/studio/rail/StudioChapterList'

describe('StudioChapterList', () => {
  const chapters = [
    { chapterNumber: 1, label: '第 1 章' },
    { chapterNumber: 2, label: '第 2 章' },
  ]

  it('hides the create button when no create handler is available', () => {
    render(
      <StudioChapterList
        chapters={chapters}
        selectedChapterNumber={1}
        onSelectChapter={vi.fn()}
        chapterCount={chapters.length}
        activeStage="results"
      />,
    )

    expect(screen.queryByTitle('新建章节')).not.toBeInTheDocument()
  })

  it('renders the create button and chapter selection handler when creation is supported', async () => {
    const user = userEvent.setup()
    const handleSelectChapter = vi.fn()
    const handleCreateChapter = vi.fn()

    render(
      <StudioChapterList
        chapters={chapters}
        selectedChapterNumber={1}
        onSelectChapter={handleSelectChapter}
        chapterCount={chapters.length}
        onCreateChapter={handleCreateChapter}
        isCreating={false}
        activeStage="chapter"
      />,
    )

    await user.click(screen.getByRole('button', { name: '第 2 章' }))
    await user.click(screen.getByTitle('新建章节'))

    expect(handleSelectChapter).toHaveBeenCalledWith(2)
    expect(handleCreateChapter).toHaveBeenCalledTimes(1)
  })
})
