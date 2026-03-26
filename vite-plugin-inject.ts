// ============================================
// vite-plugin-seo-inject.ts
// Reads services.json + contact.json at build time
// and injects crawlable semantic HTML into index.html
// ============================================

import { readFileSync } from 'fs';
import { resolve } from 'path';
import type { Plugin } from 'vite';

interface Service {
  label: string;
  title: string;
  icon: string;
  iconColor: string;
  description: string;
  detail: string;
  tech: string[];
}

interface Contact {
  company: string;
  email: string;
  website: string;
  portfolio: string;
  regions: string[];
  timezone: string;
  description: string;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export default function seoInjectPlugin(): Plugin {
  return {
    name: 'seo-inject',
    transformIndexHtml(html) {
      const servicesPath = resolve(__dirname, 'src/data/services.json');
      const contactPath = resolve(__dirname, 'src/data/contact.json');

      const services: Record<string, Service> = JSON.parse(readFileSync(servicesPath, 'utf-8'));
      const contact: Contact = JSON.parse(readFileSync(contactPath, 'utf-8'));

      // Build structured data (JSON-LD)
      const jsonLd = {
        "@context": "https://schema.org",
        "@type": "ProfessionalService",
        "name": contact.company,
        "url": contact.website,
        "email": contact.email,
        "description": "Enterprise solution architecture, data engineering, and cloud infrastructure consulting.",
        "areaServed": contact.regions,
        "address": {
          "@type": "PostalAddress",
          "addressRegion": "Ontario",
          "addressCountry": "CA"
        },
        "knowsAbout": Object.values(services).flatMap(s => s.tech),
        "hasOfferCatalog": {
          "@type": "OfferCatalog",
          "name": "Services",
          "itemListElement": Object.values(services).map(s => ({
            "@type": "Offer",
            "itemOffered": { "@type": "Service", "name": s.label }
          }))
        }
      };

      // Build SEO HTML sections
      let seoHtml = `
<main class="seo-content" aria-label="Service descriptions">
  <h1>${escapeHtml(contact.company)}</h1>
  <p>Enterprise solution architecture, data engineering, and cloud infrastructure consulting. Serving ${contact.regions.join(', ')}.</p>
`;

      for (const [key, svc] of Object.entries(services)) {
        seoHtml += `
  <section id="seo-${key}" data-service="${key}" data-color="${svc.iconColor}">
    <h2>${escapeHtml(svc.label)}</h2>
    <p class="seo-desc">${escapeHtml(svc.description)}</p>
    <p class="seo-detail">${escapeHtml(svc.detail)}</p>
    <ul class="seo-tech">
${svc.tech.map(t => `      <li>${escapeHtml(t)}</li>`).join('\n')}
    </ul>
  </section>
`;
      }

      seoHtml += `
  <section id="seo-contact" data-service="contact">
    <h2>Contact</h2>
    <p>${escapeHtml(contact.company)} delivers enterprise solution architecture, data engineering, and cloud infrastructure consulting. Serving ${contact.regions.join(', ')}.</p>
    <address>
      <a href="mailto:${contact.email}">${contact.email}</a><br>
      <a href="${contact.website}">${contact.website.replace('https://', '')}</a>
    </address>
    <p>${contact.regions.join(' · ')} — ${contact.timezone}</p>
  </section>
</main>`;

      // Inject JSON-LD into <head>
      html = html.replace(
        '</head>',
        `  <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n  </script>\n</head>`
      );

      // Inject SEO HTML before closing </body>
      html = html.replace(
        '<!--SEO_INJECT-->',
        seoHtml
      );

      // Inject service cards from services.json
      let serviceCards = '';
      for (const [key, svc] of Object.entries(services)) {
        const color = svc.iconColor;
        const borderColor = color + '33';
        const techItems = svc.tech.map(t =>
          `      <span class="card__tech-item"><span class="card__tech-dot" style="background:${color}"></span>${escapeHtml(t)}</span>`
        ).join('\n');
        serviceCards += `
  <div class="stage-card" id="card-${key}">
    <div class="card__badge" style="color:${color};border:1px solid ${borderColor}">${escapeHtml(svc.label)} //</div>
    <h2 class="card__title">${escapeHtml(svc.title)}</h2>
    <p class="card__text">${escapeHtml(svc.description)}</p>
    <p class="card__text">${escapeHtml(svc.detail)}</p>
    <div class="card__tech-grid">
${techItems}
    </div>
  </div>
`;
      }
      html = html.replace('<!--SERVICE_CARDS-->', serviceCards);

      // Inject contact card content from contact.json
      const portfolioDisplay = contact.portfolio.replace('https://', '');
      const regionsDisplay = contact.regions.join(' &middot; ');
      const contactCard = `
    <div class="card__badge" style="color:#5cb8ff;border:1px solid #5cb8ff33">CONTACT //</div>
    <h2 class="card__title">Get In Touch</h2>
    <p class="card__text">${escapeHtml(contact.description)}</p>
    <p class="card__text">Serving ${contact.regions.map(r => escapeHtml(r)).join(', ')}.</p>
    <div class="card__contact-links">
      <a class="card__contact-link" href="mailto:${contact.email}">
        <span class="card__contact-icon">@</span>${escapeHtml(contact.email)}
      </a>
      <a class="card__contact-link" href="${contact.portfolio}" target="_blank" rel="noopener">
        <span class="card__contact-icon">&#8599;</span>${escapeHtml(portfolioDisplay)}
      </a>
    </div>
    <div class="card__location">${regionsDisplay} // ${escapeHtml(contact.timezone)}</div>`;
      html = html.replace('<!--CONTACT_CARD-->', contactCard);

      return html;
    }
  };
}