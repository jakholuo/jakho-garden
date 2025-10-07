"use client";

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import {
  oneLight,
  oneDark,
} from "react-syntax-highlighter/dist/cjs/styles/prism";
import "@/styles/syntax-highlighter-override.css";
import React, { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import { VueSFCBlock } from "./vue-sfc/VueSFCBlock";
import { SvelteSFCBlock } from "./svelte-sfc/SvelteSFCBlock";

// 导入常用语言支持
import typescript from "react-syntax-highlighter/dist/cjs/languages/prism/typescript";
import javascript from "react-syntax-highlighter/dist/cjs/languages/prism/javascript";
import jsx from "react-syntax-highlighter/dist/cjs/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/cjs/languages/prism/tsx";
import css from "react-syntax-highlighter/dist/cjs/languages/prism/css";
import scss from "react-syntax-highlighter/dist/cjs/languages/prism/scss";
import bash from "react-syntax-highlighter/dist/cjs/languages/prism/bash";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import markdown from "react-syntax-highlighter/dist/cjs/languages/prism/markdown";
import python from "react-syntax-highlighter/dist/cjs/languages/prism/python";
import java from "react-syntax-highlighter/dist/cjs/languages/prism/java";
import c from "react-syntax-highlighter/dist/cjs/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/cjs/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/cjs/languages/prism/csharp";
import go from "react-syntax-highlighter/dist/cjs/languages/prism/go";
import rust from "react-syntax-highlighter/dist/cjs/languages/prism/rust";
import yaml from "react-syntax-highlighter/dist/cjs/languages/prism/yaml";
import swift from "react-syntax-highlighter/dist/cjs/languages/prism/swift";
import php from "react-syntax-highlighter/dist/cjs/languages/prism/php";
import sql from "react-syntax-highlighter/dist/cjs/languages/prism/sql";
import dart from "react-syntax-highlighter/dist/cjs/languages/prism/dart";
import kotlin from "react-syntax-highlighter/dist/cjs/languages/prism/kotlin";
import html from "react-syntax-highlighter/dist/cjs/languages/prism/markup";

// 注册语言
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("scss", scss);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("shell", bash); // shell别名
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("md", markdown); // markdown别名
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python); // python别名
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("csharp", csharp);
SyntaxHighlighter.registerLanguage("cs", csharp); // csharp别名
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("rs", rust); // rust别名
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml); // yaml别名
SyntaxHighlighter.registerLanguage("swift", swift);
SyntaxHighlighter.registerLanguage("php", php);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("dart", dart);
SyntaxHighlighter.registerLanguage("kotlin", kotlin);
SyntaxHighlighter.registerLanguage("kt", kotlin); // kotlin别名
SyntaxHighlighter.registerLanguage("html", html);

// 代码块容器组件
export default function CodeBlock({
  language,
  code,
  ...props
}: {
  language: string;
  code: string;
  [key: string]: unknown;
}) {
  // 处理客户端 mounted 状态，避免 Hydration Mismatch
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  // SSR 时总是使用亮色主题，客户端 hydration 后才使用实际主题
  // 这样可以保持 SSR 的同时避免 hydration mismatch
  const themeToUse = mounted && resolvedTheme ? resolvedTheme : "light";

  // 共同的样式配置
  const commonStyles = {
    container: "relative my-6 rounded-sm overflow-hidden border border-border",
    header:
      "bg-muted text-muted-foreground text-xs py-1.5 px-3 font-mono border-b border-border font-bold",
    sectionHeader:
      "bg-muted text-muted-foreground text-xs py-1 px-3 font-mono border-border indent-2",
    highlighter: {
      style: themeToUse === "dark" ? oneDark : oneLight,
      showLineNumbers: true,
      wrapLines: true,
      lineNumberStyle: {
        width: "3em",
        color: "#aaa",
        textAlign: "right" as const,
        userSelect: "none" as const,
        paddingRight: "1em",
        borderRight: "1px solid #e5e5e5",
        marginRight: "1em",
        fontStyle: "normal",
      },
      lineNumberContainerStyle: {
        fontStyle: "normal",
      },
      customStyle: {
        margin: 0,
        padding: "0.4rem 0.5rem 0.4rem 0",
        borderRadius: 0,
        fontSize: "0.95rem",
        fontWeight: "medium",
      },
      PreTag: "div" as keyof React.JSX.IntrinsicElements,
      codeTagProps: {
        style: {
          fontStyle: "normal",
        },
      },
    },
  };

  // 解析语言和行号范围
  const parseLanguageAndRange = (lang: string) => {
    // 处理Vue文件
    if (lang === "vue") {
      return {
        language: "vue",
        range: null,
      };
    }

    // 处理Svelte文件
    if (lang === "svelte") {
      return {
        language: "svelte",
        range: null,
      };
    }

    // 原有的语言解析逻辑
    const match = lang.match(/^(\w+)(?:{([^}]+)})?$/);
    if (match && match[2]) {
      return {
        language: match[1],
        range: match[2],
      };
    }
    return {
      language: lang,
      range: null,
    };
  };

  const { language: parsedLanguage, range } = parseLanguageAndRange(language);

  // 如果是Vue文件，使用VueSFCBlock组件
  if (parsedLanguage === "vue") {
    return <VueSFCBlock code={code} commonStyles={commonStyles} />;
  }

  // 如果是Svelte文件，使用SvelteSFCBlock组件
  if (parsedLanguage === "svelte") {
    return <SvelteSFCBlock code={code} commonStyles={commonStyles} />;
  }

  // 解析代码中的行高亮标记
  const parseCode = (code: string, rangeStr: string | null) => {
    const lines = code.split("\n");
    const lineProps: { [key: number]: { style: React.CSSProperties } } = {};

    // 解析行号范围
    const parseLineNumbers = (rangeStr: string): number[] => {
      // console.log('解析行号范围:', rangeStr);
      const numbers: number[] = [];
      const parts = rangeStr.split(",");

      for (const part of parts) {
        if (part.includes("-")) {
          const [start, end] = part.split("-").map(Number);
          // console.log('解析范围:', start, '到', end);
          for (let i = start; i <= end; i++) {
            numbers.push(i);
          }
        } else {
          const num = Number(part);
          // console.log('解析单个行号:', num);
          numbers.push(num);
        }
      }

      // console.log('解析后的行号数组:', numbers);
      return numbers;
    };

    if (rangeStr) {
      const lineNumbers = parseLineNumbers(rangeStr);
      lineNumbers.forEach((lineNumber) => {
        if (lineNumber > 0 && lineNumber <= lines.length) {
          // console.log('设置行高亮:', lineNumber);
          lineProps[lineNumber] = {
            style: {
              backgroundColor: "rgba(0, 0, 0, 0.1)",
              display: "block",
              width: "100%",
            },
          };
        }
      });
    }

    // 处理 + 和 - 标记
    lines.forEach((line, index) => {
      if (line.trim().startsWith("+ ")) {
        lineProps[index + 1] = {
          style: {
            backgroundColor: "rgba(0, 255, 0, 0.15)",
            display: "block",
            width: "100%",
          },
        };
        lines[index] = line.replace("+ ", "");
      } else if (line.trim().startsWith("- ")) {
        lineProps[index + 1] = {
          style: {
            backgroundColor: "rgba(255, 0, 0, 0.15)",
            display: "block",
            width: "100%",
          },
        };
        lines[index] = line.replace("- ", "");
      }
    });

    return {
      code: lines.join("\n"),
      lineProps,
    };
  };

  const { code: processedCode, lineProps } = parseCode(code, range);

  return (
    <div className={commonStyles.container}>
      {/* 内联样式覆盖 */}
      {/* <style jsx global>{` 
        // 全局覆盖React Syntax Highlighter的行号样式 
        .react-syntax-highlighter-line-number,
        pre span.linenumber,
        span[class*="linenumber"],
        span[style*="fontStyle: italic"] {
          font-style: normal !important;
        }
        
        // 强制第一列（行号）不使用斜体 
        pre > span > span:first-child,
        pre > span > span.token.comment:first-child {
          font-style: normal !important;
        }

        // 行高亮样式 
        .react-syntax-highlighter-line-number {
          background-color: inherit !important;
        }
       `}</style> */}

      <div className={commonStyles.header}>{parsedLanguage}</div>
      <div className="relative">
        <SyntaxHighlighter
          {...commonStyles.highlighter}
          language={parsedLanguage}
          lineProps={(lineNumber) => {
            const props = lineProps[lineNumber];
            if (!props)
              return {
                key: `line-${lineNumber}`,
                "data-line-number": lineNumber,
              };

            const isAdd =
              props.style?.backgroundColor === "rgba(0, 255, 0, 0.15)";
            const isRemove =
              props.style?.backgroundColor === "rgba(255, 0, 0, 0.15)";

            return {
              ...props,
              key: `line-${lineNumber}`,
              "data-line-number": lineNumber,
              className: isAdd
                ? "line-add"
                : isRemove
                ? "line-remove"
                : undefined,
            };
          }}
          {...props}
        >
          {processedCode}
        </SyntaxHighlighter>
      </div>
      <style jsx global>{`
        .line-add {
          position: relative;
        }
        .line-add::before {
          content: "+";
          position: absolute;
          left: 2.35em;
          color: #22c55e;
          font-weight: bold;
        }
        .line-remove {
          position: relative;
        }
        .line-remove::before {
          content: "-";
          position: absolute;
          left: 2.35em;
          color: #ef4444;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
}
