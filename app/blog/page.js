import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen bg-[#0a0a0a] bg-[url('https://www.transparenttextures.com/patterns/crissxcross.png')]">
      <div className="max-w-6xl mx-auto p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2 text-white">Blog</h1>
          <p className="text-foreground/60">Just a place where i put things down</p>
        </div>

        {/* Featured Post */}
        {posts[0] && (
          <div className="mb-16">
            <Link
              href={`/blog/${posts[0].slug}`}
              className="group block overflow-hidden rounded-xl bg-[#111111] border border-[#222222] hover:border-[#333333] transition-all duration-300"
            >
              <div className="grid md:grid-cols-2 gap-0">
                <div className="h-[400px] relative overflow-hidden">
                  {posts[0].image ? (
                    <Image
                      src={posts[0].image}
                      alt={posts[0].title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      priority
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
                  )}
                  {/* Overlay for better text readability */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                <div className="p-8 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-sm text-blue-400 font-medium uppercase tracking-wide">
                        {posts[0].CTF || 'Featured'}
                      </span>
                      <span className="text-sm text-foreground/60">{posts[0].date}</span>
                    </div>
                    <h2 className="text-3xl font-bold mb-4 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                      {posts[0].title}
                    </h2>
                    <p className="text-foreground/80 leading-relaxed line-clamp-3">
                      {posts[0].description}
                    </p>
                  </div>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-sm text-foreground/60">{posts[0].read} min read</span>
                    <span className="text-blue-400 group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* All Posts Grid */}
        <section>
          <h2 className="text-2xl font-semibold mb-8 text-white">All Posts</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                href={`/blog/${post.slug}`}
                key={post.slug}
                className="group block overflow-hidden rounded-xl bg-[#111111] border border-[#222222] hover:border-[#333333] transition-all duration-300 hover:transform hover:scale-[1.02]"
              >
                <div className="h-[200px] relative overflow-hidden">
                  {post.image ? (
                    <Image
                      src={post.image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-gray-700 to-gray-900" />
                  )}
                  {/* Consistent overlay */}
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors duration-300" />
                </div>
                
                <div className="p-6">
                  <div className="flex items-center gap-2 mb-2">
                    {post.CTF && (
                      <span className="text-xs text-blue-400 font-medium uppercase tracking-wide">
                        {post.CTF}
                      </span>
                    )}
                    <span className="text-xs text-foreground/60">{post.date}</span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2 group-hover:text-blue-400 transition-colors duration-300 line-clamp-2">
                    {post.title}
                  </h3>
                  
                  <p className="text-sm text-foreground/80 mb-4 line-clamp-3">
                    {post.description}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-foreground/60">{post.read} min read</span>
                    <span className="text-blue-400 group-hover:translate-x-1 transition-transform duration-300">
                      →
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}