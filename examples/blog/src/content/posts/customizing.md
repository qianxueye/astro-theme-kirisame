---
title: 配置你的站点，而不是重写主题
description: 更改标题、导航、配色和动效，不需要复制一整套页面。
published: 2025-12-28
draft: false
topic: 主题
---
## 内容与外观分开

站点配置保存在 `src/site.config.ts`，文章保存在 `src/content/posts`。主题包提供布局与组件，通过 props 接收站点内容。

## 从一个变量开始

在自己的 `custom.css` 中覆盖颜色，不必修改主题源文件。

```css
:root {
  --paper: #eef0f2;
  --accent: #3f5fc9;
}
```

## 保留选择

阅读设置保存在浏览器内。系统选择减少动态效果时，关闭循环与过渡，不影响内容和导航。
