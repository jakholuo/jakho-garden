import { getAllPostsWithPagination } from "@/lib/api";
import PageContainer from "@/components/layout/PageContainer";
import PostCard from "@/components/PostCard";
import ScrollToContent from "@/components/ScrollToContent";
import { Metadata } from "next";
import { Suspense } from "react";
import Pagination from "@/components/Pagination";
import { notFound } from "next/navigation";

export const metadata: Metadata = {
  title: `所有文章 - ${process.env.NEXT_PUBLIC_SITE_NAME}'s Garden`,
};

// 预生成所有分页的静态页面
export async function generateStaticParams() {
  const { totalPages } = await getAllPostsWithPagination(1);

  // 为所有可能的页码生成参数
  const params = [];

  // 生成所有分页参数
  for (let page = 1; page <= totalPages; page++) {
    params.push({ searchParams: { page: page.toString() } });
  }

  return params;
}

interface PostPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function PostPage({ searchParams }: PostPageProps) {
  // 获取当前页码，默认为第1页
  const searchParamsWait = await searchParams;
  const currentPage = Number(searchParamsWait.page) || 1;

  // 获取分页的文章列表
  const { posts, totalPages } = await getAllPostsWithPagination(currentPage);

  // 如果页码超出范围且总页数大于0，返回404
  if (currentPage > totalPages && totalPages > 0) {
    notFound();
  }

  return (
    <PageContainer>
      {/* 添加滚动处理组件，用 Suspense 包裹 */}
      <Suspense fallback={null}>
        <ScrollToContent />
      </Suspense>

      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">所有文章</h1>
      </div>

      {posts.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-muted-foreground">暂无文章，请稍后再来！</p>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}

      {/* 只有当总页数大于1时才显示分页组件 */}
      {totalPages > 1 && (
        <Pagination currentPage={currentPage} totalPages={totalPages} />
      )}
    </PageContainer>
  );
}
