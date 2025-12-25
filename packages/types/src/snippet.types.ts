/**
 * Snippet Types
 * Defines the structure and types related to code snippets.
 */

import type { SnippetCategory, SnippetLanguage, SortOrder, Timestamp, UUID } from "./common.types";

/**
 * Represents a code snippet with its associated metadata.
 */
export interface Snippet {
  id: UUID;
  title: string;
  description: string;
  code: string;
  language: SnippetLanguage;
  category: SnippetCategory;
  tags: string[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
  favorite: boolean;
}

/**
 * Input type for creating a new code snippet.
 * Excludes fields that are auto-generated or managed by the system.
 */
export interface CreateSnippetInput {
  title: string;
  description: string;
  code: string;
  language: SnippetLanguage;
  category: SnippetCategory;
  tags?: string[];
  favorite?: boolean;
}

/**
 * Input type for updating an existing code snippet.
 * All fields are optional to allow partial updates.
 * Excludes the `id`, `createdAt`, and `updatedAt` fields.
 * @see Snippet
 */
export type UpdateSnippetInput = Partial<Omit<Snippet, "id" | "createdAt" | "updatedAt">>;

/**
 * Represents the fields by which code snippets can be sorted.
 */
export type SnippetSortField =
  | "createdAt"
  | "updatedAt"
  | "title"
  | "language"
  | "category"
  | "favorite";

/**
 * Represents the sorting criteria for code snippets.
 * Includes the field to sort by and the order (ascending or descending).
 */
export interface SnippetSort {
  field: SnippetSortField;
  order: SortOrder;
}

/**
 * Represents the filtering criteria for querying code snippets.
 * Includes optional fields for language, category, tags, favorite status, and sorting.
 */
export interface SnippetFilter {
  query?: string;
  language?: SnippetLanguage;
  category?: SnippetCategory;
  tags?: string[];
  favorite?: boolean;
  sortBy?: SnippetSort["field"];
  sortOrder?: SnippetSort["order"];
}
