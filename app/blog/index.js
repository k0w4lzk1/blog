import Link from "next/link";
import { getAllPosts } from "../../lib/posts";

export default function BlogList() {
  const posts = getAllPosts();
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-3xl font-bold">Blog Posts</h1>
      <ul className="mt-4">
        {posts.map((post) => (
          <li key={post.slug} className="mt-2">
            <Link 
              href={`/blog/${post.slug}`} 
              className="text-blue-500 hover:underline"
            >
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="text-sm text-gray-600">{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}