import Link from "next/link";
import { TransitionLink } from "../utils/transition";

export default function Navigation() {
  return (
    <nav className="bg-[#000000] border-b border-[#222222]">
      <div className="max-w-5xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <TransitionLink href="/" className="text-xl font-bold">
              k0w4lzk1
            </TransitionLink>
          </div>
          <div className="flex space-x-4">
            <TransitionLink 
              href="/" 
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              Home
            </TransitionLink>
            <TransitionLink 
              href="/blog" 
              className="text-foreground/60 hover:text-foreground transition-colors"
            >
              Blog
            </TransitionLink>
          </div>
        </div>
      </div>
    </nav>
  );
}