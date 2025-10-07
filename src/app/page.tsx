import Link from "next/link";
import { getAllPosts, getAllTags } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import PostCard from "@/components/PostCard";
import TagCloud from "@/components/tag/TagCloud";
import { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: `${process.env.NEXT_PUBLIC_SITE_NAME}'s Garden`,
};

export default async function Home() {
  // 获取所有文章并只显示最近的5篇
  const allPosts = await getAllPosts();
  const recentPosts = allPosts.slice(0, 5);

  // 获取所有标签
  const tags = await getAllTags();

  return (
    <PageContainer>
      {/* 个人介绍部分 */}
      <section className="mb-16">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {process.env.NEXT_PUBLIC_SITE_AVATAR_URL && (
            <div className="relative">
              <div className="w-40 h-40 relative overflow-hidden rounded-full border-4 border-border">
                <div className="w-full h-full flex items-center justify-center">
                  <Image
                    src={process.env.NEXT_PUBLIC_SITE_AVATAR_URL}
                    alt="EM"
                    width={200}
                    height={200}
                    className="w-[100%] h-[100%] object-cover"
                  />
                </div>
              </div>
            </div>
          )}
          <div className="text-center md:text-left">
            <h1>
              <span className="text-4xl font-bold mb-4">
                {process.env.NEXT_PUBLIC_SITE_NAME}
              </span>
              <span className="text-4xl font-light mb-4">&apos;s Garden</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-6">
              {process.env.NEXT_PUBLIC_SITE_DESC}
            </p>

            {/* 导航链接 */}
            <div className="flex flex-wrap gap-4 justify-center md:justify-start">
              {process.env.NEXT_PUBLIC_SOCIAL_GITHUB_URL && (
                <a
                  href={process.env.NEXT_PUBLIC_SOCIAL_GITHUB_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 text-muted-foreground bg-muted rounded-lg hover:bg-accent transition-colors duration-200 flex items-center whitespace-nowrap"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 mr-2"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </a>
              )}
              {/* 您可在此自行添加更多链接 */}
            </div>
          </div>
        </div>
      </section>

      {/* 标签云部分 */}
      <section className="mb-16">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">标签云</h2>
        </div>
        <div>
          <TagCloud tags={tags} />
        </div>
      </section>

      {/* 最近文章部分 */}
      <section className="mb-10">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold">最近文章</h2>
        </div>

        <div className="space-y-6">
          {recentPosts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>

        {/* 如果没有文章，显示提示 */}
        {recentPosts.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-muted-foreground">暂无文章，请稍后再来！</p>
          </div>
        ) : (
          <div className="mt-10 text-center">
            <Link
              href="/post?scroll=true"
              className="text-primary hover:underline text-base flex items-center justify-center"
            >
              查看所有文章
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </Link>
          </div>
        )}
      </section>
    </PageContainer>
  );
}
