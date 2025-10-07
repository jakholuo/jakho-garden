"use client";

import Link from "next/link";
import { SearchResultItem } from "@/lib/api";
import { useState } from "react";

interface SearchResultCardProps {
  result: SearchResultItem;
  keyword: string;
}

export default function SearchResultCard({
  result,
  keyword,
}: SearchResultCardProps) {
  const { post, matches } = result;
  const [showExcerpt] = useState(true);

  // 高亮关键词
  const highlightKeyword = (text: string, keyword: string) => {
    if (!keyword.trim()) return text;

    try {
      const parts = text.split(new RegExp(`(${keyword})`, "gi"));
      return (
        <>
          {parts.map((part, i) =>
            part.toLowerCase() === keyword.toLowerCase() ? (
              <mark key={i} className="bg-highlight-yellow px-0.5 rounded">
                {part}
              </mark>
            ) : (
              part
            )
          )}
        </>
      );
    } catch {
      // 如果正则表达式出错，直接返回原文本
      return text;
    }
  };

  return (
    <article className="border border-border rounded-lg p-6 hover:shadow-md transition-shadow bg-card">
      <Link href={`/${post.id}`}>
        <h3 className="text-xl font-semibold mb-2 text-card-foreground hover:text-primary transition-colors">
          {matches.title ? highlightKeyword(post.title, keyword) : post.title}
        </h3>
      </Link>

      <p className="text-muted-foreground text-sm mb-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 inline-block mr-1 align-[-2px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {new Date(post.date).toLocaleDateString("zh-CN", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </p>

      {/* 描述或摘要 */}
      {matches.content.matched && matches.content.excerpt && showExcerpt ? (
        <p className="text-card-foreground mb-4">
          {highlightKeyword(matches.content.excerpt, keyword)}
        </p>
      ) : (
        <p className="text-card-foreground mb-4">
          {matches.description
            ? highlightKeyword(post.description, keyword)
            : post.description}
        </p>
      )}

      {/* 匹配信息 */}
      <div className="mb-4 text-sm">
        <p className="text-muted-foreground">
          匹配位置:
          <span className="space-x-2 ml-2">
            {matches.title && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-highlight-blue text-blue-800 text-xs">
                标题
              </span>
            )}
            {matches.description && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-highlight-green text-green-800 text-xs">
                描述
              </span>
            )}
            {matches.content.matched && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-highlight-purple text-purple-800 text-xs">
                内容
              </span>
            )}
            {matches.tags.length > 0 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-highlight-red text-red-800 text-xs">
                标签
              </span>
            )}
          </span>
        </p>
      </div>

      {/* 匹配标签 */}
      <div className="flex flex-wrap gap-2">
        {post.tags.map((tag: string) => {
          const isMatched = matches.tags.includes(tag);
          return (
            <Link
              key={tag}
              href={`/tags/${encodeURIComponent(tag)}`}
              className={`${
                isMatched
                  ? "bg-highlight-red text-red-800"
                  : "bg-muted hover:bg-accent text-muted-foreground"
              } px-2 py-1 rounded-md text-xs transition-colors`}
            >
              {isMatched ? highlightKeyword(tag, keyword) : tag}
            </Link>
          );
        })}
      </div>
    </article>
  );
}
