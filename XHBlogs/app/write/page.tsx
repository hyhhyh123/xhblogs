"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from 'react';

import Navbar from '../../components/Navbar';
import PageTransition from '../../components/PageTransition';

// Markdown 预览渲染链
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import remarkRehype from 'remark-rehype';
import rehypeHighlight from 'rehype-highlight';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import 'highlight.js/styles/atom-one-dark.css';
import 'katex/dist/katex.min.css';

// Markdown 工具栏图标
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Link2,
  Image,
  Code,
  CodeXml,
  Sigma,
  Table,
  Minus,
} from 'lucide-react';

interface PostItem {
  slug: string;
  title: string;
  date: string;
  description: string;
  tags: string[];
  cover: string;
  content: string;
}

interface StatusMsg {
  type: 'ok' | 'err';
  text: string;
}

const SESSION_KEY = 'wb-write-pw';
const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function pad(n: number) {
  return String(n).padStart(2, '0');
}

function nowLocal() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultSlug() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-new-post`;
}

async function renderMd(md: string): Promise<string> {
  if (!md.trim()) return '';
  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, { allowDangerousHtml: true })
    // @ts-ignore
    .use(rehypeHighlight, { ignoreMissing: true })
    .use(rehypeKatex)
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(md);
  return file.toString();
}

export default function WritePage() {
  const [password, setPassword] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [items, setItems] = useState<PostItem[]>([]);

  const [editing, setEditing] = useState(''); // '' = 新建
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(nowLocal());
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [cover, setCover] = useState('');
  const [content, setContent] = useState('');
  const [tab, setTab] = useState<'edit' | 'preview'>('edit');
  const [previewHtml, setPreviewHtml] = useState('');

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<StatusMsg | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const flash = (type: StatusMsg['type'], text: string) => {
    setMsg({ type, text });
    window.setTimeout(() => setMsg(null), 5000);
  };

  const apiCall = useCallback(
    async (body: Record<string, unknown>) => {
      const res = await fetch('/api/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, ...body }),
      });
      const data = await res.json().catch(() => ({}));
      return { ok: res.ok, data };
    },
    [password]
  );

  const loadList = useCallback(async () => {
    const { ok, data } = await apiCall({ action: 'list' });
    if (ok) setItems(data.items || []);
    return ok;
  }, [apiCall]);

  // 恢复会话
  useEffect(() => {
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) {
      setPassword(saved);
      setUnlocked(true);
      loadList();
    }
  }, [loadList]);

  // 实时预览
  useEffect(() => {
    let cancelled = false;
    renderMd(content).then((html) => {
      if (!cancelled) setPreviewHtml(html);
    });
    return () => {
      cancelled = true;
    };
  }, [content]);

  // ---------- 登录 ----------
  async function handleUnlock() {
    if (!password.trim()) {
      flash('err', '请输入密码');
      return;
    }
    setBusy(true);
    const { ok, data } = await apiCall({ action: 'list' });
    setBusy(false);
    if (ok) {
      setItems(data.items || []);
      setUnlocked(true);
      sessionStorage.setItem(SESSION_KEY, password);
      setSlug(defaultSlug());
      flash('ok', '解锁成功，开始写作 ✍️');
    } else {
      flash('err', data.error || '解锁失败');
    }
  }

  // ---------- 新建 / 选择 ----------
  function handleNew() {
    setEditing('');
    setTitle('');
    setDate(nowLocal());
    setSlug(defaultSlug());
    setDescription('');
    setTagsText('');
    setCover('');
    setContent('');
    setTab('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleSelect(item: PostItem) {
    setEditing(item.slug);
    setTitle(item.title);
    setDate(item.date ? item.date.replace(' ', 'T').slice(0, 16) : nowLocal());
    setSlug(item.slug);
    setDescription(item.description || '');
    setTagsText((item.tags || []).join(', '));
    setCover(item.cover || '');
    setContent(item.content || '');
    setTab('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---------- 组装 Markdown ----------
  function buildMd(): string {
    const lines = ['---'];
    lines.push(`title: "${title.replace(/"/g, '\\"')}"`);
    lines.push(`date: "${date.replace('T', ' ')}:00"`);
    if (description.trim()) lines.push(`description: "${description.replace(/"/g, '\\"')}"`);
    if (cover.trim()) lines.push(`cover: "${cover.replace(/"/g, '\\"')}"`);
    const tagList = tagsText
      .split(/[,，]/)
      .map((t) => t.trim())
      .filter(Boolean);
    if (tagList.length) lines.push(`tags: [${tagList.map((t) => `"${t}"`).join(', ')}]`);
    lines.push('---', '', content.trim());
    return lines.join('\n');
  }

  // ---------- 发布 / 删除 ----------
  async function handleSave() {
    if (!title.trim() || !content.trim()) {
      flash('err', '标题和正文不能为空');
      return;
    }
    const fileName = editing || slug.trim();
    if (!SLUG_RE.test(fileName)) {
      flash('err', '文件名仅允许小写字母、数字与连字符，如 2026-08-26-my-post');
      return;
    }
    setBusy(true);
    const md = buildMd();
    const action = editing ? 'update' : 'create';
    const { ok, data } = await apiCall({ action, slug: fileName, content: md });
    setBusy(false);
    if (ok) {
      setEditing(fileName);
      flash('ok', editing ? '更新成功，正在部署...' : '发布成功，正在部署...');
      loadList();
    } else {
      flash('err', data.error || '保存失败');
    }
  }

  async function handleDelete() {
    if (!editing) return;
    if (!window.confirm(`确定删除「${title}」吗？此操作不可恢复。`)) return;
    setBusy(true);
    const { ok, data } = await apiCall({ action: 'delete', slug: editing });
    setBusy(false);
    if (ok) {
      flash('ok', '已删除，正在部署...');
      handleNew();
      loadList();
    } else {
      flash('err', data.error || '删除失败');
    }
  }

  const inputCls =
    'w-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl border border-white/40 dark:border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder-slate-400 font-medium';

  // ---------- Markdown 工具栏 ----------
  function insertMd(
    kind: 'inline' | 'blockPrefix' | 'blockWrap' | 'raw',
    before: string,
    after = '',
    placeholder = ''
  ) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart ?? content.length;
    const end = ta.selectionEnd ?? content.length;
    const selected = content.slice(start, end);

    if (kind === 'blockPrefix' && !selected) {
      // 无选中：在当前行行首插入前缀
      const lineStart = content.lastIndexOf('\n', start - 1) + 1;
      const next = content.slice(0, lineStart) + before + content.slice(lineStart);
      setContent(next);
      requestAnimationFrame(() => {
        ta.focus();
        const pos = lineStart + before.length;
        ta.setSelectionRange(pos, pos);
      });
      return;
    }

    let insert = '';
    let cursorPos = start;

    if (kind === 'inline') {
      const sel = selected || placeholder;
      insert = `${before}${sel}${after}`;
      cursorPos = start + before.length + sel.length;
    } else if (kind === 'blockPrefix') {
      insert = selected
        .split('\n')
        .map((l) => before + l)
        .join('\n');
      cursorPos = start + insert.length;
    } else if (kind === 'blockWrap') {
      insert = `${before}\n${selected || placeholder}\n${after}`;
      cursorPos = start + before.length + 1 + (selected || placeholder).length;
    } else {
      insert = before;
      cursorPos = start + insert.length;
    }

    const next = content.slice(0, start) + insert + content.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursorPos, cursorPos);
    });
  }

  const mdTools: { title: string; icon: ReactNode; onClick: () => void }[] = [
    { title: '一级标题', icon: <Heading1 size={15} />, onClick: () => insertMd('blockPrefix', '# ') },
    { title: '二级标题', icon: <Heading2 size={15} />, onClick: () => insertMd('blockPrefix', '## ') },
    { title: '三级标题', icon: <Heading3 size={15} />, onClick: () => insertMd('blockPrefix', '### ') },
    { title: '加粗', icon: <Bold size={15} />, onClick: () => insertMd('inline', '**', '**', '加粗文字') },
    { title: '斜体', icon: <Italic size={15} />, onClick: () => insertMd('inline', '*', '*', '斜体文字') },
    { title: '删除线', icon: <Strikethrough size={15} />, onClick: () => insertMd('inline', '~~', '~~', '删除线') },
    { title: '无序列表', icon: <List size={15} />, onClick: () => insertMd('blockPrefix', '- ') },
    { title: '有序列表', icon: <ListOrdered size={15} />, onClick: () => insertMd('blockPrefix', '1. ') },
    { title: '任务列表', icon: <ListTodo size={15} />, onClick: () => insertMd('blockPrefix', '- [ ] ') },
    { title: '引用', icon: <Quote size={15} />, onClick: () => insertMd('blockPrefix', '> ') },
    { title: '行内代码', icon: <Code size={15} />, onClick: () => insertMd('inline', '`', '`', 'code') },
    { title: '代码块', icon: <CodeXml size={15} />, onClick: () => insertMd('blockWrap', '```js', '```', '// 在这里写代码') },
    { title: '链接', icon: <Link2 size={15} />, onClick: () => insertMd('inline', '[', '](https://)', '链接文字') },
    { title: '图片', icon: <Image size={15} />, onClick: () => insertMd('inline', '![', '](https://图片地址.png)', '图片说明') },
    { title: '行内公式', icon: <Sigma size={15} />, onClick: () => insertMd('inline', '$', '$', '公式') },
    { title: '公式块', icon: <Sigma size={15} />, onClick: () => insertMd('blockWrap', '$$', '$$', 'E = mc^2') },
    { title: '表格', icon: <Table size={15} />, onClick: () => insertMd('blockWrap', '| 列1 | 列2 |\n| --- | --- |', '', '| 内容 | 内容 |') },
    { title: '分割线', icon: <Minus size={15} />, onClick: () => insertMd('raw', '\n---\n') },
  ];

  // ==================== 未解锁 ====================
  if (!unlocked) {
    return (
      <div className="min-h-screen relative pb-20">
        <Navbar />
        <PageTransition>
          <div className="w-[95%] md:w-[90%] max-w-md mx-auto mt-28 md:mt-36 relative z-10">
            <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-8 md:p-10">
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5h6a2 2 0 012 2v7M11 5L5 11v6a2 2 0 002 2h8a2 2 0 002-2v-7m-6-5v5m0 0l-5 5" transform="translate(-1 1) scale(0.9)" /></svg>
                </div>
                <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">写作后台</h1>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">输入密码进入，密码仅保存在本次会话</p>
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                placeholder="请输入写作密码..."
                autoFocus
                className={inputCls}
              />
              <button
                onClick={handleUnlock}
                disabled={busy}
                className="mt-4 w-full py-3 rounded-xl text-sm font-black text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30"
              >
                {busy ? '验证中...' : '进入'}
              </button>

              {msg && (
                <p className={`mt-4 text-sm font-bold text-center ${msg.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
                  {msg.text}
                </p>
              )}
            </div>
          </div>
        </PageTransition>
      </div>
    );
  }

  // ==================== 已解锁 ====================
  return (
    <div className="min-h-screen relative pb-20">
      <Navbar />
      <PageTransition>
        <div className="w-[95%] md:w-[90%] max-w-6xl mx-auto mt-24 md:mt-28 relative z-10 pb-10">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* 左侧：文章列表 */}
            <aside className="w-full lg:w-64 shrink-0 flex flex-col gap-3">
              <button
                onClick={handleNew}
                className="py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 transition-all shadow-lg shadow-indigo-500/30"
              >
                + 新建文章
              </button>

              <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl border border-white/40 dark:border-white/10 p-3 flex-1 max-h-[70vh] overflow-y-auto">
                <h3 className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2 py-2">
                  文章列表（{items.length}）
                </h3>
                {items.length === 0 ? (
                  <p className="text-xs text-slate-400 dark:text-slate-500 px-2 py-4 text-center">暂无文章</p>
                ) : (
                  <div className="flex flex-col gap-1">
                    {items.map((item) => (
                      <button
                        key={item.slug}
                        onClick={() => handleSelect(item)}
                        className={`text-left px-3 py-2.5 rounded-xl transition-colors group ${
                          editing === item.slug
                            ? 'bg-indigo-500/10 dark:bg-indigo-500/20'
                            : 'hover:bg-indigo-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <span className={`block text-xs font-bold line-clamp-1 ${editing === item.slug ? 'text-indigo-600 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-200'}`}>
                          {item.title}
                        </span>
                        <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 font-mono">
                          {item.date?.split(' ')[0] || ''}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </aside>

            {/* 右侧：编辑器 */}
            <main className="flex-1 min-w-0 flex flex-col gap-4">
              {msg && (
                <div className={`px-4 py-3 rounded-2xl text-sm font-bold border backdrop-blur-xl ${
                  msg.type === 'ok'
                    ? 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/20'
                    : 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 border-rose-500/20'
                }`}>
                  {msg.text}
                </div>
              )}

              <div className="bg-white/60 dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 dark:border-white/10 p-5 md:p-6">
                {/* 元信息 */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">标题 *</label>
                    <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="文章标题" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">写作时间</label>
                    <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">
                      文件名（仅小写字母/数字/连字符）{editing && '· 编辑时锁定'}
                    </label>
                    <input
                      value={editing ? editing : slug}
                      readOnly={!!editing}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="2026-08-26-my-post"
                      className={`${inputCls} ${editing ? 'opacity-60' : ''} font-mono`}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">描述（摘要）</label>
                    <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="显示在文章卡片上的摘要" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">标签（逗号分隔）</label>
                    <input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="博客, 折腾, 生活" className={inputCls} />
                  </div>
                  <div>
                    <label className="block text-xs font-black text-slate-500 dark:text-slate-400 mb-1.5">封面图 URL（可选）</label>
                    <input value={cover} onChange={(e) => setCover(e.target.value)} placeholder="https://... 或 /xxx.png" className={inputCls} />
                  </div>
                </div>

                {/* 编辑 / 预览 tab */}
                <div className="flex items-center gap-2 mb-3">
                  {(['edit', 'preview'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all border ${
                        tab === t
                          ? 'bg-indigo-500 text-white border-indigo-500 shadow-lg shadow-indigo-500/30'
                          : 'bg-white/40 dark:bg-slate-800/40 text-slate-600 dark:text-slate-300 border-white/30 dark:border-white/10 hover:bg-indigo-50 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      {t === 'edit' ? '✏️ 编辑' : '👁 预览'}
                    </button>
                  ))}
                  {!editing && (
                    <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 font-medium">正文支持 Markdown、代码高亮与 KaTeX 公式</span>
                  )}
                </div>

                {tab === 'edit' ? (
                  <>
                    {/* Markdown 工具栏 */}
                    <div className="flex flex-wrap items-center gap-0.5 mb-3 px-2 py-1.5 rounded-xl bg-white/40 dark:bg-slate-900/40 border border-white/40 dark:border-white/10">
                      {mdTools.map((t) => (
                        <button
                          key={t.title}
                          type="button"
                          title={t.title}
                          onClick={t.onClick}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 dark:text-slate-400 hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors"
                        >
                          {t.icon}
                        </button>
                      ))}
                      <span className="ml-auto text-[10px] text-slate-400 dark:text-slate-500 hidden md:block pr-1">
                        选中文字后点按钮即可包裹语法
                      </span>
                    </div>
                    <textarea
                      ref={textareaRef}
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={'# 开始写作...\n\n支持 **加粗**、`代码`、```代码块```、$公式$、表格、任务列表等'}
                      className={`${inputCls} h-[420px] md:h-[480px] resize-y leading-relaxed font-mono text-[13px]`}
                      spellCheck={false}
                    />
                  </>
                ) : (
                  <div
                    className="prose prose-slate dark:prose-invert max-w-none h-[420px] md:h-[480px] overflow-y-auto bg-white/40 dark:bg-slate-900/40 rounded-xl border border-white/40 dark:border-white/10 p-5 text-slate-800 dark:text-slate-200"
                    dangerouslySetInnerHTML={{ __html: previewHtml || '<p class="text-slate-400">暂无内容</p>' }}
                  />
                )}
              </div>

              {/* 操作按钮 */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={busy}
                  className="px-6 py-3 rounded-2xl text-sm font-black text-white bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 disabled:opacity-50 transition-all shadow-lg shadow-indigo-500/30"
                >
                  {busy ? '提交中...' : editing ? '💾 更新文章' : '🚀 发布文章'}
                </button>
                {editing && (
                  <button
                    onClick={handleDelete}
                    disabled={busy}
                    className="px-5 py-3 rounded-2xl text-sm font-black text-rose-500 bg-white/40 dark:bg-slate-800/40 border border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50 transition-all"
                  >
                    🗑 删除
                  </button>
                )}
                <span className="ml-auto text-[11px] text-slate-400 dark:text-slate-500">
                  发布后自动推送到 GitHub 并触发 Vercel 部署
                </span>
              </div>
            </main>
          </div>
        </div>
      </PageTransition>
    </div>
  );
}
