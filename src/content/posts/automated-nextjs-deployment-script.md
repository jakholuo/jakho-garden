---
title: "Next.js 使用 PM2 实现不停机更新部署"
date: "2025-10-05"
description: "本篇文章是为了记录我的一次部署实践，将为你提供一套基于 PM2 和 Next.js 的自部署方案，帮助个人开发者或团队在自有服务器上高效、可靠地部署 Next.js应用，并实现零停机部署。"
tags: ["Next.js", "PM2", "前端"]
cover: "https://img.note.kim/i/2025/10/07/68e3ee1135811.png"
author: "Jakho"
---

在我们实际 Web 开发中，Vercel 无疑是 Next.js 应用部署的首选平台，它提供了简单、无缝的部署体验。然而，并非所有项目都能够或希望依赖于 **Vercel** 这样的平台，特别是对于有自定义需求或高可控性的团队，选择自行托管可能是一个更合适的方案。

本篇文章是为了记录我的一次部署实践，将为你提供一套基于 **PM2** 和 **Next.js** `Standalone` 模式的自部署方案，帮助个人开发者或团队在自有服务器上高效、可靠地部署 **Next.js** 应用，并实现零停机部署。

## 零停机部署

在很多生产环境中，零停机部署是提升服务可用性和用户体验的关键。而蓝绿部署作为最经典的零停机策略，通过维护两套环境来实现平滑切换：一套用于当前版本，另一套用于新版本。当新版本验证通过后，流量将切换至新的环境。

我们通过在服务器上运行多个 **Node.js** 进程（例如使用 `PM2 Cluster` 模式）来支撑这种平滑切换。在 Next.js 的自部署方案中，蓝绿部署的核心思路依然适用，但我们着重介绍的是如何利用 **PM2** 和 **Next.js** `Standalone` 模式来实现部署和进程管理。

## PM2 Cluster 模式

当 **Next.js** 应用需要在生产环境中处理大量并发请求时，使用 `PM2 Cluster` 模式是一个常见的做法。**PM2** 的 `Cluster` 模式能够在多核服务器上启动多个进程，从而提升应用的吞吐量和稳定性。

在 **PM2** 的管理下，每个进程监听相同的端口并且自动进行负载均衡，这对于高并发的生产环境非常重要。然而，简单地在 `ecosystem.config.js` 中设置 `instances: 2` 并不足以让 Next.js 在多核机器上顺利运行。原因在于 **Next.js **默认的启动方式与多实例部署并不兼容。

为了解决这一问题，我们需要启用 **Next.js** 的 `Standalone` 模式，这不仅能够避免多个实例之间的端口冲突，还能实现更加灵活和高效的多进程部署。

## Next.js Standalone 模式：解决多进程冲突

**Next.js** 在默认的模式下，会在应用根目录生成 `.next` 目录，包含了构建后的静态资源和页面。但是，当启用 `PM2 Cluster` 模式时，`pnpm start` 命令会导致多个进程之间的冲突，因为它们共享相同的文件结构。

为了解决这个问题，**Next.js** 提供了 `Standalone` 模式，该模式将构建输出和服务器打包成一个独立的运行环境，使得每个实例都可以单独运行，而不会产生进程间的冲突。

我们可以打开项目跟目录下的 `next.config.ts` 文件，给配置项中添加 `output: 'standalone'` ：

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
};

export default nextConfig;
```

## 解决 Next.js Standalone 模式中的静态资源问题

在使用 **Next.js** `Standalone` 模式时，可能会遇到一个静态资源丢失的问题。原因在于 `Standalone` 模式会在 `.next/standalone` 目录下创建自己的 `.next `文件夹，而原本存放静态资源的 `.next/static` 并不会被自动包含在其中。

为了让静态资源能够正确加载，需要将外部的 `static` 文件夹手动复制到 `Standalone` 模式的目录结构下，后面的部署脚本也会标注这一点。

## 编写脚本文件

以下是一份全面的 **Bash** 脚本部署方案，我将逐步解读该脚本的每个步骤，让你能够轻松理解并应用到自己的项目中。

### 1. 环境准备与基础设置

```bash
APP_ROOT="/data/frontend/project-name"
REPO_DIR="$APP_ROOT/project-name"
BRANCH="main"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$APP_ROOT/releases/release-$TIMESTAMP"
CURRENT_LINK="$APP_ROOT/current"
```

首先，脚本定义了一些重要的环境变量，包括应用根目录（`APP_ROOT`）、代码库目录（`REPO_DIR`）和目标分支（`BRANCH`）。`TIMESTAMP` 用于标记每次部署的时间，确保每次部署的版本目录不会冲突。`RELEASE_DIR` 用来存放新版本的文件，`CURRENT_LINK` 是指向当前活动版本的符号链接。
请你以你服务器的实际目录路径来填写，以下内容会 `project-name` 来代替项目名称，你需要按照实际来进行修改。

### 2. 更新代码：从 Git 拉取最新版本

```bash
cd "$REPO_DIR"
git fetch origin
git reset --hard origin/$BRANCH
```

这一部分负责更新代码。脚本进入项目目录，使用 `git fetch` 拉取远程仓库的最新代码，接着通过 `git reset --hard `强制将本地代码切换到指定的分支，确保应用代码是最新的，避免因本地代码过期而导致的部署失败。

### 3. 使用 pnpm 安装依赖并构建项目

```bash
pnpm install --frozen-lockfile
pnpm build
```

在此步骤中，脚本使用 **pnpm** 来安装依赖并构建项目。 `--frozen-lockfile` 确保安装时使用锁文件中的版本，避免因依赖版本变化带来的不确定性。`pnpm build `会构建出生产环境所需的文件，准备好部署。

### 4. 打包所需文件

```bash
mkdir -p "$RELEASE_DIR"
cp -r .next/standalone/.next "$RELEASE_DIR/"
cp -r .next/standalone/package.json "$RELEASE_DIR/"
cp -r .next/standalone/.env.production "$RELEASE_DIR/"
cp -r .next/static "$RELEASE_DIR/.next/"
cp -r public "$RELEASE_DIR/"
cp .next/standalone/server.js "$RELEASE_DIR/"
cp pnpm-lock.yaml "$RELEASE_DIR/"
```

这一步是将构建好的文件打包到一个新的目录中。具体来说，它会将 `.next`、`package.json`、.`env.production（若有）` 等必要的文件和配置复制到 `RELEASE_DIR` 目录中。通过将这些文件收集到一个独立的目录，确保新的部署不会受到旧版本的干扰。

### 5. 安装生产依赖

```bash
cd "$RELEASE_DIR"
pnpm install --prod --frozen-lockfile
```

在新的 `RELEASE_DIR` 目录下，脚本再次使用 `pnpm` 安装生产环境依赖。使用 `--prod` 参数确保只安装生产环境所需的依赖，这样可以减少不必要的包和资源消耗。

### 6. 切换版本：更新软链接

```bash
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK.new"
mv -T "$CURRENT_LINK.new" "$CURRENT_LINK"
```

此步骤实现了版本的平滑切换。通过更新指向当前版本的符号链接，确保新版本能够即时投入生产环境。`ln -sfn` 是创建或更新符号链接的命令，它确保 `CURRENT_LINK` 始终指向最新的版本目录。

### 7. 启动或重载 PM2 管理的应用

```bash
PORT=3100
HOSTNAME=0.0.0.0

if ! pm2 list | grep -q "project-name"; then
  echo "第一次启动 pm2 应用..."
  PORT=$PORT HOSTNAME=$HOSTNAME NODE_OPTIONS="--preserve-symlinks" pm2 start server.js \
    --name project-name \
    -i 2 \
    --time \
    --max-memory-restart 768M \
    --kill-timeout 5000 \
    --env NODE_ENV=production \
    --cwd "$CURRENT_LINK"
else
  echo "平滑重载应用..."
  PORT=$PORT HOSTNAME=$HOSTNAME NODE_OPTIONS="--preserve-symlinks" pm2 reload project-name \
    --update-env \
    --max-memory-restart 768M \
    --kill-timeout 5000 \
    --restart-delay=5000
fi

pm2 save
```

这一步脚本通过 **PM2** 来启动或重载应用。**PM2** 是一个非常流行的 `Node.js` 进程管理工具，它可以帮助你管理应用的生命周期、进行负载均衡并确保应用稳定运行。

如果应用尚未启动，脚本会通过 `pm2 start` 启动应用，并使用 `-i 2` 启动两个实例（适合多核服务器）。

如果应用已经在运行，则使用 `pm2 reload` 实现平滑重载，确保服务无缝更新。

`pm2 save` 用来保存 **PM2** 的进程列表，以便在服务器重启后自动恢复。

### 8. 健康检查：确保服务正常运行

```bash
echo "⏳ 开始健康检查..."
MAX_RETRIES=30
RETRY_INTERVAL=2
for i in $(seq 1 $MAX_RETRIES); do
  response=$(curl -s http://127.0.0.1:3100/api/health || true)
  if echo "$response" | grep -q '"status":"ok"'; then
    echo "✅ 健康检查通过！"
    break
  fi
  echo "重试 $i/$MAX_RETRIES..."
  sleep $RETRY_INTERVAL
done

```

健康检查是保障生产环境应用稳定性的重要步骤。在这段代码中，脚本通过 `curl `访问应用的健康检查接口（`/api/health`），确保应用能够正常响应。如果在最大重试次数内无法通过健康检查，脚本会执行回滚操作。
您需要自己写一个健康检查 `api` 来实现，如果没有，可以参考以下代码简单实现一个即可：

```
# /app/api/health/route.js
export async function GET() {
  return new Response(JSON.stringify({ status: 'ok' }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

```

### 9. 回滚到先前版本（如果健康检查失败）

```bash
if [ $i -eq $MAX_RETRIES ]; then
  echo "❌ 健康检查失败，执行回滚..."
  PREVIOUS=$(ls -1t $APP_ROOT/releases | grep -v "release-$TIMESTAMP" | head -1)
  if [ -n "$PREVIOUS" ]; then
    ln -sfn "$APP_ROOT/releases/$PREVIOUS" "$CURRENT_LINK.new"
    mv -T "$CURRENT_LINK.new" "$CURRENT_LINK"
    NODE_OPTIONS="--preserve-symlinks" pm2 reload project-name
    echo "🔄 已回滚到 $PREVIOUS"
  else
    echo "⚠️ 没有可回滚的版本！"
  fi
  exit 1
fi

```

如果健康检查失败，脚本会自动回滚到上一个版本。它会查找最新的有效版本，并通过更新符号链接和 **PM2** 重载操作恢复旧版本，确保服务不会长时间不可用。

### 10. 清理旧版本：释放磁盘空间

```bash
cd "$APP_ROOT/releases"
TMP_DIR="/tmp/project-name"
mkdir -p "$TMP_DIR"

OLD_RELEASES=$(ls -1tr | head -n -5)

for dir in $OLD_RELEASES; do
  TARGET="$TMP_DIR/${dir}-$(date +%s)"
  echo "移动旧版本 $dir -> $TARGET"
  mv "$dir" "$TARGET"
done

echo "✅ 旧版本移动完成，保存在 $TMP_DIR"

```

这一步主要是清理旧版本的部署文件。它将 `releases` 目录中时间较旧的版本（保留最近的 5 个）移动到 `/tmp` 目录，`/tmp` 目录在 `Linux` 系统下会定时清除文件，以释放磁盘空间。

### 11. 完整代码

```bash
#!/bin/bash
set -e

APP_ROOT="/data/frontend/project-name"
REPO_DIR="$APP_ROOT/project-name"
BRANCH="main"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_DIR="$APP_ROOT/releases/release-$TIMESTAMP"
CURRENT_LINK="$APP_ROOT/current"

echo "🚀 开始部署 $BRANCH 分支，版本 $TIMESTAMP"

# 1. 更新代码
cd "$REPO_DIR"
git fetch origin
git reset --hard origin/$BRANCH

# 2. 安装依赖 & 构建
pnpm install --frozen-lockfile
pnpm build

# 3. 打包需要的文件
mkdir -p "$RELEASE_DIR"
cp -r .next/standalone/.next "$RELEASE_DIR/"
cp -r .next/standalone/package.json "$RELEASE_DIR/"
cp -r .next/standalone/.env.production "$RELEASE_DIR/"
cp -r .next/static "$RELEASE_DIR/.next/"
cp -r public "$RELEASE_DIR/"
cp .next/standalone/server.js "$RELEASE_DIR/"
cp pnpm-lock.yaml "$RELEASE_DIR/"

cd "$RELEASE_DIR"
echo "在非活跃目录安装生产依赖..."
pnpm install --prod --frozen-lockfile

# 4. 切换版本
ln -sfn "$RELEASE_DIR" "$CURRENT_LINK.new"
mv -T "$CURRENT_LINK.new" "$CURRENT_LINK"

# 5. 启动/重载 PM2
PORT=3100
HOSTNAME=0.0.0.0

if ! pm2 list | grep -q "project-name"; then
  echo "第一次启动 pm2 应用..."
  PORT=$PORT HOSTNAME=$HOSTNAME NODE_OPTIONS="--preserve-symlinks" pm2 start server.js \
    --name project-name \
    -i 2 \
    --time \
    --max-memory-restart 768M \
    --kill-timeout 5000 \
    --env NODE_ENV=production \
    --cwd "$CURRENT_LINK"
else
  echo "平滑重载应用..."
  PORT=$PORT HOSTNAME=$HOSTNAME NODE_OPTIONS="--preserve-symlinks" pm2 reload project-name \
    --update-env \
    --max-memory-restart 768M \
    --kill-timeout 5000 \
    --restart-delay=5000
fi

pm2 save

# 6. 健康检查
echo "⏳ 开始健康检查..."
MAX_RETRIES=30
RETRY_INTERVAL=2
for i in $(seq 1 $MAX_RETRIES); do
  response=$(curl -s http://127.0.0.1:3100/api/health || true)
  if echo "$response" | grep -q '"status":"ok"'; then
    echo "✅ 健康检查通过！"
    break
  fi
  echo "重试 $i/$MAX_RETRIES..."
  sleep $RETRY_INTERVAL
done

if [ $i -eq $MAX_RETRIES ]; then
  echo "❌ 健康检查失败，执行回滚..."
  PREVIOUS=$(ls -1t $APP_ROOT/releases | grep -v "release-$TIMESTAMP" | head -1)
  if [ -n "$PREVIOUS" ]; then
    ln -sfn "$APP_ROOT/releases/$PREVIOUS" "$CURRENT_LINK.new"
    mv -T "$CURRENT_LINK.new" "$CURRENT_LINK"
    NODE_OPTIONS="--preserve-symlinks" pm2 reload project-name
    echo "🔄 已回滚到 $PREVIOUS"
  else
    echo "⚠️ 没有可回滚的版本！"
  fi
  exit 1
fi

# 7. 清理旧版本（移动到 /tmp/project-name）
cd "$APP_ROOT/releases"

# 创建临时目录（如果不存在）
TMP_DIR="/tmp/project-name"
mkdir -p "$TMP_DIR"

# 列出旧版本（按时间从旧到新，除最新5个）
OLD_RELEASES=$(ls -1tr | head -n -5)

# 移动旧版本到临时目录
for dir in $OLD_RELEASES; do
  TARGET="$TMP_DIR/${dir}-$(date +%s)"  # 给每个目录加时间戳避免冲突
  echo "移动旧版本 $dir -> $TARGET"
  mv "$dir" "$TARGET"
done

echo "✅ 旧版本移动完成，保存在 $TMP_DIR"

echo "🎉 部署完成！当前版本: $TIMESTAMP"
pm2 status

```

## 总结

通过这份部署脚本，开发者可以快速实现 Next.js 应用的自动化部署，并结合 PM2、健康检查和回滚机制确保应用稳定运行。此脚本适用于自托管环境，可以灵活应用于不同的项目，只需要根据自己的实际需求稍作修改。
