import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getPostBySlug } from "@/lib/posts";
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';
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
    <main className="min-h-screen bg-[#0a0a0a] bg-[url('https://www.transparenttextures.com/patterns/black-lozenge.png')]">
      <article className="container mx-auto p-4 max-w-3xl bg-[url('https://www.transparenttextures.com/patterns/black-paper.png')]"> 
        <div className="text-center">
          <h1 className="text-4xl font-bold">{post.metadata.title}</h1>
          <div className="mt-4 text-foreground/60">
            <time>{post.metadata.date}</time>
          </div>
        </div>
        <div 
          className="mt-8 prose prose-zinc dark:prose-invert mx-auto"
          dangerouslySetInnerHTML={{ __html: contentHtml }}
        />
      </article>
    </main>
  );
}