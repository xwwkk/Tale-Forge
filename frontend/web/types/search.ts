export interface SearchFilters {
  category?: string;
  tags?: string[];
  status?: 'ongoing' | 'completed' | 'hiatus';
  sortBy?: 'latest' | 'popular' | 'rating';
  minWords?: number;
  maxWords?: number;
  genre?: string[];
  updateTime?: 'today' | 'week' | 'month' | 'year';
}

export interface SearchResult {
  id: string;
  title: string;
  author: string;
  description: string;
  coverCid: string;
  wordCount: number;
  status: 'ongoing' | 'completed' | 'hiatus';
  tags: string[];
  category: string;
  rating: number;
  updateTime: string;
  viewCount: number;
  genre: string[];
}

export interface SearchSuggestion {
  id: string;
  title: string;
  type: 'story' | 'author' | 'tag';
  matchedText: string;
}

export interface SearchHistory {
  id: string;
  keyword: string;
  timestamp: number;
  type: 'search' | 'filter';
  filters?: SearchFilters;
} 