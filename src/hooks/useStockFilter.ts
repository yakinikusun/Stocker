import { useState, useMemo } from 'react';
import { Product, FilterStockStatus } from '../types/stock';

export function useStockFilter(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStockStatus>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTagFilter, setSelectedTagFilter] = useState<string>('all');

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Search term match (Name, JAN Code, Location, Tag)
      const query = searchTerm.toLowerCase().trim();
      if (query) {
        const matchesName = p.name.toLowerCase().includes(query);
        const matchesJan = p.jan_code.includes(query);
        const matchesLoc = p.location.toLowerCase().includes(query);
        const matchesTag = p.tags.some((t) => t.toLowerCase().includes(query));

        if (!matchesName && !matchesJan && !matchesLoc && !matchesTag) {
          return false;
        }
      }

      // 2. Storage Location Filter
      if (locationFilter !== 'all' && p.location !== locationFilter) {
        return false;
      }

      // 3. Tag Filter
      if (selectedTagFilter !== 'all' && !p.tags.includes(selectedTagFilter)) {
        return false;
      }

      // 4. Binary Stock Status Filter
      if (statusFilter === 'in_stock' && p.current_stock <= 0) {
        return false;
      }
      if (statusFilter === 'out_of_stock' && p.current_stock !== 0) {
        return false;
      }

      return true;
    });
  }, [products, searchTerm, statusFilter, locationFilter, selectedTagFilter]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
    setSelectedTagFilter('all');
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    selectedTagFilter,
    setSelectedTagFilter,
    filteredProducts,
    clearFilters
  };
}
