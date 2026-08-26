import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { siteConfig } from '../siteConfig';

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover: string;
}

const postsDirectory = path.join(process.cwd(), 'posts');

/** 读取全部文章元信息（按日期倒序） */
export function getAllPosts(): PostMeta[] {
  if (!fs.existsSync(postsDirectory)) return [];
  const fileNames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.md'));
  return fileNames
    .map((fileName) => {
      const fullPath = path.join(postsDirectory, fileName);
      const { data } = matter(fs.readFileSync(fullPath, 'utf8'));
      return {
        slug: fileName.replace(/\.md$/, ''),
        title: data.title || '无标题',
        description: data.description || '',
        date: data.date || '1970-01-01',
        tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
        cover: data.cover || siteConfig.defaultPostCover,
      };
    })
    .sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (diff !== 0) return diff;
      return b.slug.localeCompare(a.slug);
    });
}

/** 聚合全部标签及出现次数（按数量降序，同量按拼音） */
export function getAllTags(): { tag: string; count: number }[] {
  const countMap = new Map<string, number>();
  for (const post of getAllPosts()) {
    for (const tag of post.tags) {
      countMap.set(tag, (countMap.get(tag) || 0) + 1);
    }
  }
  return Array.from(countMap.entries())
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'zh-Hans-CN'));
}

/** 按标签过滤文章 */
export function getPostsByTag(tag: string): PostMeta[] {
  return getAllPosts().filter((p) => p.tags.includes(tag));
}

/** 文章列表页每页篇数 */
export const POSTS_PER_PAGE = 6;

// ==================== 全文搜索 ====================

export interface SearchResult {
  post: PostMeta;
  snippet: string; // 正文中命中关键词附近的片段
}

/** 把 Markdown 粗略转成纯文本（去掉语法符号，代码块整体视为空白避免噪音） */
function mdToPlainText(content: string): string {
  return content
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\*\*|__|~~|\*|_/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 截取关键词前后片段，超出部分用省略号 */
function makeSnippet(plainText: string, query: string, radius = 55): string {
  const idx = plainText.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return plainText.slice(0, radius * 2);
  const start = Math.max(0, idx - radius);
  const end = Math.min(plainText.length, idx + query.length + radius);
  return (start > 0 ? '…' : '') + plainText.slice(start, end) + (end < plainText.length ? '…' : '');
}

/** 全文搜索：匹配标题 / 描述 / 标签 / 正文，按日期倒序 */
export function searchPosts(query: string): SearchResult[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  if (!fs.existsSync(postsDirectory)) return [];

  const results: SearchResult[] = [];
  const fileNames = fs.readdirSync(postsDirectory).filter((f) => f.endsWith('.md'));

  for (const fileName of fileNames) {
    const slug = fileName.replace(/\.md$/, '');
    const { data, content } = matter(fs.readFileSync(path.join(postsDirectory, fileName), 'utf8'));

    const title = String(data.title || '无标题');
    const description = String(data.description || '');
    const tags: string[] = Array.isArray(data.tags) ? data.tags.map(String) : [];
    const plain = mdToPlainText(content);

    const inTitle = title.toLowerCase().includes(q);
    const inDesc = description.toLowerCase().includes(q);
    const inTag = tags.some((t) => t.toLowerCase().includes(q));
    const inBody = plain.toLowerCase().includes(q);
    if (!inTitle && !inDesc && !inTag && !inBody) continue;

    const snippet = inBody ? makeSnippet(plain, q) : description || plain.slice(0, 100);

    results.push({
      post: {
        slug,
        title,
        description,
        date: data.date || '1970-01-01',
        tags,
        cover: data.cover || siteConfig.defaultPostCover,
      },
      snippet,
    });
  }

  return results.sort(
    (a, b) => new Date(b.post.date).getTime() - new Date(a.post.date).getTime()
  );
}
