import { useState, useMemo, useEffect } from "react";

export interface FilterItem {
  id: number | string;
  name: string;
  description: string;
  category: string;
  price: number;
  popular?: boolean;
  [key: string]: any;
}

export type SortOption = "recommended" | "price-asc" | "price-desc";
export type PriceRange = "under-10" | "10-20" | "20-plus" | null;
export type FilterTag = "veg" | "spicy" | "popular";

export interface FilterState {
  priceRange: PriceRange;
  tags: FilterTag[];
}

export const useMenuFilter = (
  items: FilterItem[],
  activeCategory: string,
  initialSort: SortOption = "recommended",
) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>(initialSort);
  const [isSearching, setIsSearching] = useState(false);

  // Advanced Filters
  const [filters, setFilters] = useState<FilterState>({
    priceRange: null,
    tags: [],
  });

  // Ticker removed - we rely on global updates or static filter states now.

  // Handle Debouncing
  useEffect(() => {
    // If we clear search, reset immediately
    if (!searchQuery) {
      setDebouncedQuery("");
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combined Filter & Sort Logic
  const filteredItems = useMemo(() => {
    let result = [...items];

    // 0. Category Filter (Top Level)
    // Only apply if NOT searching. If searching, we usually want to search EVERYTHING.
    // However, usually sidebar filters even search.
    // Let's following standard pattern: Category applies FIRST.
    // Exception: If "popular", filter by popular flag.
    if (!debouncedQuery) {
      if (activeCategory === "popular") {
        // INCLUDE: Popular items OR Discounted items (if active)
        result = result.filter((item) => {
          const discount = item.discount_percentage || 0;
          const isTimerActive = item.discount_ends_at
            ? new Date(item.discount_ends_at) > new Date()
            : true;
          return item.popular || (discount > 0 && isTimerActive);
        });

        // SORT: Discounted items first
        if (sortOption === "recommended") {
          result.sort((a, b) => {
            // Helper to get effective discount
            const getDisc = (i: FilterItem) => {
              const isActive = i.discount_ends_at
                ? new Date(i.discount_ends_at) > new Date()
                : true;
              return isActive ? i.discount_percentage || 0 : 0;
            };

            const discountA = getDisc(a);
            const discountB = getDisc(b);
            if (discountA > discountB) return -1;
            if (discountB > discountA) return 1;
            return 0;
          });
        }
      } else {
        result = result.filter((item) => item.category === activeCategory);
      }
    }

    // 1. Text Search
    if (debouncedQuery.trim()) {
      const q = debouncedQuery.toLowerCase().trim();
      result = result.filter((item) => {
        const nameMatch = item.name.toLowerCase().includes(q);
        const descMatch = item.description?.toLowerCase().includes(q);
        const catMatch = item.category.toLowerCase().includes(q);
        // const priceMatch = item.price.toString().startsWith(q); // Optional
        return nameMatch || descMatch || catMatch;
      });
    }

    // 2. Price Range Filter
    if (filters.priceRange) {
      result = result.filter((item) => {
        const p = item.price;
        if (filters.priceRange === "under-10") return p < 10;
        if (filters.priceRange === "10-20") return p >= 10 && p <= 20;
        if (filters.priceRange === "20-plus") return p > 20;
        return true;
      });
    }

    // 3. Tags Filter
    if (filters.tags.length > 0) {
      result = result.filter((item) => {
        const text = (item.name + " " + item.description).toLowerCase();

        const matchesVeg =
          !filters.tags.includes("veg") ||
          ((text.includes("veg") ||
            text.includes("cheese") ||
            text.includes("mushroom") ||
            text.includes("salad")) &&
            !text.includes("beef") &&
            !text.includes("chicken") &&
            !text.includes("pepperoni") &&
            !text.includes("meat"));

        const matchesSpicy =
          !filters.tags.includes("spicy") ||
          text.includes("spicy") ||
          text.includes("jalapeno") ||
          text.includes("chilli") ||
          text.includes("pepper jack");

        const matchesPopular =
          !filters.tags.includes("popular") || !!item.popular;

        return matchesVeg && matchesSpicy && matchesPopular;
      });
    }

    // 4. Sort
    switch (sortOption) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "recommended":
      default:
        break;
    }

    return result;
  }, [items, debouncedQuery, sortOption, filters, activeCategory]);

  return {
    searchQuery,
    setSearchQuery,
    debouncedQuery,
    sortOption,
    setSortOption,
    filters,
    setFilters,
    filteredItems,
    isSearching,
    resetSearch: () => {
      setSearchQuery("");
      setFilters({ priceRange: null, tags: [] });
    },
  };
};
