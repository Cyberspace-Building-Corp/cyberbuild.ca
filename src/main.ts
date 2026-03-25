// ============================================
// CYBERBUILD.CA — Main Entry Point
// Star field background + scroll-driven page
// GSAP ScrollTrigger for horizontal service cards
// ============================================

import './styles/main.css';
import type { ServiceMap, ServiceKey } from './lib/types';
import { createStarScene, startStarLoop, handleStarResize } from './lib/scene';
import { buildSearchIndex, searchServices, highlightMatch } from './lib/search';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// --- Read service data from DOM (SEO sections) ---
function readServicesFromDOM(): ServiceMap {
  const services: Partial<ServiceMap> = {};
  document.querySelectorAll<HTMLElement>('.seo-content section[data-service]').forEach((section) => {
    const key = section.dataset.service as ServiceKey;
    if (key === 'contact' as any) return;
    const color = section.dataset.color || '#ffffff';
    const label = section.querySelector('h2')?.textContent?.trim() || key.toUpperCase();
    const desc  = section.querySelector('.seo-desc')?.textContent?.trim() || '';
    const detail = section.querySelector('.seo-detail')?.textContent?.trim() || '';
    const tech: string[] = [];
    section.querySelectorAll('.seo-tech li').forEach((li) => tech.push(li.textContent?.trim() || ''));
    services[key] = { label, icon: key, iconColor: color, description: desc, detail, tech };
  });
  return services as ServiceMap;
}

// --- DOM refs ---
const canvas      = document.getElementById('canvas') as HTMLCanvasElement;
const nav         = document.getElementById('nav')!;
const navToggle   = document.getElementById('navToggle') as HTMLButtonElement;
const navLinks    = document.querySelectorAll<HTMLAnchorElement>('#navLinks a');
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchResults = document.getElementById('searchResults')!;

// --- Star scene ---
const starState = createStarScene(canvas);
startStarLoop(starState);

// --- Service data ---
const svc = readServicesFromDOM();
const searchIndex = buildSearchIndex(svc);

// --- Nav scroll behavior ---
const sectionMap: Record<string, string> = {
  overview:     '#hero',
  database:     '#capabilities',
  appdev:       '#capabilities',
  cloud:        '#capabilities',
  data:         '#capabilities',
  architecture: '#capabilities',
  contact:      '#contact',
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
    const target = sectionMap[block] || '#hero';
    const el = document.querySelector(target);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
    setActiveNav(block);
  });
});

document.getElementById('logoHome')?.addEventListener('click', () => {
  document.querySelector('#hero')?.scrollIntoView({ behavior: 'smooth' });
  setActiveNav('overview');
});

navToggle.addEventListener('click', () => {
  const next = !nav.classList.contains('nav--open');
  nav.classList.toggle('nav--open', next);
  navToggle.setAttribute('aria-expanded', String(next));
});

// --- Update active nav on scroll ---
const sections = [
  { id: 'hero',         block: 'overview' },
  { id: 'capabilities', block: 'database' },
  { id: 'trackrecord',  block: 'overview' },
  { id: 'contact',      block: 'contact' },
];

const sectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        const found = sections.find((s) => s.id === id);
        if (found) setActiveNav(found.block);
      }
    });
  },
  { threshold: 0.3 }
);
sections.forEach(({ id }) => {
  const el = document.getElementById(id);
  if (el) sectionObserver.observe(el);
});

// --- Scroll-reveal (fade-up) ---
const fadeObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
);

document.querySelectorAll('.fade-up').forEach((el) => fadeObserver.observe(el));

// --- Staggered grid reveals ---
const gridObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.querySelectorAll<HTMLElement>('.stat-card').forEach((card, i) => {
          setTimeout(() => card.classList.add('visible'), i * 100);
        });
        gridObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.1 }
);
document.querySelectorAll('.impact__grid').forEach((el) => gridObserver.observe(el));

// --- GSAP Horizontal scroll for services ---
function initHorizontalScroll(): void {
  const section = document.querySelector('.services') as HTMLElement;
  const track   = document.querySelector('.services__track') as HTMLElement;
  if (!section || !track) return;

  // Mobile: skip GSAP, let cards stack vertically
  if (window.innerWidth <= 768) return;

  const scrollDist = track.scrollWidth - window.innerWidth + 64;

  gsap.to(track, {
    x: -scrollDist,
    ease: 'none',
    scrollTrigger: {
      trigger: section,
      pin: true,
      scrub: 1,
      start: 'top top',
      end: () => `+=${scrollDist}`,
      onUpdate: (self) => {
        const progress = document.getElementById('servicesProgress');
        if (progress) progress.style.transform = `scaleX(${self.progress})`;
      },
    },
  });
}

// Wait for fonts/layout before measuring
window.addEventListener('load', () => {
  initHorizontalScroll();

  // Hero headline stagger
  document.querySelectorAll<HTMLElement>('.hero__headline-line').forEach((el, i) => {
    el.style.transitionDelay = `${0.1 + i * 0.12}s`;
    el.classList.add('visible');
  });
  document.querySelector('.hero__qualifier')?.classList.add('visible');
  document.querySelector('.hero__scroll-cue')?.classList.add('visible');
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
      // Scroll to the services section (horizontal scroll will handle card position)
      document.querySelector('#capabilities')?.scrollIntoView({ behavior: 'smooth' });
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
  if (e.key === 'ArrowDown')  { e.preventDefault(); active?.classList.remove('search-results__item--active'); idx = Math.min(idx + 1, items.length - 1); items[idx].classList.add('search-results__item--active'); items[idx].scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'ArrowUp')    { e.preventDefault(); active?.classList.remove('search-results__item--active'); idx = Math.max(idx - 1, 0); items[idx].classList.add('search-results__item--active'); items[idx].scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'Enter' && active)  { active.click(); }
  else if (e.key === 'Escape') { searchResults.classList.remove('search-results--open'); searchInput.blur(); }
});

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && nav.classList.contains('nav--open')) {
    nav.classList.remove('nav--open');
    navToggle.setAttribute('aria-expanded', 'false');
  }
});

// --- Resize ---
window.addEventListener('resize', () => {
  handleStarResize(starState);
  ScrollTrigger.refresh();
});
