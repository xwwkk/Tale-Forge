import React, { useState } from 'react';
import { SearchFilters } from '@/types/search';
import { Switch } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface FilterPanelProps {
  filters: SearchFilters;
  onFilterChange: (filters: SearchFilters) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  onFilterChange,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // 预设的筛选选项
  const categories = ['玄幻', '修真', '都市', '历史', '科幻', '游戏', '其他'];
  const genres = ['轻松', '热血', '爽文', '虐心', '推理', '恐怖', '其他'];
  const statuses = [
    { value: 'ongoing', label: '连载中' },
    { value: 'completed', label: '已完结' },
    { value: 'hiatus', label: '暂停更新' },
  ];
  const sortOptions = [
    { value: 'latest', label: '最新发布' },
    { value: 'popular', label: '最受欢迎' },
    { value: 'rating', label: '评分最高' },
  ];
  const updateTimeOptions = [
    { value: 'today', label: '今天' },
    { value: 'week', label: '本周' },
    { value: 'month', label: '本月' },
    { value: 'year', label: '今年' },
  ];

  // 处理筛选变化
  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFilterChange(newFilters);
  };

  // 处理多选筛选变化
  const handleMultiSelect = (key: keyof SearchFilters, value: string) => {
    const currentValues = filters[key] as string[] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((v) => v !== value)
      : [...currentValues, value];
    handleFilterChange(key, newValues);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-medium">筛选条件</h3>
        <ChevronDownIcon
          className={`w-5 h-5 transition-transform ${
            isExpanded ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {isExpanded && (
        <div className="p-4 border-t border-gray-200">
          {/* 分类筛选 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">作品分类</h4>
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => handleFilterChange('category', category)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.category === category
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 标签筛选 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">作品风格</h4>
            <div className="flex flex-wrap gap-2">
              {genres.map((genre) => (
                <button
                  key={genre}
                  onClick={() => handleMultiSelect('genre', genre)}
                  className={`px-3 py-1 rounded-full text-sm ${
                    filters.genre?.includes(genre)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
          </div>

          {/* 状态筛选 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">作品状态</h4>
            <div className="flex gap-4">
              {statuses.map((status) => (
                <label key={status.value} className="flex items-center">
                  <input
                    type="radio"
                    name="status"
                    checked={filters.status === status.value}
                    onChange={() => handleFilterChange('status', status.value)}
                    className="w-4 h-4 text-blue-500 border-gray-300 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    {status.label}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* 排序方式 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">排序方式</h4>
            <select
              value={filters.sortBy || 'latest'}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 更新时间 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">更新时间</h4>
            <select
              value={filters.updateTime || ''}
              onChange={(e) =>
                handleFilterChange(
                  'updateTime',
                  e.target.value || undefined
                )
              }
              className="w-full p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">全部时间</option>
              {updateTimeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 字数范围 */}
          <div className="mb-6">
            <h4 className="text-sm font-medium mb-2">字数范围</h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={filters.minWords || ''}
                onChange={(e) =>
                  handleFilterChange('minWords', parseInt(e.target.value) || undefined)
                }
                placeholder="最小字数"
                className="w-1/2 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-gray-500">-</span>
              <input
                type="number"
                value={filters.maxWords || ''}
                onChange={(e) =>
                  handleFilterChange('maxWords', parseInt(e.target.value) || undefined)
                }
                placeholder="最大字数"
                className="w-1/2 p-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 重置按钮 */}
          <button
            onClick={() => onFilterChange({})}
            className="w-full py-2 text-sm text-blue-500 hover:text-blue-600 focus:outline-none"
          >
            重置所有筛选
          </button>
        </div>
      )}
    </div>
  );
}; 