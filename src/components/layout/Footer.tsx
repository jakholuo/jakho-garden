"use client";

import { Github } from "lucide-react";
import dynamic from "next/dynamic";

const GA = dynamic(() => import("../GA"), { ssr: false });
export default function Footer() {
  return (
    <footer>
      <GA />
      <a
        className="flex gap-1 justify-center items-center text-muted-foreground text-sm pb-6 hover:text-primary cursor-pointer"
        href="https://github.com/jakholuo/jakho-garden"
        target="_blank"
        rel="noopener noreferrer"
      >
        本站源码已在 <Github className="w-4 h-4" /> 开源
      </a>
    </footer>
  );
}
