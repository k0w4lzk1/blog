import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container mx-auto p-4">
      <h1 className="text-4xl font-bold">Welcome to My Blog</h1>
      <p className="mt-4">Check out my latest thoughts and writings!</p>
      <Link 
        href="/blog" 
        className="mt-6 inline-block px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90"
      >
        View Blog Posts
      </Link>
    </main>
  );
}