/**
 * A list of supported programming languages for code snippets.
 */
export const SNIPPET_LANGUAGES = [
  "javascript",
  "typescript",
  "python",
  "java",
  "csharp",
  "bash",
  "cpp",
  "ruby",
  "go",
  "php",
  "swift",
  "kotlin",
  "rust",
  "html",
  "css",
  "json",
  "yaml",
  "markdown",
  "shell",
  "sql",
  "r",
  "perl",
  "dart",
  "objective-c",
  "scala",
  "haskell",
  "lua",
  "elixir",
  "clojure",
  "groovy",
  "plaintext",
] as const;

/**
 * Represents the supported programming languages for code snippets.
 * Derived from the `SUPPORTED_LANGUAGES` array.
 */
export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];
