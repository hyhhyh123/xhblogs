import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';
import Comments from '../../components/Comments';
import { siteConfig } from '../../siteConfig';

export const metadata = {
  title: `留言板 | ${siteConfig.title}`,
  description: '欢迎在留言板留下你的足迹与想法',
};

export default function GuestbookPage() {
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-[95%] md:w-[90%] max-w-4xl mx-auto mt-24 md:mt-28 relative z-10 pb-10">
          {/* 页头 */}
          <header className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
              留言板
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-500 dark:text-slate-400 font-medium italic">
              任何想说的话，都可以留在这里 ✍️
            </p>
          </header>

          {/* 评论区（Giscus 基于 GitHub Discussions，按 /guestbook 路径独立归档） */}
          <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-5 md:p-8">
            <Comments />
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
