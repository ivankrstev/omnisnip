/**
 * Commonly used primitive and domain-specific types shared across the application.
 */

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
 * @see SNIPPET_LANGUAGES
 */
export type SnippetLanguage = (typeof SNIPPET_LANGUAGES)[number];

/**
 * A list of predefined categories for organizing code snippets.
 */
export const SNIPPET_CATEGORIES = [
  "function",
  "utility",
  "config",
  "algorithm",
  "boilerplate",
  "example",
  "other",
] as const;

/**
 * Represents the predefined categories for organizing code snippets.
 * Derived from the `SNIPPET_CATEGORIES` array.
 * @see SNIPPET_CATEGORIES
 */
export type SnippetCategory = (typeof SNIPPET_CATEGORIES)[number];

/**
 * Represents a universally unique identifier (UUID).
 *
 * Expected to be a valid RFC 4122 string.
 */
export type UUID = string;

/**
 * Represents a point in time.
 *
 * Can be either:
 * - A `Date` object when used in memory or backend services
 * - An ISO 8601 formatted string when serialized (e.g. JSON, APIs, storage)
 */
export type Timestamp = Date | string;

/**
 * Represents the order in which sorting can be applied.
 * Either ascending (`asc`) or descending (`desc`).
 * @see SortField
 */
export type SortOrder = "asc" | "desc";
