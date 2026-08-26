import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import Link from 'next/link';
import { siteConfig } from '../../siteConfig';
import { searchPosts } from '../../lib/posts';

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === '1970-01-01') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

/** 关键词高亮（服务端安全，纯函数无副作用） */
function HighlightText({ text = '', query = '' }: { text?: string; query?: string }) {
  if (!query.trim() || !text) return <>{text}</>;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escaped})`, 'gi');
  const parts = String(text).split(regex);

  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-300 dark:bg-yellow-500/80 text-slate-900 dark:text-white px-1 mx-[1px] rounded-[4px] shadow-sm font-bold"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q.trim() : '';
  return {
    title: q ? `搜索「${q}」 | ${siteConfig.title}` : `搜索 | ${siteConfig.title}`,
    description: '全站全文搜索：标题、描述、标签与正文内容',
  };
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const params = await searchParams;
  const rawQuery = typeof params.q === 'string' ? params.q.trim() : '';
  const query = decodeURIComponent(rawQuery);
  const results = query ? searchPosts(query) : [];

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10 pb-10">
          {/* 搜索框 */}
          <header className="mb-8">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-6">
              搜索
            </h1>
            <form action="/search" className="relative group">
              <input
                type="text"
                name="q"
                defaultValue={query}
                placeholder="搜索标题、描述、标签或正文..."
                autoFocus
                autoComplete="off"
                spellCheck={false}
                className="w-full pl-14 pr-6 py-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-3xl shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-800 dark:text-slate-200 transition-all placeholder-slate-500 dark:placeholder-slate-400 font-medium text-lg relative z-0"
              />
              <button
                type="submit"
                aria-label="搜索"
                className="absolute inset-y-0 left-0 pl-5 flex items-center cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-500 transition-colors drop-shadow-sm"
                >
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </form>
          </header>

          {/* 结果区 */}
          {!query ? (
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-14 text-center text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-4">🔍</div>
              输入关键词，搜索标题、描述、标签与正文内容
            </div>
          ) : results.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-14 text-center text-slate-500 dark:text-slate-400">
              <div className="text-4xl mb-4">🕵️</div>
              没有找到与
              <span className="text-indigo-500 dark:text-indigo-400 font-bold mx-1">「{query}」</span>
              相关的内容，换个关键词试试？
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">
                找到 <span className="text-indigo-500 font-black">{results.length}</span> 篇相关文章
              </p>
              <main className="flex flex-col gap-4">
                {results.map(({ post, snippet }) => (
                  <Link
                    key={post.slug}
                    href={`/posts/${post.slug}`}
                    className="group flex flex-col gap-2 p-5 md:p-6 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 hover:shadow-2xl hover:-translate-y-0.5 hover:bg-indigo-50/60 dark:hover:bg-indigo-500/10 transition-all duration-500"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                        <HighlightText text={post.title} query={query} />
                      </h2>
                      <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 font-medium">
                        {formatDate(post.date)}
                      </span>
                    </div>

                    {snippet && (
                      <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-3 leading-relaxed">
                        <HighlightText text={snippet} query={query} />
                      </p>
                    )}

                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {post.tags.map((t) => (
                          <span
                            key={t}
                            className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-500 dark:bg-indigo-500/15 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-500/20"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                ))}
              </main>
            </>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
