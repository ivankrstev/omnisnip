import {
  CreateSnippetInput,
  Snippet,
  SnippetFilter,
  SnippetSort,
  UpdateSnippetInput,
  UUID,
} from "@omnisnip/types";
import { promises as fs } from "fs";
import { homedir } from "os";
import { join } from "path";
import { v4 as uuidv4 } from "uuid";

/**
 * Service for managing snippet storage using JSON file persistence.
 * Provides CRUD operations and filtering capabilities for code snippets.
 *
 * @example
 * ```typescript
 * // Use the singleton instance
 * import { storageService } from './storage.service';
 *
 * const snippet = await storageService.add({
 *   title: "Hello World",
 *   code:  "console.log('Hello');",
 *   language: "javascript",
 *   category:  "utility"
 * });
 * ```
 *
 * @example
 * ```typescript
 * // Create a custom instance for testing
 * import { StorageService } from './storage.service';
 *
 * const testService = new StorageService('/tmp/test-storage');
 * ```
 */
class StorageService {
  private storagePath: string;
  private dataFile: string;

  /**
   * Creates a new StorageService instance.
   *
   * @param customPath - Optional custom storage directory path.
   *                     If not provided, defaults to ~/.omnisnip
   *
   * @example
   * ```typescript
   * // Use default path (~/.omnisnip)
   * const service = new StorageService();
   *
   * // Use custom path
   * const testService = new StorageService('/tmp/my-snippets');
   * ```
   */
  constructor(customPath?: string) {
    this.storagePath = customPath ?? join(homedir(), ".omnisnip");
    this.dataFile = join(this.storagePath, "snippets.json");
  }

  /**
   * Ensures the storage directory exists, creating it if necessary.
   *
   * @private
   * @throws {Error} If the directory cannot be created
   */
  private async ensureStoragePath() {
    try {
      await fs.mkdir(this.storagePath, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create storage directory: ${error}`);
    }
  }

  /**
   * Reads and parses the snippets JSON file.
   *
   * @private
   * @returns Promise resolving to an array of snippets, or empty array if file doesn't exist
   * @throws {Error} If the file exists but cannot be read or parsed
   */
  private async readJSONFile(): Promise<Snippet[]> {
    try {
      const data = await fs.readFile(this.dataFile, "utf-8");
      return JSON.parse(data) as Snippet[];
    } catch (error) {
      // If file does not exist or is invalid, return empty array
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw new Error(`Failed to read storage file: ${error}`);
    }
  }

  /**
   * Writes snippets array to the JSON file.
   * Ensures storage directory exists before writing.
   *
   * @private
   * @param data - Array of snippets to write
   * @throws {Error} If the file cannot be written
   */
  private async writeJSONFile(data: Snippet[]): Promise<void> {
    await this.ensureStoragePath();
    try {
      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(this.dataFile, json, "utf-8");
    } catch (error) {
      throw new Error(`Failed to write storage file: ${error}`);
    }
  }

  /**
   * Adds a new snippet to storage.
   * Auto-generates ID, timestamps, and sets default values for optional fields.
   *
   * @param input - Snippet data to create
   * @returns Promise resolving to the created snippet with generated fields
   * @throws {Error} If the snippet cannot be written to storage
   *
   * @example
   * ```typescript
   * const snippet = await storageService.add({
   *   title: "Array Map",
   *   description: "Transform array elements",
   *   code: "arr.map(x => x * 2)",
   *   language: "javascript",
   *   category: "utility",
   *   tags: ["array", "functional"]
   * });
   *
   * console.log(snippet.id); // Auto-generated UUID
   * console.log(snippet.createdAt); // Current timestamp
   * ```
   */
  public async add(input: CreateSnippetInput) {
    const snippets = await this.readJSONFile();

    const newSnippet: Snippet = {
      id: uuidv4(),
      ...input,
      favorite: input.favorite ?? false,
      tags: input.tags ?? [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    snippets.push(newSnippet);
    await this.writeJSONFile(snippets);
    return newSnippet;
  }

  /**
   * Retrieves all snippets from storage.
   *
   * @returns Promise resolving to an array of all snippets
   * @throws {Error} If the storage file cannot be read
   *
   * @example
   * ```typescript
   * const allSnippets = await storageService.getAll();
   * console.log(`Total snippets: ${allSnippets.length}`);
   * ```
   */
  public async getAll(): Promise<Snippet[]> {
    return await this.readJSONFile();
  }

  /**
   * Retrieves a snippet by its unique ID.
   *
   * @param id - UUID of the snippet to retrieve
   * @returns Promise resolving to the snippet if found, or null if not found
   * @throws {Error} If the storage file cannot be read
   *
   * @example
   * ```typescript
   * const snippet = await storageService.getById("some-uuid");
   * if (snippet) {
   *   console.log(`Found snippet: ${snippet.title}`);
   * } else {
   *   console.log("Snippet not found");
   * }
   * ```
   */
  public async getById(id: UUID): Promise<Snippet | null> {
    const snippets = await this.readJSONFile();
    return snippets.find((snippet) => snippet.id === id) || null;
  }

  /**
   * Updates an existing snippet by its ID.
   * Only fields provided in the input will be updated.
   *
   * @param id - UUID of the snippet to update
   * @param input - Partial snippet data to update
   * @returns Promise resolving to the updated snippet, or null if not found
   * @throws {Error} If the storage file cannot be read or written
   *
   * @example
   * ```typescript
   * // Update only the title and favorite status
   * const updatedSnippet = await storageService.update("some-uuid", {
   *   title: "Updated Title",
   *   favorite: true
   * });
   * if (updatedSnippet) {
   *   console.log(`Snippet updated: ${updatedSnippet.title}`);
   * } else {
   *   console.log("Snippet not found");
   * }
   * ```
   */
  public async update(id: UUID, input: UpdateSnippetInput) {
    const snippets = await this.readJSONFile();
    const index = snippets.findIndex((snippet) => snippet.id === id);
    const originalSnippet = snippets[index];

    if (index === -1 || !originalSnippet) {
      return null;
    }

    const updatedSnippet: Snippet = {
      id: originalSnippet.id,
      createdAt: originalSnippet.createdAt,
      title: input.title ?? originalSnippet.title,
      description: input.description ?? originalSnippet.description,
      code: input.code ?? originalSnippet.code,
      language: input.language ?? originalSnippet.language,
      category: input.category ?? originalSnippet.category,
      tags: input.tags ?? originalSnippet.tags,
      favorite: input.favorite ?? originalSnippet.favorite,
      updatedAt: new Date(),
    };

    snippets[index] = updatedSnippet;
    await this.writeJSONFile(snippets);
    return updatedSnippet;
  }

  public async delete(id: UUID): Promise<boolean> {
    const snippets = await this.readJSONFile();
    const filtered = snippets.filter((snippet) => snippet.id !== id);

    if (filtered.length !== snippets.length) {
      // Snippet was found and removed
      await this.writeJSONFile(filtered);
      return true;
    }

    return false;
  }

  public async deleteAll(): Promise<void> {
    await this.writeJSONFile([]);
  }

  public async filter(filter: SnippetFilter = {}): Promise<Snippet[]> {
    const snippets = await this.readJSONFile();

    let filtered = snippets.filter((snippet) => {
      // Filter by query
      if (filter.query) {
        const lowerSearchQuery = filter.query.toLowerCase();
        const matchesQuery =
          snippet.title.toLowerCase().includes(lowerSearchQuery) ||
          snippet.description.toLowerCase().includes(lowerSearchQuery) ||
          snippet.code.toLowerCase().includes(lowerSearchQuery);
        if (!matchesQuery) return false;
      }

      // Filter by language
      if (filter.language && snippet.language !== filter.language) {
        return false;
      }

      // Filter by category
      if (filter.category && snippet.category !== filter.category) {
        return false;
      }

      // Filter by tags
      if (filter.tags && filter.tags.length > 0) {
        const hasMatchingTag = filter.tags.some((tag) => snippet.tags.includes(tag));
        if (!hasMatchingTag) return false;
      }

      // Filter by favorite
      if (filter.favorite !== undefined && snippet.favorite !== filter.favorite) {
        return false;
      }

      return true;
    });

    // Sorting
    if (filter.sortBy) {
      filtered = this.sortSnippets(filtered, {
        field: filter.sortBy,
        order: filter.sortOrder ?? "asc", // Default to ascending
      });
    }

    return filtered;
  }

  private sortSnippets(snippets: Snippet[], sort: SnippetSort): Snippet[] {
    return [...snippets].sort((a, b) => {
      const { field, order } = sort;

      let aVal: any = a[field];
      let bVal: any = b[field];

      // Handle Date objects
      if (field === "createdAt" || field === "updatedAt") {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      // Handle booleans (favorite)
      if (typeof aVal === "boolean") {
        aVal = aVal ? 1 : 0;
        bVal = bVal ? 1 : 0;
      }

      // Handle strings (case-insensitive)
      if (typeof aVal === "string") {
        aVal = aVal.toLowerCase();
        bVal = bVal.toLowerCase();
      }

      // Compare
      let comparison = 0;
      if (aVal < bVal) {
        comparison = -1;
      } else if (aVal > bVal) {
        comparison = 1;
      }

      // Apply order
      return order === "asc" ? comparison : -comparison;
    });
  }

  public async search(searchQuery: string): Promise<Snippet[]> {
    return this.filter({ query: searchQuery });
  }

  // Cleanup method for tests
  public async cleanup(): Promise<void> {
    try {
      await fs.rm(this.storagePath, { recursive: true, force: true });
    } catch (error) {
      throw new Error(`Failed to clean up storage directory: ${error}`);
    }
  }
}

// Export a singleton instance for general use
export const storageService = new StorageService();

// Export the class for testing
export { StorageService };
