import Image from "next/image";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Blog</h1>
          <p className="text-foreground/60">Compiled notes from the team</p>
        </div>

        {/* Featured Post */}
        <div className="mb-16">
          <Link 
            href={`/blog/${posts[0]?.slug}`}
            className="group block overflow-hidden rounded-xl bg-[#111111] border border-[#222222]"
          >
            <div className="grid md:grid-cols-2 gap-4">
              <div className="h-[500px] relative rounded-l-xl overflow-hidden md:col-span-1">
                {posts[0]?.image ? (
                  <Image
                    src={posts[0].image}
                    alt={posts[0].title}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
                )}
              </div>
              <div className="p-8 md:col-span-1">
                <span className="text-sm text-foreground/60 uppercase">{posts[0]?.date}</span>
                <h2 className="text-3xl font-bold mt-2 group-hover:text-blue-400">{posts[0]?.title}</h2>
                <p className="mt-4 text-foreground/80">{posts[0]?.description}</p>
                <div className="mt-6 flex items-center">
                  <span className="text-sm text-foreground/60">{posts[0]?.read} minutes read</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Featured Section */}
        {/* <section className="mb-16">
  <h2 className="text-xl font-semibold mb-4">Latest Posts</h2>
  <div className="grid md:grid-cols-2 gap-6">
    {posts.slice(1, 3).map((post) => (
      <Link 
        href={`/blog/${post.slug}`} 
        key={post.slug}
        className="group block rounded-xl bg-[#111111] border border-[#222222] overflow-hidden"
      >
        <div className="h-[200px] bg-gradient-to-r from-blue-500 to-purple-500 relative">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="p-6">
          <span className="text-sm text-foreground/60">{post.date}</span>
          <h3 className="text-2xl font-bold mt-2 group-hover:text-blue-400">{post.title}</h3>
          <div 
            className="mt-2 text-sm text-foreground/80 prose prose-sm prose-invert"
            dangerouslySetInnerHTML={{ __html: `${post.content.slice(0, 150)}...` }} 
          />
          <div className="mt-4 flex items-center">
            <span className="text-sm text-foreground/60">{post.read} minutes read</span>
          </div>
        </div>
      </Link>
    ))}
  </div>
</section> */}
        {/* All Posts Section */}
        <section>
  <h2 className="text-xl font-semibold mb-4">All Posts</h2>
  <div className="grid md:grid-cols-3 gap-6">
    {posts.map((post) => (
      <Link 
        href={`/blog/${post.slug}`} 
        key={post.slug}
        className="group block rounded-xl bg-[#111111] border border-[#222222] overflow-hidden"
      >
        <div className="h-[250px] bg-gradient-to-r from-green-500 to-blue-500 relative">
          <Image
            src={post.image}
            alt={post.title}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover"
            priority
          />
        </div>
        <div className="p-6">
          <span className="text-sm text-foreground/60">{post.date}</span>
          <h3 className="text-xl font-bold mt-2 group-hover:text-blue-400">{post.title}</h3>
          <div 
            className="mt-2 text-sm text-foreground/80 prose prose-sm prose-invert"
            dangerouslySetInnerHTML={{ __html: `${post.content.slice(0, 150)}...` }} 
          />
          <div className="mt-4 flex items-center">
            <span className="text-sm text-foreground/60">{post.read} minutes read</span>
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