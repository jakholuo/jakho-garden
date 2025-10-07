import { notFound } from "next/navigation";
import Link from "next/link";
import { getAllPostIds, getPostById } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import MarkdownContent from "@/components/article/md/MarkdownContent";
import ClientTableOfContents from "@/components/article/contents/TableOfContents";
import { Metadata } from "next";

export async function generateStaticParams() {
  // 预生成普通文章和隐藏文章
  const posts = await getAllPostIds();
  return posts.map((post) => ({
    slug: post.params.slug,
  }));
}

type Props = {
  params: Promise<{ slug: string }>;
};

// 动态生成元数据
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const post = await getPostById(slug);

    return {
      title: `${post.title} - ${process.env.NEXT_PUBLIC_SITE_NAME}'s Garden`,
      description: post.description,
      keywords: post.tags,
      // 禁止搜索引擎索引隐藏文章
      robots: post.isHidden ? "noindex, nofollow" : undefined,
    };
  } catch {
    return {
      title: `页面未找到 - ${process.env.NEXT_PUBLIC_SITE_NAME}'s Garden`,
    };
  }
}

// 异步组件
export default async function PostPost({ params }: Props) {
  try {
    // 获取文章数据
    const { slug } = await params;
    const post = await getPostById(slug);

    return (
      <PageContainer>
        <article className="prose prose-slate dark:prose-invert lg:prose-xl max-w-none">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">
              {post.isHidden && (
                <span className="inline-block bg-gray-500 text-white text-sm py-1 px-2 rounded mr-2 align-middle">
                  隐藏
                </span>
              )}
              {post.title}
            </h1>
            <p className="text-muted-foreground">
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
            <div className="flex flex-wrap gap-2 mt-4">
              {post.tags.map((tag: string) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="bg-muted hover:bg-muted/80 text-muted-foreground px-2 py-1 rounded-md text-xs transition-colors no-underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </header>

          <div className="markdown-content">
            <MarkdownContent content={post.content} />
          </div>

          {/* 底部导航 */}
          {!post.isHidden && (
            <div className="mt-16 pt-8 border-t border-border">
              <div className="flex justify-between items-center">
                {/* 下一篇文章（更新的文章） */}
                <div className="w-1/2 pr-4 text-left">
                  {post.nextPost ? (
                    <Link
                      href={`/${post.nextPost.id}`}
                      className="flex items-center text-muted-foreground hover:text-blue-600 transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                      <span className="line-clamp-1 text-left min-w-0 mr-auto">
                        {post.nextPost.title}
                      </span>
                    </Link>
                  ) : (
                    /* 占位，保持布局 */
                    <div></div>
                  )}
                </div>

                {/* 上一篇文章（更旧的文章） */}
                <div className="w-1/2 pl-4">
                  {post.prevPost ? (
                    <Link
                      href={`/${post.prevPost.id}`}
                      className="flex items-center text-muted-foreground hover:text-blue-600 transition-colors"
                    >
                      <span className="line-clamp-1 text-left min-w-0 ml-auto">
                        {post.prevPost.title}
                      </span>
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ) : (
                    /* 占位，保持布局 */
                    <div></div>
                  )}
                </div>
              </div>
            </div>
          )}
        </article>

        {/* 浮动大纲 */}
        <ClientTableOfContents no_toc={post.no_toc === true} />
      </PageContainer>
    );
  } catch (error) {
    console.error("博客文章获取失败:", error);
    // 如果文章不存在，触发Next.js的notFound处理
    notFound();
  }
}
