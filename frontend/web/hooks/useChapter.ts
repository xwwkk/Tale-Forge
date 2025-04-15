import { useState, useEffect } from 'react'
import type { Chapter } from '@/types/story'

//这些钩子都没怎么用，不需要。先放着，以后考虑
// 获取章节详情
const fetchChapter = async (storyId: string, chapterIdOrOrder: string): Promise<Chapter> => {
  try {
    // 判断是章节ID还是order
    const isOrder = !isNaN(Number(chapterIdOrOrder));
    const url = isOrder 
      ? `/api/stories/${storyId}/chapters/order/${chapterIdOrOrder}`
      : `/api/stories/${storyId}/chapters/${chapterIdOrOrder}`;
      
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Failed to fetch chapter');
    }
    
    // 检查响应内容长度
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      console.log('服务器返回了空响应体，可能是章节不存在');
      // 返回一个空章节对象
      return {
        id: chapterIdOrOrder,
        title: '',
        content: '',
        order: Number(chapterIdOrOrder),
        wordCount: 0,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Chapter;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chapter:', error);
    throw error;
  }
}

// 保存章节草稿
const saveChapterDraft = async (storyId: string, chapterId: string, data: Partial<Chapter>): Promise<Chapter> => {
  try {
    const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save chapter draft');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error saving chapter draft:', error);
    throw error;
  }
}

// 创建新章节
const createChapter = async (storyId: string, data: Partial<Chapter>): Promise<Chapter> => {
  try {
    const response = await fetch(`/api/stories/${storyId}/chapters`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create chapter');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating chapter:', error);
    throw error;
  }
}

// 发布章节
const publishChapter = async (storyId: string, chapterId: string, authorAddress: string): Promise<Chapter> => {
  try {
    const response = await fetch(`/api/stories/${storyId}/chapters/${chapterId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ authorAddress }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to publish chapter');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error publishing chapter:', error);
    throw error;
  }
}

// 获取章节列表
const fetchChapterList = async (storyId: string): Promise<Chapter[]> => {
  try {
    const response = await fetch(`/api/stories/${storyId}/chapters`);
    if (!response.ok) {
      throw new Error('Failed to fetch chapter list');
    }
    
    // 检查响应内容长度
    const contentLength = response.headers.get('content-length');
    if (contentLength === '0') {
      console.log('服务器返回了空响应体，可能是没有章节');
      // 返回空数组
      return [];
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching chapter list:', error);
    throw error;
  }
}

// 章节详情钩子
export function useChapter(storyId: string, chapterId: string) {
  const [chapter, setChapter] = useState<Chapter | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    const loadChapter = async () => {
      if (!chapterId) return;
      
      try {
        setLoading(true)
        setError(null)
        const data = await fetchChapter(storyId, chapterId)
        if (mounted) {
          setChapter(data)
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load chapter'))
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadChapter()

    return () => {
      mounted = false
    }
  }, [storyId, chapterId])

  // 保存章节草稿
  const saveChapter = async (data: Partial<Chapter>) => {
    if (!chapterId) return null;
    
    try {
      setLoading(true);
      const updatedChapter = await saveChapterDraft(storyId, chapterId, data);
      setChapter(updatedChapter);
      return updatedChapter;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to save chapter'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  // 发布章节
  const publish = async (authorAddress: string) => {
    if (!chapterId) return null;
    
    try {
      setLoading(true);
      const publishedChapter = await publishChapter(storyId, chapterId, authorAddress);
      setChapter(publishedChapter);
      return publishedChapter;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to publish chapter'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    chapter, 
    loading, 
    error, 
    saveChapter,
    publish
  }
}

// 章节列表钩子
export function useChapterList(storyId: string) {
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const loadChapters = async () => {
    if (!storyId) return;
    
    try {
      setLoading(true)
      setError(null)
      const data = await fetchChapterList(storyId)
      setChapters(data)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load chapters'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadChapters()
  }, [storyId])

  // 创建新章节
  const createNewChapter = async (data: Partial<Chapter>) => {
    if (!storyId) return null;
    
    try {
      setLoading(true);
      const newChapter = await createChapter(storyId, data);
      setChapters(prev => [...prev, newChapter]);
      return newChapter;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create chapter'));
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { 
    chapters, 
    loading, 
    error, 
    refreshChapters: loadChapters,
    createNewChapter
  }
} 