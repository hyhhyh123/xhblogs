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
