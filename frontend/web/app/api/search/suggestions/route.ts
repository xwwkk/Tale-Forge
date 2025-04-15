import { NextResponse } from 'next/server';
import type { SearchSuggestion } from '@/types/search';

// 模拟数据库查询延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// 模拟数据
const mockSuggestions: SearchSuggestion[] = [
  {
    id: '1',
    title: '修真世界',
    type: 'story',
    matchedText: '修真世界',
  },
  {
    id: '2',
    title: '修仙之路',
    type: 'story',
    matchedText: '修仙之路',
  },
  {
    id: '3',
    title: '方寸光',
    type: 'author',
    matchedText: '方寸光',
  },
  {
    id: '4',
    title: '修真',
    type: 'tag',
    matchedText: '修真',
  },
  {
    id: '5',
    title: '都市之巅',
    type: 'story',
    matchedText: '都市之巅',
  },
  {
    id: '6',
    title: '青云客',
    type: 'author',
    matchedText: '青云客',
  },
  // 添加更多模拟数据...
];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get('keyword') || '';

  try {
    // 模拟API延迟
    await delay(300);

    if (!keyword) {
      return NextResponse.json([]);
    }

    // 过滤建议
    const suggestions = mockSuggestions.filter((item) =>
      item.title.toLowerCase().includes(keyword.toLowerCase())
    );

    // 限制返回数量
    return NextResponse.json(suggestions.slice(0, 5));
  } catch (error) {
    console.error('Suggestions error:', error);
    return NextResponse.json(
      { error: '获取搜索建议失败' },
      { status: 500 }
    );
  }
} 