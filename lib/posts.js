import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { remark } from 'remark';
import remarkRehype from 'remark-rehype';
import rehypeStringify from 'rehype-stringify';
import rehypeHighlight from 'rehype-highlight';

const postsDirectory = path.join(process.cwd(), "posts");

export async function getAllPosts() {
  const fileNames = fs.readdirSync(postsDirectory);
  const posts = await Promise.all(fileNames.map(async (fileName) => {
    const slug = fileName.replace(/\.md$/, "");
    const filePath = path.join(postsDirectory, fileName);
    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data, content } = matter(fileContents);
    
    // Process the content to HTML with syntax highlighting
    const processedContent = await remark()
      .use(remarkRehype)
      .use(rehypeHighlight)
      .use(rehypeStringify)
      .process(content);
    const contentHtml = processedContent.toString();

    return {
      slug,
      title: data.title || slug,
      image: data.image,
      content: contentHtml,
      ...data
    };
  }));
  return posts;
}

export function getPostBySlug(slug) {
  const filePath = path.join(postsDirectory, `${slug}.md`);
  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  return {
    slug,
    metadata: {
      title: data.title || slug, 
      ...data
    },
    content,
  };
}