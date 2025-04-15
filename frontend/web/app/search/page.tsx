'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterPanel } from '@/components/search/FilterPanel';
import { SearchResults } from '@/components/search/SearchResults';
import { SearchFilters, SearchResult, SearchSuggestion } from '@/types/search';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const [keyword, setKeyword] = useState(searchParams.get('q') || '');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理搜索
  const handleSearch = async (searchKeyword: string) => {
    setKeyword(searchKeyword);
    setIsLoading(true);
    setError(null);

    try {
      // TODO: 实现API调用
      const response = await fetch(
        `/api/search?keyword=${encodeURIComponent(searchKeyword)}&${new URLSearchParams(
          filters as any
        ).toString()}`
      );
      
      if (!response.ok) {
        throw new Error('搜索失败，请稍后重试');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '搜索失败，请稍后重试');
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 处理筛选条件变化
  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    if (keyword) {
      handleSearch(keyword);
    }
  };

  // 处理搜索建议选择
  const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
    handleSearch(suggestion.title);
  };

  // 初始加载
  useEffect(() => {
    if (keyword) {
      handleSearch(keyword);
    }
  }, []);

  return (
    <main className="min-h-screen pt-[118px]">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mx-auto mb-8">
            <SearchBar
              onSearch={handleSearch}
              onSuggestionSelect={handleSuggestionSelect}
              className="mb-6"
            />
            <FilterPanel filters={filters} onFilterChange={handleFilterChange} />
          </div>

          {keyword && (
            <div className="mb-6">
              <h2 className="text-xl font-medium mb-2">
                搜索 "{keyword}" 的结果
                {!isLoading && !error && (
                  <span className="text-gray-500 text-base ml-2">
                    共 {results.length} 个结果
                  </span>
                )}
              </h2>
            </div>
          )}

          <SearchResults
            results={results}
            isLoading={isLoading}
            error={error || undefined}
          />
        </div>
      </div>
    </main>
  );
} 