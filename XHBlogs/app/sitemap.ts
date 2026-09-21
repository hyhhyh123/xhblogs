import type { MetadataRoute } from 'next';

import { getAllPosts, getAllTags } from '../lib/posts';
import { siteConfig } from '../siteConfig';

const baseUrl = siteConfig.siteUrl || 'https://xhblogs-rouge.vercel.app';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: now, changeFrequency: 'daily', priority: 1 },
    { url: `${baseUrl}/posts`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/tags`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/projects`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/moments`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${baseUrl}/friends`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/photowall`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/music`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${baseUrl}/timeline`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/tree`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/chatter`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ];

  const postRoutes: MetadataRoute.Sitemap = getAllPosts().map((p) => ({
    url: `${baseUrl}/posts/${p.slug}`,
    lastModified: new Date(p.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }));

  const tagRoutes: MetadataRoute.Sitemap = getAllTags().map((t) => ({
    url: `${baseUrl}/tags/${encodeURIComponent(t.tag)}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.4,
  }));

  return [...staticRoutes, ...postRoutes, ...tagRoutes];
}
