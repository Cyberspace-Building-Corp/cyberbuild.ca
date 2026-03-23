// ============================================
// CYBERBUILD.CA — Search Engine
// Builds index from service data, performs fuzzy matching
// ============================================

import type { ServiceMap, ServiceKey, SearchResult } from './types';

export function buildSearchIndex(services: ServiceMap): SearchResult[] {
  const index: SearchResult[] = [];

  (Object.entries(services) as [ServiceKey, typeof services[ServiceKey]][]).forEach(([key, svc]) => {
    index.push({
      key,
      type: 'desc',
      text: svc.description,
      category: svc.label,
      color: svc.iconColor,
    });
    index.push({
      key,
      type: 'detail',
      text: svc.detail,
      category: svc.label,
      color: svc.iconColor,
    });
    svc.tech.forEach((t) => {
      index.push({
        key,
        type: 'tech',
        text: t,
        category: svc.label,
        color: svc.iconColor,
      });
    });
  });

  return index;
}

export function searchServices(
  index: SearchResult[],
  query: string
): Map<ServiceKey, SearchResult[]> {
  if (!query || query.length < 2) return new Map();

  const q = query.toLowerCase();
  const matches = index.filter((item) => item.text.toLowerCase().includes(q));

  const grouped = new Map<ServiceKey, SearchResult[]>();
  matches.forEach((m) => {
    const existing = grouped.get(m.key) || [];
    existing.push(m);
    grouped.set(m.key, existing);
  });

  return grouped;
}

export function highlightMatch(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    text.slice(0, idx) +
    '<mark>' +
    text.slice(idx, idx + query.length) +
    '</mark>' +
    text.slice(idx + query.length)
  );
}
