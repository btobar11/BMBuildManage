import { useState, useMemo } from 'react';
import { CHILEAN_COSTS, COST_CATEGORIES, DEFAULT_MARKUP_BY_CATEGORY } from '../features/budget/costLibrary';

export function useCostLibrary() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCosts = useMemo(() => {
    let results = CHILEAN_COSTS;

    if (selectedCategory) {
      results = results.filter(c => c.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(c =>
        c.name.toLowerCase().includes(query) ||
        c.description?.toLowerCase().includes(query)
      );
    }

    return results;
  }, [searchQuery, selectedCategory]);

  const getMarkupForCategory = (category: string): number => {
    return DEFAULT_MARKUP_BY_CATEGORY[category] || 20;
  };

  const calculatePriceFromCost = (cost: number, category: string): number => {
    const markup = getMarkupForCategory(category);
    return Math.round(cost * (1 + markup / 100));
  };

  return {
    costs: filteredCosts,
    allCosts: CHILEAN_COSTS,
    categories: COST_CATEGORIES,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    getMarkupForCategory,
    calculatePriceFromCost,
  };
}
