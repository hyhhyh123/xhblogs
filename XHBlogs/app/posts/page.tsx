import Link from 'next/link';

import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import { getAllPosts, getAllTags, getPostsByTag, POSTS_PER_PAGE } from '../../lib/posts';

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === '1970-01-01') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ tag?: string }> }) {
  const params = await searchParams;
  const tag = typeof params.tag === 'string' && params.tag ? decodeURIComponent(params.tag) : '';
  return {
    title: tag ? `「${tag}」的文章 | ${siteConfig.title}` : `全部文章 | ${siteConfig.title}`,
    description: tag ? `查看标签「${tag}」下的全部文章` : '博客的全部文章列表',
  };
}

export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tag?: string }>;
}) {
  const params = await searchParams;
  const tag = typeof params.tag === 'string' && params.tag ? decodeURIComponent(params.tag) : '';
  const allTags = getAllTags();
  const filtered = tag ? getPostsByTag(tag) : getAllPosts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / POSTS_PER_PAGE));
  const page = Math.min(Math.max(1, parseInt(params.page || '1', 10) || 1), totalPages);
  const posts = filtered.slice((page - 1) * POSTS_PER_PAGE, page * POSTS_PER_PAGE);

  const pageUrl = (p: number) =>
    tag ? `/posts?tag=${encodeURIComponent(tag)}&page=${p}` : `/posts?page=${p}`;

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10 pb-10">
          {/* 页头 */}
          <header className="mb-6">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {tag ? (
                <>
                  <span className="text-indigo-500 dark:text-indigo-400">「{tag}」</span> 的文章
                </>
              ) : (
                '全部文章'
              )}
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400">
              共 {filtered.length} 篇 ·{' '}
              <Link href="/tags" className="text-indigo-500 hover:underline">
                标签云
              </Link>
            </p>
          </header>

          {/* 标签过滤行 */}
          <div className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/posts"
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                !tag
                  ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                  : 'bg-white/60 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-slate-700/60'
              }`}
            >
              全部
            </Link>
            {allTags.map(({ tag: t, count }) => (
              <Link
                key={t}
                href={`/posts?tag=${encodeURIComponent(t)}`}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-300 border ${
                  tag === t
                    ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                    : 'bg-white/60 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-white/40 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-slate-700/60'
                }`}
              >
                {t} <span className="opacity-60">{count}</span>
              </Link>
            ))}
          </div>

          {/* 文章列表 */}
          {posts.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-12 text-center text-slate-500 dark:text-slate-400">
              该分类下暂无文章，去写一篇吧 ✍️
            </div>
          ) : (
            <main className="flex flex-col gap-5">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="group flex flex-col sm:flex-row gap-5 p-5 md:p-6 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500 overflow-hidden"
                >
                  {post.cover && (
                    <div className="w-full sm:w-56 md:w-64 aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden shrink-0 bg-slate-200 dark:bg-slate-700 relative">
                      <img
                        src={post.cover}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  )}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-2.5 py-1">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {post.title}
                    </h2>
                    {post.description && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                        {post.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {formatDate(post.date)}
                      </span>
                      {post.tags.map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              ))}
            </main>
          )}

          {/* 分页 */}
          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-3 mt-10">
              <Link
                href={pageUrl(Math.max(1, page - 1))}
                aria-disabled={page <= 1}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border ${
                  page <= 1
                    ? 'opacity-40 pointer-events-none bg-white/40 dark:bg-slate-800/30 text-slate-500 border-white/30 dark:border-white/5'
                    : 'bg-white/60 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-white/40 dark:border-white/10 hover:bg-indigo-500 hover:text-white hover:border-indigo-500'
                }`}
              >
                ← 上一页
              </Link>
              <span className="px-4 py-2 text-sm font-bold text-slate-500 dark:text-slate-400">
                {page} / {totalPages}
              </span>
              <Link
                href={pageUrl(Math.min(totalPages, page + 1))}
                aria-disabled={page >= totalPages}
                className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-300 border ${
                  page >= totalPages
                    ? 'opacity-40 pointer-events-none bg-white/40 dark:bg-slate-800/30 text-slate-500 border-white/30 dark:border-white/5'
                    : 'bg-white/60 dark:bg-slate-800/50 text-slate-700 dark:text-slate-200 border-white/40 dark:border-white/10 hover:bg-indigo-500 hover:text-white hover:border-indigo-500'
                }`}
              >
                下一页 →
              </Link>
            </nav>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
