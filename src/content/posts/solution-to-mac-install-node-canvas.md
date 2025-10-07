---
title: "M1/M2 Mac 安装 node-canvas 的解决方法"
date: "2024-03-22"
description: "Arm 架构下 Mac 的 node-canvas 安装解决办法"
tags: ["Node.js", "Mac", "前端"]
cover: "https://img.note.kim/i/2024/03/23/65fe4b3e3a354.png"
author: "Jakho"
---

最近我有一个需求是需要批量生成一批文字图片，作为前端开发首先想到的当然是通过 canvas 去进行绘制并且保存为 base64 转图片。

但如果要批量生产，通过浏览器 DOM 来做，在保存的时候会相对比较麻烦一些，这就需要用到 Node 去进行处理，而在 Node 中想调用 canvas 环境就必须安装 node-canvas 模块依赖，而我在使用 M2 Mac  设备安装 node-canvas 的时候会报错，它会提示：

> 尝试从中获取不存在的二进制文件https://github.com/Automattic/node-canvas/releases/download/v2.9.1/canvas-v2.9.1-node-v93-darwin-unknown-arm64.tar.gz（与您的相同）。不幸的是，发布页面上没有该版本的迹象https://github.com/Automattic/node-canvas/releases

也就是说官方的 node-canvs 实际上没有关于 arm64 的 node-canvas 源提供，需要另寻解决办法。

安装 node-canvas 的话，node-gyp 肯定也必不可少，首先我们得先安装好 node-gyp（如已安装过可跳过）以免在后续安装依赖的时候还是会等待时间过长或者报错。

## 安装并且配置 node-gyp

打开终端窗口并输入以下命令：

```
export CXXFLAGS="-stdlib=libc++"
```

此命令将 C++ 标准库设置为 libc++，这是 node-gyp 在 M1 Mac 上工作所必需的。

在终端窗口输入以下命令：

```
npm install -g node-gyp
```

此命令会全局安装 node-gyp 软件包，等待安装完成即可。

## 安装 node-canvas

首先需要先安装 homebrew 工具，请将这些命令准确复制并粘贴到终端中分步执行：

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

```
arch -arm64 brew install pkg-config cairo pango libpng jpeg giflib librsvg
```

第二个完成后，它会告诉你导出几个路径来完成，如下所示。请执行这些操作，否则将不起作用。

![node-canvas-install](https://img.note.kim/i/2024/03/23/65fe4b3e3a354.png)

执行完成后，重新输入`npm install node-canvas`，如无意外就能安装成功啦，看了下仓库的 issure ，貌似在 linux 环境下，使用 node-canvas 更加麻烦，特别是配合高版本 node 下，可能得使用指定的版本，否则无法安装成功。
