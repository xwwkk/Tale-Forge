import React from 'react'
import { useRouter } from 'next/navigation'
import { IoChevronDown, IoChevronForward } from 'react-icons/io5'
import styles from './ChapterTree.module.css'

interface Volume {
  id: string
  title: string
  chapters: Chapter[]
}

interface Chapter {
  id: string
  title: string
  wordCount: number
}

interface ChapterTreeProps {
  storyId: string
  volumes: Volume[]
  currentChapterId: string
  onClose?: () => void
}

export default function ChapterTree({ storyId, volumes, currentChapterId, onClose }: ChapterTreeProps) {
  const router = useRouter()
  const [expandedVolumes, setExpandedVolumes] = React.useState<Set<string>>(new Set())

  const toggleVolume = (volumeId: string) => {
    const newExpanded = new Set(expandedVolumes)
    if (newExpanded.has(volumeId)) {
      newExpanded.delete(volumeId)
    } else {
      newExpanded.add(volumeId)
    }
    setExpandedVolumes(newExpanded)
  }

  const handleChapterClick = (chapterId: string) => {
    router.push(`/stories/${storyId}?chapter=${chapterId}`)
    onClose?.()
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>目录</h3>
        {onClose && (
          <button onClick={onClose} className={styles.closeButton}>
            关闭
          </button>
        )}
      </div>
      <div className={styles.content}>
        {volumes.map((volume) => (
          <div key={volume.id} className={styles.volume}>
            <div
              className={styles.volumeHeader}
              onClick={() => toggleVolume(volume.id)}
            >
              {expandedVolumes.has(volume.id) ? (
                <IoChevronDown className={styles.icon} />
              ) : (
                <IoChevronForward className={styles.icon} />
              )}
              <span>{volume.title}</span>
              <span className={styles.chapterCount}>
                {volume.chapters.length}章
              </span>
            </div>
            {expandedVolumes.has(volume.id) && (
              <div className={styles.chapters}>
                {volume.chapters.map((chapter) => (
                  <div
                    key={chapter.id}
                    className={`${styles.chapter} ${
                      chapter.id === currentChapterId ? styles.active : ''
                    }`}
                    onClick={() => handleChapterClick(chapter.id)}
                  >
                    <span className={styles.chapterTitle}>
                      {chapter.title}
                    </span>
                    <span className={styles.wordCount}>
                      {chapter.wordCount}字
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
