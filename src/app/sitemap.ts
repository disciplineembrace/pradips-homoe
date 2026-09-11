// ============================================================
// SITEMAP — Pradip's Homoe
// ============================================================
// Canonical sitemap for the official production website.
// Only the production URL (https://pradips-homoe.vercel.app) is
// included — preview/deployment URLs are NOT indexed.
//
// Production branch: main
// Development branch: master (preview only)
// ============================================================
import type { MetadataRoute } from 'next';

const CANONICAL_URL = 'https://pradips-homoe.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    '',
    '/login',
    '/materia-medica',
    '/repertory',
    '/organon',
    '/therapeutics',
    '/predictive',
    '/synthesis',
    '/question-bank',
    '/quick-clinical-search',
    '/clinical',
    '/books',
    '/segal',
    '/contact',
    '/single-rubrics-single-remedy',
  ];

  const now = new Date();

  return routes.map((route) => ({
    url: `${CANONICAL_URL}${route}`,
    lastModified: now,
    changeFrequency: route === '' ? 'daily' : 'weekly',
    priority: route === '' ? 1.0 : 0.8,
  }));
}
