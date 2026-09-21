import { getAllPosts } from '../../lib/posts';
import { siteConfig } from '../../siteConfig';

const baseUrl = siteConfig.siteUrl || 'https://xhblogs-rouge.vercel.app';

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// 构建时静态生成 feed.xml，避免每次请求都读文件
export const dynamic = 'force-static';

export async function GET() {
  const posts = getAllPosts();

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/posts/${post.slug}`;
      const pubDate = new Date(post.date).toUTCString();
      const categories = post.tags
        .map((t) => `    <category>${escapeXml(t)}</category>`)
        .join('\n');
      return `  <item>
    <title>${escapeXml(post.title)}</title>
    <link>${link}</link>
    <guid isPermaLink="true">${link}</guid>
    <pubDate>${pubDate}</pubDate>
    <description>${escapeXml(post.description || '')}</description>
${categories}
  </item>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(siteConfig.title)}</title>
  <link>${baseUrl}</link>
  <description>${escapeXml(siteConfig.bio || siteConfig.title)}</description>
  <language>zh-CN</language>
  <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
  <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml"/>
${items}
</channel>
</rss>`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
}
