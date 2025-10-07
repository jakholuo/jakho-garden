"use client";

import { useRouter } from "next/navigation";
import { TagIcon } from "lucide-react";
import { TagCloud as CustomTagCloud } from "react-tagcloud";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

interface TagCount {
  name: string;
  count: number;
  size?: string;
}

interface TagCloudProps {
  tags: TagCount[];
}

export default function TagCloud({ tags }: TagCloudProps) {
  const router = useRouter();
  const tagCloudRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  const luminosity = resolvedTheme === "dark" ? "light" : "dark";

  useEffect(() => {
    const el = tagCloudRef.current;
    if (!el) return;

    const handleClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target?.dataset.tag) {
        router.push(`/tags/${encodeURIComponent(target.dataset.tag)}`);
      }
    };

    el.addEventListener("click", handleClick);

    // 清理函数使用局部变量 el，避免 ref.current 变化导致的问题
    return () => {
      el.removeEventListener("click", handleClick);
    };
  }, [router]); // router 是 stable 的，但最好保留在依赖数组

  if (tags.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <TagIcon className="h-12 w-12 text-muted-foreground" />
        <p className="mt-4 text-muted-foreground italic">暂无标签</p>
      </div>
    );
  }

  return (
    <div className="w-full" ref={tagCloudRef}>
      <CustomTagCloud
        minSize={12}
        maxSize={35}
        tags={tags.map((item) => ({
          value: item.name,
          count: item.count,
        }))}
        colorOptions={{ luminosity }}
        className="simple-cloud"
        renderer={(tag, size, color) => (
          <div
            key={tag.key || tag.value}
            data-tag={tag.value}
            style={{
              fontSize: size,
              color,
              display: "inline-block",
              margin: "4px",
              transition: "all 0.2s",
            }}
            className="hover:font-bold hover:cursor-pointer"
          >
            {tag.value}
          </div>
        )}
      />
    </div>
  );
}
