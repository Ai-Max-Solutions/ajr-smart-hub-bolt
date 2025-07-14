import { useState, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

export interface VirtualizedTableProps<T> {
  data: T[];
  pageSize: number;
  searchQuery?: string;
  searchFields?: (keyof T)[];
  sortField?: keyof T;
  sortDirection?: 'asc' | 'desc';
}

export const useVirtualizedTable = <T extends Record<string, any>>({
  data,
  pageSize = 50,
  searchQuery = '',
  searchFields = [],
  sortField,
  sortDirection = 'asc'
}: VirtualizedTableProps<T>) => {
  const [containerRef, setContainerRef] = useState<HTMLDivElement | null>(null);

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery || searchFields.length === 0) return data;
    
    return data.filter(item =>
      searchFields.some(field => {
        const value = item[field];
        return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
      })
    );
  }, [data, searchQuery, searchFields]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortField) return filteredData;
    
    return [...filteredData].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue > bValue ? 1 : -1;
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [filteredData, sortField, sortDirection]);

  // Virtualize the data
  const virtualizer = useVirtualizer({
    count: sortedData.length,
    getScrollElement: () => containerRef,
    estimateSize: () => 60, // Estimated row height
    paddingStart: 0,
    paddingEnd: 0,
  });

  const virtualItems = virtualizer.getVirtualItems();

  const getItemData = useCallback((index: number) => {
    return sortedData[index];
  }, [sortedData]);

  return {
    containerRef: setContainerRef,
    virtualItems,
    totalSize: virtualizer.getTotalSize(),
    totalCount: sortedData.length,
    getItemData,
    scrollToIndex: virtualizer.scrollToIndex,
  };
};