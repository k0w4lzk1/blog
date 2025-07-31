import Link from "next/link";
import { TransitionLink } from "./utils/transition";
import Footer from "./components/Footer";
import Navigation from "./components/navigation";

export default function HomePage() {
  return (
    <div className="flex flex-col bg-neutral-800 min-h-screen">
      <main className="flex-grow container mx-auto p-4">
        <h1 className="text-4xl font-bold">Welcome to My Blog</h1>
        <p className="mt-4">Check out my latest thoughts and writings!</p>
        <TransitionLink 
          href="/blog" 
          className="mt-6 inline-block px-4 py-2 bg-foreground text-background rounded-md hover:opacity-90"
        >
          View Blog Posts
        </TransitionLink>
      </main>
      <Footer className="mt-auto" />
    </div>
  );
}