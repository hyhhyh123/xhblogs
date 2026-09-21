import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

// ==================== 写作后台 API ====================
// 动作: list(文章列表) / create(新建) / update(更新) / delete(删除)
// 鉴权: 请求体带 password, 与 Vercel 环境变量 WRITE_PASSWORD 比对
// 写入: 使用环境变量 GITHUB_TOKEN 通过 GitHub Contents API 操作 posts/ 目录

const REPO = 'hyhhyh123/xhblogs';
const BASE = `https://api.github.com/repos/${REPO}`;
const BRANCH = 'main';
const POSTS_DIR = path.join(process.cwd(), 'posts');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN || '';
const WRITE_PASSWORD = process.env.WRITE_PASSWORD || '';

interface WriteBody {
  password?: string;
  action?: string;
  slug?: string; // 文件名(不含 .md),仅小写字母/数字/连字符
  content?: string; // 完整 Markdown 内容(含 frontmatter)
}

function authError(pw?: string): string | null {
  if (!WRITE_PASSWORD) return '写作后台未配置 WRITE_PASSWORD 环境变量';
  if (pw !== WRITE_PASSWORD) return '密码错误';
  return null;
}

function slugSafe(slug: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

async function gh(url: string, method: string, body?: unknown) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent': 'xhblogs-write',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  if (!res.ok) {
    return { ok: false as const, status: res.status, message: json?.message || text };
  }
  return { ok: true as const, status: res.status, data: json };
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as WriteBody;
  const err = authError(body.password);
  if (err) return NextResponse.json({ error: err }, { status: 401 });

  const action = body.action || 'list';

  // ---------- list: 读取本地 posts 目录 ----------
  if (action === 'list') {
    let items: any[] = [];
    if (fs.existsSync(POSTS_DIR)) {
      items = fs
        .readdirSync(POSTS_DIR)
        .filter((f) => f.endsWith('.md'))
        .map((f) => {
          const { data, content } = matter(fs.readFileSync(path.join(POSTS_DIR, f), 'utf8'));
          return {
            slug: f.replace(/\.md$/, ''),
            title: data.title || '无标题',
            date: data.date || '',
            description: data.description || '',
            tags: Array.isArray(data.tags) ? data.tags : [],
            cover: data.cover || '',
            content, // 编辑时直接回填
          };
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
    return NextResponse.json({ ok: true, items });
  }

  // ---------- 以下动作需要 GitHub Token ----------
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: '写作后台未配置 GITHUB_TOKEN 环境变量' }, { status: 500 });
  }

  const slug = String(body.slug || '');
  if (!slugSafe(slug)) {
    return NextResponse.json(
      { error: '文件名非法：仅允许小写字母、数字与连字符（如 2026-08-26-my-post）' },
      { status: 400 }
    );
  }
  const fileName = `${slug}.md`;
  const remoteUrl = `${BASE}/contents/XHBlogs/posts/${fileName}`;

  if (action === 'create') {
    const res = await gh(remoteUrl, 'PUT', {
      message: `docs: 发布文章 ${fileName}`,
      content: Buffer.from(body.content || '', 'utf8').toString('base64'),
      branch: BRANCH,
    });
    if (!res.ok) {
      return NextResponse.json({ error: `GitHub 创建失败：${res.message}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true, fileName });
  }

  if (action === 'update') {
    const getRes = await gh(remoteUrl, 'GET');
    if (!getRes.ok) {
      return NextResponse.json({ error: `未找到已有文件：${getRes.message}` }, { status: 404 });
    }
    const res = await gh(remoteUrl, 'PUT', {
      message: `docs: 更新文章 ${fileName}`,
      content: Buffer.from(body.content || '', 'utf8').toString('base64'),
      sha: getRes.data.sha,
      branch: BRANCH,
    });
    if (!res.ok) {
      return NextResponse.json({ error: `GitHub 更新失败：${res.message}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true, fileName });
  }

  if (action === 'delete') {
    const getRes = await gh(remoteUrl, 'GET');
    if (!getRes.ok) {
      return NextResponse.json({ error: `未找到文件：${getRes.message}` }, { status: 404 });
    }
    const res = await gh(remoteUrl, 'DELETE', {
      message: `docs: 删除文章 ${fileName}`,
      sha: getRes.data.sha,
      branch: BRANCH,
    });
    if (!res.ok) {
      return NextResponse.json({ error: `GitHub 删除失败：${res.message}` }, { status: 500 });
    }
    return NextResponse.json({ ok: true, fileName });
  }

  return NextResponse.json({ error: `未知操作：${action}` }, { status: 400 });
}
