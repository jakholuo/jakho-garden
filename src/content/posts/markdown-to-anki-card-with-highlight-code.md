---
title: "Markdown 制作 Anki 记忆卡并实现代码高亮"
date: "2025-05-09"
description: "近日在整理过往在 Codeing 时记录的一些知识片段笔记，想着因为入手了 Anki 的 IOS 客户端，能不能把这些笔记抽出来一些比较实用的做成 Anki 记忆卡片，偶尔在手机上无聊的时候随时可以点开看看，加深记忆，这样在往后面试或者面试他人的时候也能有帮助。"
tags: ["Anki", "Node.js", "前端"]
cover: "https://img.note.kim/i/2025/05/09/681dc488df803.png"
author: "Jakho"
---

近日在整理过往在 Codeing 时记录的一些知识片段笔记，想着因为入手了 Anki 的 IOS 客户端，能不能把这些笔记抽出来一些比较实用的做成 Anki 记忆卡片，偶尔在手机上无聊的时候随时可以点开看看，加深记忆，这样在往后面试或者面试他人的时候也能有帮助。

因为笔记都是 Markdown 格式，并且往往里面都会夹杂一些代码片段，比如：

```javascript
# 给定一个字符串，判定其能否排列成回文串.md

var canPermutePalindrome = function(s) {
    const set = new Set();
    s.split('').forEach(key => {
        if (set.has(key)) {
            set.delete(key);
        } else {
            set.add(key);
        }
    });
    return set.size <= 1;
};
```

但是如果直接把内容通过 Markdown 编辑器去转换，转换得到的格式文本可能无法直接粘贴到 Anki 的编辑器中或者并不是可用的状态，比如：

![](https://img.note.kim/i/2025/05/09/681dc3a05dc39.png)

当然，你可以直接安装官方的 [`Syntax Highlighting` 插件](https://ankiweb.net/shared/info/566351439) 使用，但毕竟一个个手工制卡确实麻烦。作为程序员肯定得用一些代码能力来解放双手，只要**写一段将 Markdown 转换为 HTML 源代码并且让代码拥有高亮格式的程序**，就能通过程序批量转换制卡了，我这里提供一种使用 Node.js 的实现思路，大家可以按照自己的理解和语言来实现。

在 Node.js 中，有很多 Markdown 的工具，比如 `marked` 、`markdown-it`，我这里使用的是 `markdown-it`，原理都是通用的，可以自己选择不同工具。

我们安装 `markdown-it` 和 `highlight.js`依赖包，并且引入使用：

```javascript
const markdownit = require("markdown-it");
const highlightjs = require("highlight.js");

const md = markdownit({
  html: true,
  typographer: true,
  highlight: (str, lang) => {
    if (lang === undefined || lang === "") {
      lang = "bash";
    }
    if (lang && highlightjs.getLanguage(lang)) {
      try {
        const formatted = highlightjs
          .highlight(lang, str, true)
          .value.replace(/\n/g, "<br/>") // 换行用br表示
          .replace(/\s/g, "&nbsp;") // 用nbsp替换空格
          .replace(/span&nbsp;/g, "span "); // span标签修复
        return (
          '<pre class="custom"><code class="hljs">' +
          formatted +
          "</code></pre>"
        );
      } catch (e) {
        console.log(e);
      }
    }
    return (
      '<pre class="custom"><code class="hljs">' +
      md.utils.escapeHtml(str) +
      "</code></pre>"
    );
  },
});

md.render(`需要转换的 markdown 内容`);
```

上面这段代码就是这个 `markdown-it` 库将 Markdown 转换为 HTML 源代码的基础使用方法，但是转换后的内容直接粘贴进 Anki 中也是无法生效代码高亮的，原因在于：一般这些库转换后的 HTML 代码都是使用 class 添加样式的，需要在页面额外引入 css 文件进行样式加载的。但是，我们又没办法为卡片直接添加 css 样式，因此，我们需要把 css 内容注入到 HTML 里，作为内联的 style 样式，这样才能让 Anki 完整显示格式内容。

这里我们需要引入一个库 [`juice`](https://www.npmjs.com/package/juice)，它可以将你的 CSS 属性内联到 style 属性中。

```javascript
# pnpm i juice

const juice = require('juice');

# 可以将 highlight.js 提供的样式文件下载
# https://highlightjs.org/download
# 下载后提取需要用到的 css 文件，使用 juice 库进行加载

// 将 markdown 转为 HTML 源代码
const result = md.render(`需要转换的 markdown 内容`);

// 加载 css 内容，可以通过 readFile 读取文件或者直接复制文件内容作为变量
const defaultStyle = `CSS 内容...`;
const codeStyle = `CSS 内容...`;

// 使用 juice 执行内联样式操作
const res = juice.inlineContent(result, defaultStyle + codeStyle, {
  inlinePseudoElements: true,
  preserveImportant: true,
});

// 获得内联样式后的 HTML 源代码
console.log(res);
```

然后将代码复制进 Anki 软件里查看效果：

![](https://img.note.kim/i/2025/05/09/681dc488df803.png)

这样，你就能通过自己写一些自动批量程序，把你的含有代码的笔记，转换为可导入的内容，通过 CSV 文件可以实现批量的记忆卡片录入。

![](https://img.note.kim/i/2025/05/09/681dc4903c975.png)
