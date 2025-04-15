import { NextResponse } from 'next/server';
import type { SearchFilters, SearchResult } from '@/types/search';

// 模拟数据库查询延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟数据
const mockResults: SearchResult[] = [
  {
    id: '1',
    title: '修真世界',
    author: '方寸光',
    description: '一个平凡少年偶获上古传承，踏上修真之路的故事。在这个充满危机与机遇的世界里，他将如何成长？',
    cover: '/images/covers/1.jpg',
    wordCount: 1500000,
    status: 'ongoing',
    tags: ['修真', '热血', '机缘'],
    category: '修真',
    rating: 4.5,
    updateTime: '2024-02-01',
    viewCount: 100000,
    genre: ['热血', '机缘'],
  },
  {
    id: '2',
    title: '都市之巅',
    author: '青云客',
    description: '都市之中，商场如战场。一个年轻人的奋斗史，演绎着现代都市的传奇故事。',
    cover: '/images/covers/2.jpg',
    wordCount: 2000000,
    status: 'completed',
    tags: ['都市', '商战', '恋爱'],
    category: '都市',
    rating: 4.8,
    updateTime: '2024-01-30',
    viewCount: 150000,
    genre: ['轻松', '都市'],
  },
  // 添加更多模拟数据...
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';
  const filters: SearchFilters = {
    category: searchParams.get('category') || undefined,
    status: searchParams.get('status') as any || undefined,
    sortBy: searchParams.get('sortBy') as any || undefined,
    updateTime: searchParams.get('updateTime') as any || undefined,
    minWords: Number(searchParams.get('minWords')) || undefined,
    maxWords: Number(searchParams.get('maxWords')) || undefined,
  };

  try {
    // 模拟API延迟
    await delay(500);

    // 过滤结果
    let results = [...mockResults];

    // 关键词搜索
    if (keyword) {
      results = results.filter(
        (item) =>
          item.title.toLowerCase().includes(keyword.toLowerCase()) ||
          item.author.toLowerCase().includes(keyword.toLowerCase()) ||
          item.description.toLowerCase().includes(keyword.toLowerCase()) ||
          item.tags.some((tag) => tag.toLowerCase().includes(keyword.toLowerCase()))
      );
    }

    // 应用筛选条件
    if (filters.category) {
      results = results.filter((item) => item.category === filters.category);
    }

    if (filters.status) {
      results = results.filter((item) => item.status === filters.status);
    }

    if (filters.minWords) {
      results = results.filter((item) => item.wordCount >= filters.minWords!);
    }

    if (filters.maxWords) {
      results = results.filter((item) => item.wordCount <= filters.maxWords!);
    }

    // 排序
    if (filters.sortBy) {
      results.sort((a, b) => {
        switch (filters.sortBy) {
          case 'latest':
            return new Date(b.updateTime).getTime() - new Date(a.updateTime).getTime();
          case 'popular':
            return b.viewCount - a.viewCount;
          case 'rating':
            return b.rating - a.rating;
          default:
            return 0;
        }
      });
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: '搜索失败，请稍后重试' },
      { status: 500 }
    );
  }
} 