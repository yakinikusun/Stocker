import { useState, useMemo } from 'react';
import { Product, FilterStockStatus } from '../types/stock';

export function useStockFilter(products: Product[]) {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<FilterStockStatus>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [selectedTagFilters, setSelectedTagFilters] = useState<string[]>([]);

  const toggleTagFilter = (tagName: string) => {
    if (selectedTagFilters.includes(tagName)) {
      setSelectedTagFilters(selectedTagFilters.filter((t) => t !== tagName));
    } else {
      setSelectedTagFilters([...selectedTagFilters, tagName]);
    }
  };

  const clearTagFilters = () => {
    setSelectedTagFilters([]);
  };

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // 1. Search Term (name, jan_code, location, tags)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = product.name.toLowerCase().includes(query);
        const matchesJan = product.jan_code.toLowerCase().includes(query);
        const matchesLocation = product.location.toLowerCase().includes(query);
        const matchesTags = product.tags.some((t) => t.toLowerCase().includes(query));

        if (!matchesName && !matchesJan && !matchesLocation && !matchesTags) {
          return false;
        }
      }

      // 2. Binary Stock Status Filter (In Stock >0 vs Out of Stock ===0)
      if (statusFilter === 'in_stock' && product.current_stock <= 0) {
        return false;
      }
      if (statusFilter === 'out_of_stock' && product.current_stock > 0) {
        return false;
      }

      // 3. Storage Location Filter
      if (locationFilter !== 'all' && product.location !== locationFilter) {
        return false;
      }

      // 4. Multi-tag Filter (match if product contains ALL or ANY selected tags)
      if (selectedTagFilters.length > 0) {
        const hasAllTags = selectedTagFilters.every((tag) => product.tags.includes(tag));
        if (!hasAllTags) {
          return false;
        }
      }

      return true;
    });
  }, [products, searchTerm, statusFilter, locationFilter, selectedTagFilters]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setLocationFilter('all');
    setSelectedTagFilters([]);
  };

  return {
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    locationFilter,
    setLocationFilter,
    selectedTagFilters,
    setSelectedTagFilters,
    toggleTagFilter,
    clearTagFilters,
    filteredProducts,
    clearFilters
  };
}
