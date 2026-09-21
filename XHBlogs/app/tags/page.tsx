import Link from 'next/link';

import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import { siteConfig } from '../../siteConfig';
import { getAllPosts, getAllTags } from '../../lib/posts';

export const metadata = {
  title: `标签云 | ${siteConfig.title}`,
  description: '按标签浏览博客的全部文章',
};

/** 根据标签出现次数决定 chip 的大小与配色 */
function chipClass(count: number) {
  if (count >= 3) {
    return 'text-base md:text-lg px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:scale-105';
  }
  if (count === 2) {
    return 'text-sm md:text-base px-4 py-2 bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-500/20 hover:bg-indigo-200 dark:hover:bg-indigo-500/30 hover:scale-105';
  }
  return 'text-xs md:text-sm px-3 py-1.5 bg-white/60 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 border border-white/40 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-slate-700/60 hover:text-indigo-500 dark:hover:text-indigo-300 hover:scale-105';
}

export default function TagsPage() {
  const tags = getAllTags();
  const postCount = getAllPosts().length;

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10 pb-10">
          <header className="mb-8">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              标签云
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400">
              共 {postCount} 篇文章 · {tags.length} 个标签
            </p>
          </header>

          {tags.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-12 text-center text-slate-500 dark:text-slate-400">
              还没有标签，快去给文章加上 tags 吧 🏷️
            </div>
          ) : (
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-6 md:p-10">
              <div className="flex flex-wrap items-center gap-3 md:gap-4">
                {tags.map(({ tag, count }) => (
                  <Link
                    key={tag}
                    href={`/tags/${encodeURIComponent(tag)}`}
                    className={`inline-flex items-center gap-1.5 rounded-full font-bold transition-all duration-300 ${chipClass(count)}`}
                  >
                    {tag}
                    <span className="opacity-70 text-[0.85em]">{count}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
