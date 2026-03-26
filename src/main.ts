// ============================================
// CYBERBUILD.CA — Main Entry Point
// Fixed hero + star field. Scrolling drives
// which service card slides in from the right.
// ============================================

import './styles/main.css';
import type { ServiceMap, ServiceKey } from './lib/types';
import { createStarScene, startStarLoop, handleStarResize } from './lib/scene';
import { buildSearchIndex, searchServices, highlightMatch } from './lib/search';

// --- Read service data from SEO DOM ---
function readServicesFromDOM(): ServiceMap {
  const services: Partial<ServiceMap> = {};
  document.querySelectorAll<HTMLElement>('.seo-content section[data-service]').forEach((section) => {
    const key = section.dataset.service as ServiceKey;
    if (key === 'contact' as any) return;
    const color = section.dataset.color || '#ffffff';
    const label = section.querySelector('h2')?.textContent?.trim() || key.toUpperCase();
    const desc   = section.querySelector('.seo-desc')?.textContent?.trim() || '';
    const detail = section.querySelector('.seo-detail')?.textContent?.trim() || '';
    const tech: string[] = [];
    section.querySelectorAll('.seo-tech li').forEach((li) => tech.push(li.textContent?.trim() || ''));
    services[key] = { label, icon: key, iconColor: color, description: desc, detail, tech };
  });
  return services as ServiceMap;
}

// --- DOM refs ---
const canvas        = document.getElementById('canvas') as HTMLCanvasElement;
const heroFixed     = document.getElementById('heroFixed')!;
const nav           = document.getElementById('nav')!;
const navToggle     = document.getElementById('navToggle') as HTMLButtonElement;
const navLinks      = document.querySelectorAll<HTMLAnchorElement>('#navLinks a');
const searchInput   = document.getElementById('searchInput') as HTMLInputElement;
const searchResults = document.getElementById('searchResults')!;

// --- Star scene ---
const starState = createStarScene(canvas);
startStarLoop(starState);

// --- Service data (for search) ---
const svc = readServicesFromDOM();
const searchIndex = buildSearchIndex(svc);

// --- Card management ---
const cards = new Map<string, HTMLElement>();
document.querySelectorAll<HTMLElement>('.stage-card').forEach((el) => {
  const key = el.id.replace('card-', '');
  cards.set(key, el);
});

let activeCard: string | null = null;

function showCard(key: string | null): void {
  if (key === activeCard) return;
  activeCard = key;

  // Toggle card-active class on hero (dims headline, hides qualifier)
  heroFixed.classList.toggle('card-active', !!key);

  // Swap visible card
  cards.forEach((el, k) => {
    el.classList.toggle('card--active', k === key);
  });

  // Update nav active state
  const block = key || 'overview';
  setActiveNav(block);
}

// --- Nav scroll ---
const navToSection: Record<string, string> = {
  overview:     'sec-hero',
  database:     'sec-database',
  appdev:       'sec-appdev',
  cloud:        'sec-cloud',
  data:         'sec-data',
  architecture: 'sec-architecture',
  contact:      'sec-contact',
};

function setActiveNav(block: string): void {
  navLinks.forEach((a) => a.classList.toggle('nav__link--active', a.dataset.block === block));
}

navLinks.forEach((a) => {
  a.addEventListener('click', (e) => {
    e.preventDefault();
    nav.classList.remove('nav--open');
    navToggle.setAttribute('aria-expanded', 'false');
    const block = a.dataset.block!;
    const targetId = navToSection[block] || 'sec-hero';
    document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
  });
});

document.getElementById('logoHome')?.addEventListener('click', () => {
  document.getElementById('sec-hero')?.scrollIntoView({ behavior: 'smooth' });
});

navToggle.addEventListener('click', () => {
  const next = !nav.classList.contains('nav--open');
  nav.classList.toggle('nav--open', next);
  navToggle.setAttribute('aria-expanded', String(next));
});

// --- Scroll observer — determines which card to show ---
const scrollSections = document.querySelectorAll<HTMLElement>('.scroll-section');

const sectionObserver = new IntersectionObserver(
  (entries) => {
    // Find the most-visible section that is intersecting
    let best: { key: string; ratio: number } = { key: '', ratio: 0 };
    entries.forEach((entry) => {
      if (entry.isIntersecting && entry.intersectionRatio > best.ratio) {
        best = {
          key:   (entry.target as HTMLElement).dataset.card || '',
          ratio: entry.intersectionRatio,
        };
      }
    });
    // Only update if we have a clear winner
    if (best.ratio > 0) showCard(best.key || null);
  },
  {
    threshold: [0.25, 0.5, 0.75],
    rootMargin: '-5% 0px -5% 0px',
  }
);

scrollSections.forEach((s) => sectionObserver.observe(s));

// --- Hero entrance animations ---
window.addEventListener('load', () => {
  const lines = document.querySelectorAll<HTMLElement>('.hero__headline-line');
  lines.forEach((el, i) => {
    el.style.transitionDelay = `${0.05 + i * 0.13}s`;
    requestAnimationFrame(() => el.classList.add('visible'));
  });
  document.getElementById('heroQualifier')?.classList.add('visible');
  document.getElementById('heroMeta')?.classList.add('visible');
  document.getElementById('heroScrollCue')?.classList.add('visible');
});

// --- Search ---
function doSearch(query: string): void {
  if (!query || query.length < 2) {
    searchResults.classList.remove('search-results--open');
    return;
  }
  const grouped = searchServices(searchIndex, query);
  if (grouped.size === 0) {
    searchResults.innerHTML = `<div class="search-results__empty">No matches for "${query}"</div>`;
    searchResults.classList.add('search-results--open');
    return;
  }
  let html = '';
  grouped.forEach((items, key) => {
    const first = items[0];
    html += `<div class="search-results__group">${first.category}</div>`;
    items.filter((i) => i.type === 'tech').forEach((m) => {
      html += `<div class="search-results__item" data-key="${key}"><span class="search-results__dot" style="background:${m.color}"></span><span class="search-results__text">${highlightMatch(m.text, query)}</span><span class="search-results__category">capability</span></div>`;
    });
    const descs = items.filter((i) => i.type !== 'tech');
    if (descs.length > 0) {
      const d = descs[0];
      let snippet = d.text;
      const pos = snippet.toLowerCase().indexOf(query.toLowerCase());
      if (pos > 40) snippet = '…' + snippet.slice(pos - 30);
      if (snippet.length > 100) snippet = snippet.slice(0, 100) + '…';
      html += `<div class="search-results__item" data-key="${key}"><span class="search-results__dot" style="background:${d.color}"></span><span class="search-results__text">${highlightMatch(snippet, query)}</span><span class="search-results__category">description</span></div>`;
    }
  });
  searchResults.innerHTML = html;
  searchResults.classList.add('search-results--open');

  searchResults.querySelectorAll<HTMLElement>('.search-results__item').forEach((item) => {
    item.addEventListener('click', () => {
      searchResults.classList.remove('search-results--open');
      searchInput.value = '';
      const targetId = navToSection[item.dataset.key as string] || 'sec-hero';
      document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

searchInput.addEventListener('input', () => doSearch(searchInput.value));
searchInput.addEventListener('focus', () => { if (searchInput.value.length >= 2) doSearch(searchInput.value); });
document.addEventListener('click', (e) => {
  if (!(e.target as Element).closest('.nav__search')) searchResults.classList.remove('search-results--open');
});
searchInput.addEventListener('keydown', (e) => {
  const items = searchResults.querySelectorAll<HTMLElement>('.search-results__item');
  if (!items.length) return;
  const active = searchResults.querySelector<HTMLElement>('.search-results__item--active');
  let idx = Array.from(items).indexOf(active!);
  if (e.key === 'ArrowDown')       { e.preventDefault(); active?.classList.remove('search-results__item--active'); idx = Math.min(idx + 1, items.length - 1); items[idx].classList.add('search-results__item--active'); items[idx].scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'ArrowUp')    { e.preventDefault(); active?.classList.remove('search-results__item--active'); idx = Math.max(idx - 1, 0); items[idx].classList.add('search-results__item--active'); items[idx].scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'Enter' && active) { active.click(); }
  else if (e.key === 'Escape')     { searchResults.classList.remove('search-results--open'); searchInput.blur(); }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
    nav.classList.remove('nav--open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// --- Resize ---
window.addEventListener('resize', () => handleStarResize(starState));
