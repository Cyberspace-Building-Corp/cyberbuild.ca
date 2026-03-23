// ============================================
// CYBERBUILD.CA — Main Entry Point
// Reads service data FROM THE DOM (SEO-friendly HTML sections),
// then wires Three.js scene, overlays, and search.
// ============================================

import './styles/main.css';
import graphLayout from './data/graph-layout.json';
import type { ServiceMap, ServiceKey, GraphLayout } from './lib/types';
import { createScene, startAnimationLoop, animateCamera, handleResize } from './lib/scene';
import { buildSearchIndex, searchServices, highlightMatch } from './lib/search';
import * as THREE from 'three';

// --- Read service data from DOM ---
function readServicesFromDOM(): ServiceMap {
  const services: Partial<ServiceMap> = {};
  document.querySelectorAll<HTMLElement>('.seo-content section[data-service]').forEach((section) => {
    const key = section.dataset.service as ServiceKey;
    if (key === 'contact' as any) return; // Skip contact — handled separately
    const color = section.dataset.color || '#ffffff';
    const label = section.querySelector('h2')?.textContent?.trim() || key.toUpperCase();
    const desc = section.querySelector('.seo-desc')?.textContent?.trim() || '';
    const detail = section.querySelector('.seo-detail')?.textContent?.trim() || '';
    const tech: string[] = [];
    section.querySelectorAll('.seo-tech li').forEach((li) => {
      tech.push(li.textContent?.trim() || '');
    });
    services[key] = { label, icon: key, iconColor: color, description: desc, detail, tech };
  });
  return services as ServiceMap;
}

function readContactFromDOM(): { company: string; email: string; website: string; regions: string[]; timezone: string } {
  const section = document.querySelector('[data-service="contact"]');
  const emailEl = section?.querySelector('a[href^="mailto:"]');
  const websiteEl = section?.querySelector('a[href^="https://"]');
  return {
    company: 'Cyberspace Building Corp.',
    email: emailEl?.textContent?.trim() || 'services@cyberbuild.ca',
    website: websiteEl?.getAttribute('href') || 'https://cyberbuild.ca',
    regions: ['Simcoe County', 'Greater Toronto Area', 'Worldwide'],
    timezone: 'EST (UTC-5)',
  };
}

// --- DOM refs ---
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const tooltip = document.getElementById('tooltip')!;
const overlay = document.getElementById('overlay')!;
const overlayCard = document.getElementById('overlayCard')!;
const hint = document.getElementById('hint')!;
const searchInput = document.getElementById('searchInput') as HTMLInputElement;
const searchResults = document.getElementById('searchResults')!;
const nav = document.getElementById('nav')!;
const navToggle = document.getElementById('navToggle') as HTMLButtonElement;
const navLinks = document.querySelectorAll<HTMLAnchorElement>('#navLinks a');

// --- Init ---
const svc = readServicesFromDOM();
const contact = readContactFromDOM();
const layout = graphLayout as GraphLayout;
const state = createScene(canvas, svc, layout);

// --- State ---
let hoveredKey: ServiceKey | null = null;
let selectedKey: string | null = null;
let animating = false;

// --- Overlay helpers ---
function showOverlay(html: string): void {
  overlayCard.innerHTML = `<button class="overlay__close" id="oc" type="button" aria-label="Close overlay">&times;</button>${html}`;
  overlay.classList.add('overlay--open');
  document.getElementById('oc')!.addEventListener('click', closeOverlay);
}

function setActiveNav(block: string): void {
  navLinks.forEach((a) => a.classList.toggle('nav__link--active', a.dataset.block === block));
}

function resetNodeVisuals(): void {
  Object.values(state.nodeGroups).forEach((ng) => {
    (ng.userData as any).outer.material.opacity = 0.3;
    ng.children.forEach((ch: any) => {
      if (ch.isSprite) ch.material.opacity = 0.9;
      if (ch.isPoints) ch.material.opacity = 0.4;
      if (ch.isMesh && ch.material.transparent && ch.material.opacity < 0.1) ch.material.opacity = 0.02;
    });
  });
  state.edgeLines.forEach((l) => { (l.material as THREE.LineBasicMaterial).opacity = 0.18; });
}

function closeOverlay(): void {
  selectedKey = null;
  overlay.classList.remove('overlay--open');
  hint.classList.remove('scene__hint--hidden');
  nav.classList.remove('nav--open');
  navToggle.setAttribute('aria-expanded', 'false');
  resetNodeVisuals();

  const dir = state.camera.position.clone().sub(state.controls.target).normalize();
  const newPos = state.defaultTarget.clone().add(dir.multiplyScalar(state.overviewDistance));
  animating = true;
  animateCamera(state, newPos, state.defaultTarget.clone(), 900, () => { animating = false; });
  setTimeout(() => { state.controls.autoRotate = true; }, 1000);
  setActiveNav('overview');
}

function selectNode(key: ServiceKey): void {
  if (!state.nodeGroups[key] || animating) return;
  selectedKey = key;
  hint.classList.add('scene__hint--hidden');

  Object.values(state.nodeGroups).forEach((ng) => {
    const isSel = (ng.userData as any).serviceKey === key;
    (ng.userData as any).outer.material.opacity = isSel ? 0.55 : 0.06;
    ng.children.forEach((ch: any) => {
      if (ch.isSprite) ch.material.opacity = isSel ? 1 : 0.1;
      if (ch.isPoints) ch.material.opacity = isSel ? 0.6 : 0.05;
      if (ch.isMesh && ch.material.transparent && ch.material.opacity < 0.1)
        ch.material.opacity = isSel ? 0.04 : 0.002;
    });
  });
  state.edgeLines.forEach((l) => { (l.material as THREE.LineBasicMaterial).opacity = 0.04; });

  const nd = state.nodeData[key];
  animating = true;
  animateCamera(state, nd.pos.clone().add(new THREE.Vector3(3, 2, 4)), nd.pos.clone(), 900, () => { animating = false; });

  const s = svc[key];
  showOverlay(`
    <div class="card__badge" style="color:${s.iconColor};border:1px solid ${s.iconColor}33">${s.label}</div>
    <h2 class="card__title">${s.label}</h2>
    <p class="card__text">${s.description}</p>
    <p class="card__text">${s.detail}</p>
    <div class="card__tech-grid">${s.tech.map((t) => `<span class="card__tech-item"><span class="card__tech-dot" style="background:${s.iconColor}"></span>${t}</span>`).join('')}</div>
  `);
  setActiveNav(key);
}

function showContact(): void {
  selectedKey = 'contact';
  hint.classList.add('scene__hint--hidden');
  showOverlay(`
    <div class="card__badge" style="color:#5cb8ff;border:1px solid #5cb8ff33">CONTACT //</div>
    <h2 class="card__title">Get In Touch</h2>
    <p class="card__text">${contact.company} delivers enterprise solution architecture, data engineering, and cloud infrastructure consulting. Serving ${contact.regions.join(', ')}.</p>
    <div class="card__contact-links">
      <a class="card__contact-link" href="mailto:${contact.email}"><span class="card__contact-icon">@</span>${contact.email}</a>
      <a class="card__contact-link" href="${contact.website}"><span class="card__contact-icon">//</span>${contact.website.replace('https://', '')}</a>
    </div>
    <div class="card__location">${contact.regions.join(' &middot; ')} // ${contact.timezone}</div>
  `);
  setActiveNav('contact');
}

// --- Mouse interaction ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

canvas.addEventListener('mousemove', (e) => {
  mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, state.camera);
  const hits = raycaster.intersectObjects(state.hitTargets);

  if (hits.length > 0) {
    const key = (hits[0].object.parent!.userData as any).serviceKey as ServiceKey;
    if (key && key !== selectedKey) {
      canvas.style.cursor = 'pointer';
      tooltip.textContent = svc[key].label;
      tooltip.style.left = `${e.clientX + 14}px`;
      tooltip.style.top = `${e.clientY - 10}px`;
      tooltip.classList.add('scene__tooltip--visible');
      if (hoveredKey !== key) {
        if (hoveredKey && state.nodeGroups[hoveredKey] && hoveredKey !== selectedKey)
          (state.nodeGroups[hoveredKey].userData as any).outer.material.opacity = 0.3;
        (state.nodeGroups[key].userData as any).outer.material.opacity = 0.5;
        hoveredKey = key;
      }
    }
  } else {
    canvas.style.cursor = 'grab';
    tooltip.classList.remove('scene__tooltip--visible');
    if (hoveredKey && state.nodeGroups[hoveredKey] && hoveredKey !== selectedKey)
      (state.nodeGroups[hoveredKey].userData as any).outer.material.opacity = 0.3;
    hoveredKey = null;
  }
});

canvas.addEventListener('click', () => {
  raycaster.setFromCamera(mouse, state.camera);
  const hits = raycaster.intersectObjects(state.hitTargets);
  if (hits.length > 0) {
    const k = (hits[0].object.parent!.userData as any).serviceKey as ServiceKey;
    if (k) selectNode(k);
  }
});

// --- Nav ---
document.getElementById('overlayBg')!.addEventListener('click', closeOverlay);
document.getElementById('logoHome')!.addEventListener('click', closeOverlay);
navToggle.addEventListener('click', () => {
  const next = !nav.classList.contains('nav--open');
  nav.classList.toggle('nav--open', next);
  navToggle.setAttribute('aria-expanded', String(next));
});
navLinks.forEach((a) =>
  a.addEventListener('click', () => {
    nav.classList.remove('nav--open');
    navToggle.setAttribute('aria-expanded', 'false');
    const k = a.dataset.block!;
    if (k === 'overview') closeOverlay();
    else if (k === 'contact') showContact();
    else if (svc[k as ServiceKey]) selectNode(k as ServiceKey);
  })
);

// --- Keyboard ---
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeOverlay();
  if (e.key === 'd' && !e.ctrlKey && !e.metaKey && document.activeElement?.tagName !== 'INPUT') {
    const p = state.camera.position;
    const t = state.controls.target;
    console.log(`cam: [${p.x.toFixed(1)},${p.y.toFixed(1)},${p.z.toFixed(1)}] target: [${t.x.toFixed(1)},${t.y.toFixed(1)},${t.z.toFixed(1)}]`);
  }
});

// --- Search (reads from the same DOM-sourced svc data) ---
const searchIndex = buildSearchIndex(svc);

function doSearch(query: string): void {
  if (!query || query.length < 2) { searchResults.classList.remove('search-results--open'); return; }
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
      selectNode(item.dataset.key as ServiceKey);
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
  const active = searchResults.querySelector('.search-results__item--active');
  let idx = Array.from(items).indexOf(active as HTMLElement);
  if (e.key === 'ArrowDown') { e.preventDefault(); active?.classList.remove('search-results__item--active'); idx = Math.min(idx + 1, items.length - 1); items[idx].classList.add('search-results__item--active'); items[idx].scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'ArrowUp') { e.preventDefault(); active?.classList.remove('search-results__item--active'); idx = Math.max(idx - 1, 0); items[idx].classList.add('search-results__item--active'); items[idx].scrollIntoView({ block: 'nearest' }); }
  else if (e.key === 'Enter' && active) { (active as HTMLElement).click(); }
  else if (e.key === 'Escape') { searchResults.classList.remove('search-results--open'); searchInput.blur(); }
});

// --- Resize ---
window.addEventListener('resize', () => handleResize(state));

// --- Start ---
startAnimationLoop(state);
console.log('Cyberbuild loaded — services read from DOM:', Object.keys(svc));