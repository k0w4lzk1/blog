import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getPostBySlug } from "@/lib/posts";
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
import Image from 'next/image';
import Link from 'next/link';
import 'highlight.js/styles/github-dark.css';

export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  const processedContent = await remark()
    .use(remarkRehype)
    .use(rehypeHighlight)
    .use(rehypeStringify)
    .process(post.content);
  const contentHtml = processedContent.toString();

  return (
    <main className="min-h-screen bg-[#0a0a0a] bg-[url('https://www.transparenttextures.com/patterns/black-lozenge.png')] p-4">
      {/* Back button */}
      <div className="container mx-auto max-w-4xl mb-6">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors duration-300"
        >
          ← Back to Blog
        </Link>
      </div>

      <article className="container mx-auto max-w-4xl bg-[#111111] rounded-xl shadow-2xl border border-[#222222] overflow-hidden">
        {/* Hero section with image */}
        {post.metadata.image && (
          <div className="h-[500px] relative">
            <Image
              src={post.metadata.image}
              alt={post.metadata.title}
              fill
              className="object-contained rounded-t-xl"
              priority
            />
            <div className="absolute inset-0 bg-black/40" />
          </div>
        )}

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="text-center">
            {/* Metadata badges */}
            <div className="flex items-center justify-center gap-4 mb-3">
              <time className="text-foreground/60 text-sm">
                {post.metadata.date}
              </time>
              {post.metadata.CTF && (
                <span className="px-3 py-1 bg-blue-600 text-blue-100 text-sm font-medium rounded-full">
                  {post.metadata.CTF}
                </span>
              )}
              <span className="text-foreground/60 text-sm">
                {post.metadata.read} min read
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold mb-3 text-white">
              {post.metadata.title}
            </h1>
            
            {post.metadata.description && (
              <p className="text-lg text-foreground/80 max-w-3xl mx-auto leading-relaxed">
                {post.metadata.description}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          <div
            className="prose prose-zinc dark:prose-invert prose-lg mx-auto max-w-none
                       prose-headings:text-white prose-headings:font-bold
                       prose-p:text-foreground/90 prose-p:leading-relaxed
                       prose-a:text-blue-400 prose-a:no-underline hover:prose-a:text-blue-300
                       prose-code:text-blue-300 prose-code:bg-[#1a1a1a] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
                       prose-pre:bg-[#0d1117] prose-pre:border prose-pre:border-[#21262d]
                       prose-blockquote:border-l-blue-400 prose-blockquote:bg-[#1a1a1a] prose-blockquote:px-4 prose-blockquote:py-2 prose-blockquote:rounded-r
                       prose-img:rounded-lg prose-img:border prose-img:border-[#222222]
                       prose-table:text-sm
                       prose-th:bg-[#1a1a1a] prose-th:text-white
                       prose-td:border-[#222222]
                       prose-hr:border-[#333333]"
            dangerouslySetInnerHTML={{ __html: contentHtml }}
          />
        </div>
      </article>

      {/* Navigation or related posts could go here */}
      <div className="container mx-auto max-w-4xl mt-8 text-center">
        <Link 
          href="/blog" 
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors duration-300"
        >
          ← Back to All Posts
        </Link>
      </div>
    </main>
  );
}