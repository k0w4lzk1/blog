'use client'

import { useRouter } from "next/navigation";
import Link from "next/link";
async function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  
export const TransitionLink = ({
    children,
    href,
    ...props
  }) => {
  const router = useRouter();
  const handleTransition = async (e) => {
    e.preventDefault();
    const body = document.querySelector("body");
    body?.classList.add("page-transition");
    await sleep(500);
    router.push(href);
    await sleep(500);
    body?.classList.remove("page-transition");
  }

  return (
    <Link href={href} onClick={handleTransition} {...props} className="font-[var(--font-geist-mono)] text-2xl font-bold">
      {children}
    </Link>
  );
}