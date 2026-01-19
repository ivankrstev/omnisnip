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
 */
export type SnippetCategory = (typeof SNIPPET_CATEGORIES)[number];
