import React from 'react';
import { SearchResult } from '@/types/search';
import Image from 'next/image';
import Link from 'next/link';
import { BookOpenIcon, StarIcon, UserIcon, ClockIcon } from '@heroicons/react/24/outline';

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  error?: string;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  results,
  isLoading,
  error,
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 animate-pulse"
          >
            <div className="w-full h-48 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="flex gap-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">暂无搜索结果</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {results.map((result) => (
        <Link
          href={`/story/${result.id}`}
          key={result.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow duration-200"
        >
          <div className="relative aspect-[3/4] w-full">
            <Image
              src={result.cover}
              alt={result.title}
              fill
              className="object-cover rounded-t-lg"
            />
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
              <h3 className="text-white font-medium text-lg line-clamp-2">
                {result.title}
              </h3>
            </div>
          </div>

          <div className="p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
              <UserIcon className="w-4 h-4" />
              <span>{result.author}</span>
              <div className="flex items-center gap-1 ml-auto">
                <StarIcon className="w-4 h-4 text-yellow-400" />
                <span>{result.rating.toFixed(1)}</span>
              </div>
            </div>

            <p className="text-sm text-gray-500 line-clamp-2 mb-3">
              {result.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {result.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <BookOpenIcon className="w-4 h-4" />
                <span>{(result.wordCount / 10000).toFixed(1)}万字</span>
              </div>
              <div className="flex items-center gap-1">
                <ClockIcon className="w-4 h-4" />
                <span>{result.updateTime}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-3">
              <span
                className={`px-2 py-1 text-xs rounded-full ${
                  result.status === 'ongoing'
                    ? 'bg-green-100 text-green-600'
                    : result.status === 'completed'
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {result.status === 'ongoing'
                  ? '连载中'
                  : result.status === 'completed'
                  ? '已完结'
                  : '暂停更新'}
              </span>
              <span className="px-2 py-1 text-xs bg-purple-100 text-purple-600 rounded-full">
                {result.category}
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}; 