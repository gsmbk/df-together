import { emptyFilters } from '../data/catalog';
import { createStore } from './store';
import type { CatalogFilters, FilterKey } from '../types';

/**
 * Browse filters live outside the screen so the Filters sheet (a separate
 * route) can edit them without passing callbacks through navigation params.
 */
export const filtersStore = createStore<CatalogFilters>(emptyFilters());

export const useFilters = filtersStore.use;

export function setFilters(next: CatalogFilters) {
  filtersStore.set(next);
}

export function resetFilters() {
  filtersStore.set(emptyFilters());
}

export function toggleFilterValue(key: FilterKey, value: string) {
  filtersStore.set((current) => ({
    ...current,
    [key]: current[key].includes(value)
      ? current[key].filter((item) => item !== value)
      : [...current[key], value],
  }));
}

export function setFilterValues(key: FilterKey, values: string[]) {
  filtersStore.set((current) => ({ ...current, [key]: values }));
}
