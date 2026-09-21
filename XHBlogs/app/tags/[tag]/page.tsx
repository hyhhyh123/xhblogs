import Link from 'next/link';

import Navbar from '../../../components/Navbar';
import PageTransition from '../../../components/PageTransition';
import BackButton from '../../../components/BackButton';
import { siteConfig } from '../../../siteConfig';
import { getAllTags, getPostsByTag } from '../../../lib/posts';

function formatDate(dateStr: string) {
  if (!dateStr || dateStr === '1970-01-01') return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}

export async function generateStaticParams() {
  return getAllTags().map(({ tag }) => ({ tag }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  return {
    title: `「${decoded}」标签下的文章 | ${siteConfig.title}`,
    description: `标签「${decoded}」下的全部文章`,
  };
}

export default async function TagPage({ params }: { params: Promise<{ tag: string }> }) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const posts = getPostsByTag(decoded);

  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10 pb-10">
          <div className="relative mb-8">
            <BackButton />
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight mt-4">
              <span className="text-indigo-500 dark:text-indigo-400">「{decoded}」</span>
            </h1>
            <p className="mt-2 text-sm md:text-base text-slate-500 dark:text-slate-400">
              共 {posts.length} 篇文章 ·
              <Link href="/tags" className="text-indigo-500 hover:underline ml-1">
                标签云
              </Link>
            </p>
          </div>

          {posts.length === 0 ? (
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-12 text-center text-slate-500 dark:text-slate-400">
              该标签下暂无文章
            </div>
          ) : (
            <main className="flex flex-col gap-4">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="group flex flex-col gap-2 p-5 md:p-6 bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-500"
                >
                  <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg md:text-xl font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors line-clamp-1">
                      {post.title}
                    </h2>
                    <span className="shrink-0 text-xs text-slate-400 dark:text-slate-500 font-medium">
                      {formatDate(post.date)}
                    </span>
                  </div>
                  {post.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {post.description}
                    </p>
                  )}
                </Link>
              ))}
            </main>
          )}
        </div>
      </PageTransition>
    </div>
  );
}
