# AutoCompletion

[English](./i18n/en/README.md)

AI自动补全内容，在编辑器中选中文本内容，右键可以询问AI、代码补全、代码解释、自定义Promot方式。

<video controls>
    <source src="./vs code autocompletion ext show.mp4" type="video/mp4">
</video>

## 特性

- 流式响应将AI的回复内容插入到文档或输出到面板，支持自定义设置输出的方式。
- 支持自定义API接口，如[api2d.com](https://api2d.com/)提供的聊天接口。（前提是API参数要兼容OpenAI官方的聊天接口`/v1/chat/completions`）
- 支持配置GPT参数：model，temperature，max_tokens

## 要求

- 需要从界面“设置>用户>扩展>AutoCompletion”，设置“Api Key”、“Url”之后，才能使用。

## 扩展设置

扩展设置选项如下:

- `API.url`: 设置API聊天请求的URL。
- `API.apiKey`: 设置API KEY。
- `GPT.model`: 设置GPT语言模型。
- `GPT.temperature`: 设置GPT模型temperature参数。
- `GPT.max_tokens`: 设置模型生成的最大tokens数

## 已知问题

none

---

## 更多信息

none