import React, { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';
import { SearchSuggestion, SearchHistory } from '@/types/search';
import { MagnifyingGlassIcon, XMarkIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SearchBarProps {
  onSearch: (keyword: string) => void;
  onSuggestionSelect: (suggestion: SearchSuggestion) => void;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  onSuggestionSelect,
  className = '',
}) => {
  const [keyword, setKeyword] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [history, setHistory] = useState<SearchHistory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const debouncedKeyword = useDebounce(keyword, 300);

  // 处理搜索建议
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!debouncedKeyword) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        // TODO: 实现API调用获取搜索建议
        const response = await fetch(`/api/search/suggestions?keyword=${debouncedKeyword}`);
        const data = await response.json();
        setSuggestions(data);
      } catch (error) {
        console.error('Failed to fetch suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedKeyword]);

  // 处理搜索历史
  useEffect(() => {
    const loadHistory = () => {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    };

    loadHistory();
  }, []);

  // 保存搜索历史
  const saveToHistory = (keyword: string) => {
    const newHistory: SearchHistory = {
      id: Date.now().toString(),
      keyword,
      timestamp: Date.now(),
      type: 'search'
    };

    const updatedHistory = [newHistory, ...history.slice(0, 9)];
    setHistory(updatedHistory);
    localStorage.setItem('searchHistory', JSON.stringify(updatedHistory));
  };

  // 清除搜索历史
  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // 处理搜索提交
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSearch(keyword.trim());
      saveToHistory(keyword.trim());
      setIsFocused(false);
    }
  };

  // 处理建议选择
  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    onSuggestionSelect(suggestion);
    setKeyword(suggestion.title);
    setIsFocused(false);
    saveToHistory(suggestion.title);
  };

  // 处理历史记录选择
  const handleHistoryClick = (historyItem: SearchHistory) => {
    setKeyword(historyItem.keyword);
    onSearch(historyItem.keyword);
    setIsFocused(false);
  };

  // 处理点击外部关闭
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={handleSubmit} className="relative">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder="搜索作品、作者或标签..."
          className="w-full px-4 py-2 pl-10 pr-4 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
        {keyword && (
          <button
            type="button"
            onClick={() => setKeyword('')}
            className="absolute right-3 top-2.5"
          >
            <XMarkIcon className="h-5 w-5 text-gray-400" />
          </button>
        )}
      </form>

      {isFocused && (keyword || history.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200">
          {isLoading && (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin h-5 w-5 mx-auto border-2 border-blue-500 rounded-full border-t-transparent"></div>
            </div>
          )}

          {!isLoading && keyword && suggestions.length > 0 && (
            <ul className="py-2">
              {suggestions.map((suggestion) => (
                <li
                  key={suggestion.id}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                >
                  <div className="flex items-center">
                    <MagnifyingGlassIcon className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="flex-1">{suggestion.title}</span>
                    <span className="text-sm text-gray-400">{suggestion.type}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {!keyword && history.length > 0 && (
            <div>
              <div className="flex items-center justify-between px-4 py-2 border-b">
                <span className="text-sm text-gray-500">搜索历史</span>
                <button
                  onClick={clearHistory}
                  className="text-sm text-blue-500 hover:text-blue-600"
                >
                  清除
                </button>
              </div>
              <ul className="py-2">
                {history.map((item) => (
                  <li
                    key={item.id}
                    onClick={() => handleHistoryClick(item)}
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                  >
                    <div className="flex items-center">
                      <ClockIcon className="h-4 w-4 text-gray-400 mr-2" />
                      <span>{item.keyword}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoading && keyword && suggestions.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              未找到相关结果
            </div>
          )}
        </div>
      )}
    </div>
  );
}; 