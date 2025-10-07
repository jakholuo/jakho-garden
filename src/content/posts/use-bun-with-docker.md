---
title: "使用 Docker 部署 Bun 环境"
date: "2024-11-29"
description: "最近用 Bun 开发了个小工具，期间因为感觉安装 Bun 有点会污染自己本机环境，毕竟这些正在发展的东西更新迭代很快，不喜欢安装好之后，之后还得折腾一番去卸载或者升级。于是经过一些资料搜索和 AI 的帮助下，通过 Docker 去将 Bun.js 环境部署到本机。"
tags: ["Docker", "Bun"]
cover: "https://img.note.kim/i/2025/10/07/68e3eea38d961.png"
author: "Jakho"
---

最近用 Bun 开发了个小工具，期间因为感觉安装 Bun 有点会污染自己本机环境，毕竟这些正在发展的东西更新迭代很快，不喜欢安装好之后，之后还得折腾一番去卸载或者升级。于是经过一些资料搜索和 AI 的帮助下，通过 Docker 去将 Bun.js 环境部署到本机。

## 安装 Docker

我是使用 Mac 设备的，所以我为了方便安装的是 Docker Desktop 来管理 Docker 应用，可以在 [官网](https://docs.docker.com/desktop/) 进行下载。

## 拉取 Bun 的 Image

如果使用命令行：

```bash
docker pull oven/bun
```

使用图形化界面：
![](https://img.note.kim/i/2024/11/29/67496a157bacc.png)

将 `oven/bun` 这个镜像 Pull 下来。

## 需求

- Bun 的项目文件存放在本机而不是 Docker 中
- 需要能映射运行后的访问端口出来
- 运行完毕或手动停止（Ctrl+C）后需停止并删除 Docker 容器

## 编辑指令设置环境变量

在 .zshrc 或者 .bashrc （Mac 设备环境中）文件中加入下面的 Function 函数，避免每次运行都需要写一长串指令，加入后注意保存并 `source` 以让其生效。

```bash
bun() {
  local port=${1:-8080}
  # 添加--init参数使Docker容器正确处理信号（如Ctrl+C），
  # 它会在容器内运行一个init进程作为PID 1，
  # 这个进程可以正确转发信号给应用程序
  if [[ $1 =~ ^[0-9]+$ ]]; then
    docker run -it --rm -w /app -v "$(pwd)":/app -p ${port}:${port} --init oven/bun bun "${@:2}"
  else
    docker run -it --rm -w /app -v "$(pwd)":/app -p 8080:8080 --init oven/bun bun "$@"
  fi
}
```

## 使用方法

我们可以尝试通过初始化一个 Bun 项目来验证是否可行：

```
bun init
```

![](https://img.note.kim/i/2024/11/29/67496ea51610c.png)

🎉 没有问题！能正常创建并初始化项目！下面我们试试创建一个服务器，并且映射 3001 端口出来，因为 Bun 环境还是运行在 Docker 容器内，所以我们需要把宿主机的 3001 端口映射到容器的 3001 端口中，上面提到这些都不需要再去设置，因为我们上面设置在环境变量里面的命令已经帮你做好了，我们只需要提前把需要映射的端口号写到运行命令里面即可。

我们给刚才初始化好的 Bun 项目中的 `index.ts`里加入一段官方 Demo 代码：

```typescript
const server = Bun.serve({
  port: 3001,
  fetch(request) {
    return new Response("Welcome to Bun!");
  },
});
console.log(`Listening on localhost:${server.port}`);
```

然后带端口号运行命令：

```bash
bun 3001 run index.ts
```

![](https://img.note.kim/i/2024/11/29/67497096501c1.png)

访问一下本机 3001 端口：

![](https://img.note.kim/i/2024/11/29/6749708726481.png)

🎉 大功告成！
