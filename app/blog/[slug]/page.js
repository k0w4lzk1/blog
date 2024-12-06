import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { getPostBySlug } from "@/lib/posts";
import { remark } from 'remark';
import html from 'remark-html';

export default async function BlogPostPage({ params }) {
  const post = await getPostBySlug(params.slug);
  const processedContent = await remark()
    .use(html)
    .process(post.content);
  const contentHtml = processedContent.toString();

  return (
    <article className="container mx-auto p-4">
      <h1 className="text-4xl font-bold">{post.metadata.title}</h1>
      <div className="mt-4 text-foreground/60">
        <time>{post.metadata.date}</time>
      </div>
      <div 
        className="mt-8 prose prose-zinc dark:prose-invert"
        dangerouslySetInnerHTML={{ __html: contentHtml }}
      />
    </article>
  );
} 