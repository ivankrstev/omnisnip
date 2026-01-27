import { CreateSnippetInput, UpdateSnippetInput } from "@omnisnip/types";
import { promises as fs } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StorageService } from "./storage.service";

describe("StorageService", () => {
  let service: StorageService;
  let testDir: string;

  beforeEach(async () => {
    // Create a unique temporary directory for each test
    testDir = join(tmpdir(), `omnisnip-test-${Date.now()}`);
    service = new StorageService(testDir);
  });

  afterEach(async () => {
    // Clean up after each test
    await service.cleanup();
  });

  describe("add", () => {
    it("should add a new snippet", async () => {
      const input: CreateSnippetInput = {
        title: "Logging Middleware",
        description: "A middleware for logging",
        code: "console.log('Hello, World!');",
        language: "javascript",
        category: "config",
        tags: ["test", "example"],
        favorite: true,
      };

      const snippet = await service.add(input);

      expect(snippet.id).toBeDefined();
      expect(snippet.title).toBe("Logging Middleware");
      expect(snippet.description).toBe("A middleware for logging");
      expect(snippet.language).toBe("javascript");
      expect(snippet.createdAt).toBeInstanceOf(Date);
      expect(snippet.favorite).toBe(true);
    });

    it("should generate unique IDs", async () => {
      const input: CreateSnippetInput = {
        title: "Simple variable",
        description: "Bla bla",
        code: "let alpha = 0.1;",
        language: "javascript",
        category: "config",
      };

      const s1 = await service.add(input);
      const s2 = await service.add(input);

      expect(s1.id).not.toBe(s2.id);
    });

    it("should persist snippet to file system", async () => {
      const input: CreateSnippetInput = {
        title: "Persistent Snippet",
        description: "Should be saved",
        code: "const x = 1;",
        language: "typescript",
        category: "function",
      };

      await service.add(input);

      const dataFile = join(testDir, "snippets.json");
      const fileContent = await fs.readFile(dataFile, "utf-8");
      const snippets = JSON.parse(fileContent);

      expect(snippets).toHaveLength(1);
      expect(snippets[0].title).toBe(input.title);
    });
  });

  describe("getAll", () => {
    it("should return empty array when no snippets", async () => {
      const snippets = await service.getAll();
      expect(snippets).toEqual([]);
    });

    it("should return all snippets", async () => {
      const input1: CreateSnippetInput = {
        title: "Snippet One",
        description: "First snippet",
        code: "code one",
        language: "javascript",
        category: "utility",
      };
      const input2: CreateSnippetInput = {
        title: "Snippet Two",
        description: "Second snippet",
        code: "code two",
        language: "javascript",
        category: "utility",
      };

      await service.add(input1);
      await service.add(input2);

      const snippets = await service.getAll();
      expect(snippets).toHaveLength(2);
    });

    describe("error handling", () => {
      it("should throw error when write fails", async () => {
        // Mock fs.writeFile to throw an error
        vi.spyOn(fs, "writeFile").mockRejectedValueOnce(new Error("Write failed"));

        const input: CreateSnippetInput = {
          title: "Test",
          description: "Test",
          code: "code",
          language: "javascript",
          category: "utility",
        };

        await expect(service.add(input)).rejects.toThrow("Failed to write storage file");
      });

      it("should throw error when read fails with non-ENOENT error", async () => {
        const dataFile = join(testDir, "snippets.json");
        await fs.mkdir(testDir, { recursive: true });
        await fs.writeFile(dataFile, "invalid json{{{", "utf-8");

        await expect(service.getAll()).rejects.toThrow("Failed to read storage file");
      });
    });
  });

  describe("getById", () => {
    it("should return snippet by ID", async () => {
      const input: CreateSnippetInput = {
        title: "Find Me",
        description: "Find this snippet by ID",
        code: "const findMe = true;",
        language: "javascript",
        category: "utility",
      };

      const addedSnippet = await service.add(input);
      const fetchedSnippet = await service.getById(addedSnippet.id);

      expect(fetchedSnippet).not.toBeNull();
      expect(fetchedSnippet?.id).toBe(addedSnippet.id);
      expect(fetchedSnippet?.title).toBe("Find Me");
    });

    it("should return null for non-existing ID", async () => {
      const fetchedSnippet = await service.getById("non-existing-id");
      expect(fetchedSnippet).toBeNull();
    });
  });

  describe("update", () => {
    it("should update an existing snippet", async () => {
      const input: CreateSnippetInput = {
        title: "Original Title",
        description: "Original Description",
        code: "console.log('Original');",
        language: "javascript",
        category: "utility",
      };

      const addedSnippet = await service.add(input);

      const updatedData: UpdateSnippetInput = {
        title: "Updated Title",
        description: "Updated Description",
        code: "console.log('Updated');",
        language: "javascript",
        category: "utility",
      };

      const updatedSnippet = await service.update(addedSnippet.id, updatedData);

      expect(updatedSnippet).not.toBeNull();
      expect(updatedSnippet?.title).toBe("Updated Title");
      expect(updatedSnippet?.description).toBe("Updated Description");
      expect(updatedSnippet?.code).toBe("console.log('Updated');");
    });

    it("should return null when updating non-existing snippet", async () => {
      const updatedData: UpdateSnippetInput = {
        title: "Non-existing",
        description: "Does not exist",
        code: "code",
        language: "javascript",
        category: "utility",
      };

      const result = await service.update("non-existing-id", updatedData);
      expect(result).toBeNull();
    });

    it("should only update provided fields", async () => {
      const input: CreateSnippetInput = {
        title: "Partial Update",
        description: "Before update",
        code: "console.log('Before');",
        language: "javascript",
        category: "utility",
      };

      const addedSnippet = await service.add(input);

      const updatedData: UpdateSnippetInput = {
        description: "After update",
        tags: ["updated", "partial"],
      };

      const updatedSnippet = await service.update(addedSnippet.id, updatedData);

      expect(updatedSnippet).not.toBeNull();
      expect(updatedSnippet?.title).toBe("Partial Update");
      expect(updatedSnippet?.description).toBe("After update");
      expect(updatedSnippet?.code).toBe("console.log('Before');");
      expect(updatedSnippet?.tags).toEqual(["updated", "partial"]);
      expect(updatedSnippet?.language).toBe("javascript");
      expect(updatedSnippet?.category).toBe("utility");
    });
  });

  describe("delete", () => {
    it("should delete snippet", async () => {
      const input: CreateSnippetInput = {
        title: "To Be Deleted",
        description: "This snippet will be deleted",
        code: "console.log('Delete me');",
        language: "javascript",
        category: "utility",
      };

      const addedSnippet = await service.add(input);
      const deleteResult = await service.delete(addedSnippet.id);
      expect(deleteResult).toBe(true);

      const fetchedSnippet = await service.getById(addedSnippet.id);
      expect(fetchedSnippet).toBeNull();
    });

    it("should return false when deleting non-existing snippet", async () => {
      const deleteResult = await service.delete("non-existing-id");
      expect(deleteResult).toBe(false);
    });
  });

  // describe("search", () => {
  //   beforeEach(async () => {
  //     // add some snippets for searching
  //   });
  // });

  describe("filter", () => {
    beforeEach(async () => {
      // Create diverse test data
      await service.add({
        title: "React useState Hook",
        description: "Example of useState in React",
        code: "const [count, setCount] = useState(0);",
        language: "typescript",
        category: "function",
        tags: ["react", "hooks"],
        favorite: true,
      });
      await service.add({
        title: "Python List Comprehension",
        description: "Filter even numbers",
        code: "evens = [x for x in range(10) if x % 2 == 0]",
        language: "python",
        category: "utility",
        tags: ["python", "list"],
        favorite: false,
      });
      await service.add({
        title: "TypeScript Interface",
        description: "Define a user interface",
        code: "interface User { name: string; age: number; }",
        language: "typescript",
        category: "utility",
        tags: ["typescript", "types"],
        favorite: true,
      });
      await service.add({
        title: "React useEffect",
        description: "Side effects in React",
        code: "useEffect(() => { /* effect */ }, []);",
        language: "typescript",
        category: "function",
        tags: ["react", "hooks"],
        favorite: false,
      });
    });

    it("should return all snippets when no filter provided", async () => {
      const results = await service.filter();
      expect(results).toHaveLength(4);
    });

    it("should filter by query in title", async () => {
      const results = await service.filter({ query: "React" });
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.title.includes("React"))).toBe(true);
    });

    it("should filter by query in description", async () => {
      const results = await service.filter({ query: "interface" });
      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("TypeScript Interface");
    });

    it("should filter by query in code", async () => {
      const results = await service.filter({ query: "useState" });
      expect(results).toHaveLength(1);
      expect(results[0]!.code).toContain("useState");
    });

    it("should be case-insensitive for query", async () => {
      const results = await service.filter({ query: "REACT" });
      expect(results).toHaveLength(2);
    });

    it("should filter by language", async () => {
      const results = await service.filter({
        language: "typescript",
      });
      expect(results).toHaveLength(3);
      expect(results.every((s) => s.language === "typescript")).toBe(true);
    });

    it("should filter by category", async () => {
      const results = await service.filter({
        category: "function",
      });
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.category === "function")).toBe(true);
    });

    it("should filter by single tag", async () => {
      const results = await service.filter({ tags: ["react"] });
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.tags.includes("react"))).toBe(true);
    });

    it("should filter by multiple tags (OR logic)", async () => {
      const results = await service.filter({ tags: ["react", "python"] });
      expect(results).toHaveLength(3);
    });

    it("should filter by favorite status (true)", async () => {
      const results = await service.filter({ favorite: true });
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.favorite)).toBe(true);
    });

    it("should filter by favorite status (false)", async () => {
      const results = await service.filter({ favorite: false });
      expect(results).toHaveLength(2);
      expect(results.every((s) => !s.favorite)).toBe(true);
    });

    it("should combine multiple filters with AND logic", async () => {
      const results = await service.filter({
        language: "typescript",
        favorite: true,
      });
      expect(results).toHaveLength(2);
      expect(results.every((s) => s.language === "typescript" && s.favorite)).toBe(true);
    });

    it("should combine query, language, and tags", async () => {
      const results = await service.filter({
        query: "React",
        language: "typescript",
        tags: ["hooks"],
      });
      expect(results).toHaveLength(2);
    });

    it("should return empty array when no matches", async () => {
      const results = await service.filter({
        language: "rust",
      });
      expect(results).toHaveLength(0);
    });

    it("should handle empty tags array", async () => {
      const results = await service.filter({ tags: [] });
      expect(results).toHaveLength(4); // Empty tags = no tag filtering
    });
  });

  describe("filter with sorting", () => {
    beforeEach(async () => {
      // Create test data
      await service.add({
        title: "Zebra Snippet",
        description: "Last alphabetically",
        code: "code",
        language: "javascript",
        category: "utility",
        tags: ["test"],
        favorite: false,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.add({
        title: "Apple Snippet",
        description: "First alphabetically",
        code: "code",
        language: "typescript",
        category: "function",
        tags: ["test"],
        favorite: true,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      await service.add({
        title: "Mango Snippet",
        description: "Middle alphabetically",
        code: "code",
        language: "python",
        category: "utility",
        tags: ["example"],
        favorite: false,
      });
    });

    it("should sort by title ascending", async () => {
      const results = await service.filter({
        sortBy: "title",
        sortOrder: "asc",
      });

      expect(results).toHaveLength(3);
      expect(results[0]!.title).toBe("Apple Snippet");
      expect(results[1]!.title).toBe("Mango Snippet");
      expect(results[2]!.title).toBe("Zebra Snippet");
    });

    it("should sort by title descending", async () => {
      const results = await service.filter({
        sortBy: "title",
        sortOrder: "desc",
      });

      expect(results).toHaveLength(3);
      expect(results[0]!.title).toBe("Zebra Snippet");
      expect(results[1]!.title).toBe("Mango Snippet");
      expect(results[2]!.title).toBe("Apple Snippet");
    });

    it("should sort by createdAt ascending (oldest first)", async () => {
      const results = await service.filter({
        sortBy: "createdAt",
        sortOrder: "asc",
      });

      expect(results).toHaveLength(3);
      expect(results[0]!.title).toBe("Zebra Snippet");
      expect(results[2]!.title).toBe("Mango Snippet");
    });

    it("should sort by createdAt descending (newest first)", async () => {
      const results = await service.filter({
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      expect(results).toHaveLength(3);
      expect(results[0]!.title).toBe("Mango Snippet");
      expect(results[2]!.title).toBe("Zebra Snippet");
    });

    it("should sort by language", async () => {
      const results = await service.filter({
        sortBy: "language",
        sortOrder: "asc",
      });

      expect(results[0]!.language).toBe("javascript");
      expect(results[1]!.language).toBe("python");
      expect(results[2]!.language).toBe("typescript");
    });

    it("should sort by category", async () => {
      const results = await service.filter({
        sortBy: "category",
        sortOrder: "asc",
      });

      expect(results[0]!.category).toBe("function");
      expect(results[1]!.category).toBe("utility");
      expect(results[2]!.category).toBe("utility");
    });

    it("should sort by favorite (favorites first when desc)", async () => {
      const results = await service.filter({
        sortBy: "favorite",
        sortOrder: "desc",
      });

      expect(results[0]!.favorite).toBe(true);
      expect(results[1]!.favorite).toBe(false);
      expect(results[2]!.favorite).toBe(false);
    });

    it("should default to ascending when sortOrder not specified", async () => {
      const results = await service.filter({
        sortBy: "title",
      });

      expect(results[0]!.title).toBe("Apple Snippet");
    });

    it("should filter by language and sort", async () => {
      const results = await service.filter({
        category: "utility",
        sortBy: "title",
        sortOrder: "asc",
      });

      expect(results).toHaveLength(2);
      expect(results[0]!.title).toBe("Mango Snippet");
      expect(results[1]!.title).toBe("Zebra Snippet");
    });

    it("should filter by favorite and sort", async () => {
      const results = await service.filter({
        favorite: false,
        sortBy: "language",
        sortOrder: "asc",
      });

      expect(results).toHaveLength(2);
      expect(results[0]!.language).toBe("javascript");
      expect(results[1]!.language).toBe("python");
    });

    it("should filter by tags and sort", async () => {
      const results = await service.filter({
        tags: ["test"],
        sortBy: "title",
        sortOrder: "desc",
      });

      expect(results).toHaveLength(2);
      expect(results[0]!.title).toBe("Zebra Snippet");
      expect(results[1]!.title).toBe("Apple Snippet");
    });

    it("should work without sorting (backward compatible)", async () => {
      const results = await service.filter({
        favorite: true,
      });

      expect(results).toHaveLength(1);
      expect(results[0]!.title).toBe("Apple Snippet");
    });

    it("should return all snippets when no filter or sort provided", async () => {
      const results = await service.filter();
      expect(results).toHaveLength(3);
    });
  });

  describe("search", () => {
    beforeEach(async () => {
      await service.add({
        title: "React useState Hook",
        description: "Example of useState in React",
        code: "const [count, setCount] = useState(0);",
        language: "typescript",
        category: "function",
        tags: ["react", "hooks"],
      });

      await service.add({
        title: "Python List Comprehension",
        description: "Filter even numbers",
        code: "evens = [x for x in range(10) if x % 2 == 0]",
        language: "python",
        category: "utility",
        tags: ["python", "list"],
      });

      await service.add({
        title: "TypeScript Interface",
        description: "Define a user interface",
        code: "interface User { name: string; age: number; }",
        language: "typescript",
        category: "example",
        tags: ["typescript", "types"],
      });
    });

    it("should search snippets by query string", async () => {
      const results = await service.search("React");
      expect(results).toHaveLength(1);
      expect(results[0]!.title).toContain("React");
    });

    it("should be case-insensitive", async () => {
      const results = await service.search("react");
      expect(results).toHaveLength(1);
    });

    it("should search in title, description, and code", async () => {
      const titleResults = await service.search("useState");
      expect(titleResults).toHaveLength(1);
      expect(titleResults[0]!.code).toContain("useState");

      const descResults = await service.search("interface");
      expect(descResults).toHaveLength(1);
      expect(descResults[0]!.description).toContain("interface");
    });

    it("should return empty array when no matches found", async () => {
      const results = await service.search("nonexistent");
      expect(results).toHaveLength(0);
    });

    it("should be equivalent to filter({ query })", async () => {
      const query = "TypeScript";
      const searchResults = await service.search(query);
      const filterResults = await service.filter({ query });

      expect(searchResults).toEqual(filterResults);
    });
  });

  // describe("search-delete", () => {
  //   it("should return snippets matching the query", async () => {
  //     const input1: CreateSnippetInput = {
  //       title: "Array Utilities",
  //       description: "Utilities for array manipulation",
  //       code: "const arr = [1, 2, 3];",
  //       language: "javascript",
  //       category: "utility",
  //     };
  //     const input2: CreateSnippetInput = {
  //       title: "String Utilities",
  //       description: "Utilities for string manipulation",
  //       code: "const str = 'hello';",
  //       language: "javascript",
  //       category: "utility",
  //     };

  //     await service.add(input1);
  //     await service.add(input2);

  //     const results = await service.search("array");
  //     expect(results).toHaveLength(1);
  //     expect(results[0]!.title).toBe("Array Utilities");
  //   });

  //   it("should return empty array when no matches found", async () => {
  //     const input: CreateSnippetInput = {
  //       title: "Math Utilities",
  //       description: "Utilities for math operations",
  //       code: "const sum = (a, b) => a + b;",
  //       language: "javascript",
  //       category: "utility",
  //     };

  //     await service.add(input);

  //     const results = await service.search("string");
  //     expect(results).toHaveLength(0);
  //   });

  //   it("should perform case-insensitive search", async () => {
  //     const input: CreateSnippetInput = {
  //       title: "Date Utilities",
  //       description: "Utilities for date manipulation",
  //       code: "const now = new Date();",
  //       language: "javascript",
  //       category: "utility",
  //     };

  //     await service.add(input);

  //     const results = await service.search("DATE");
  //     expect(results).toHaveLength(1);
  //     expect(results[0]!.title).toBe("Date Utilities");
  //   });

  //   it("should search by title", async () => {
  //     const input: CreateSnippetInput = {
  //       title: "Auth Middleware",
  //       description: "Middleware for authentication",
  //       code: "function auth(req, res, next) { /* ... */ }",
  //       language: "typescript",
  //       category: "function",
  //     };

  //     await service.add(input);

  //     const results = await service.search("auth");
  //     expect(results).toHaveLength(1);
  //     expect(results[0]!.title).toBe("Auth Middleware");
  //   });

  //   it("should search by description", async () => {
  //     const input: CreateSnippetInput = {
  //       title: "Test",
  //       description: "Authentication snippet for testing",
  //       code: "test",
  //       language: "typescript",
  //       category: "utility",
  //     };

  //     await service.add(input);

  //     const results = await service.search("authentication");
  //     expect(results).toHaveLength(1);
  //   });

  //   it("should search by tags", async () => {
  //     const input: CreateSnippetInput = {
  //       title: "Setup",
  //       description: "Basic setup for server",
  //       code: "console.log('testing');",
  //       language: "javascript",
  //       category: "utility",
  //       tags: ["express", "nodejs", "web"],
  //     };

  //     await service.add(input);

  //     const results = await service.search("express");
  //     expect(results).toHaveLength(1);
  //   });
  // });

  // describe("filterByLanguage", () => {
  //   it("should return snippets matching the specified language", async () => {
  //     const input1: CreateSnippetInput = {
  //       title: "JavaScript Snippet",
  //       description: "A snippet in JavaScript",
  //       code: 'console.log("Hello, JavaScript!");',
  //       language: "javascript",
  //       category: "utility",
  //     };
  //     const input2: CreateSnippetInput = {
  //       title: "Python Snippet",
  //       description: "A snippet in Python",
  //       code: 'print("Hello, Python!")',
  //       language: "python",
  //       category: "utility",
  //     };
  //     const input3: CreateSnippetInput = {
  //       title: "Another JavaScript Snippet",
  //       description: "Another snippet in JavaScript",
  //       code: 'alert("Hello again!");',
  //       language: "javascript",
  //       category: "utility",
  //     };
  //     const input4: CreateSnippetInput = {
  //       title: "TypeScript Snippet",
  //       description: "A snippet in TypeScript",
  //       code: 'console.log("Hello, TypeScript!");',
  //       language: "typescript",
  //       category: "utility",
  //     };

  //     await service.add(input1);
  //     await service.add(input2);
  //     await service.add(input3);
  //     await service.add(input4);

  //     const jsSnippets = await service.filterByLanguage("javascript");
  //     expect(jsSnippets).toHaveLength(2);
  //     expect(jsSnippets.every((snippet) => snippet.language === "javascript")).toBe(true);

  //     const pythonSnippets = await service.filterByLanguage("python");
  //     expect(pythonSnippets).toHaveLength(1);
  //     expect(pythonSnippets[0]!.language).toBe("python");

  //     const tsSnippets = await service.filterByLanguage("typescript");
  //     expect(tsSnippets).toHaveLength(1);
  //     expect(tsSnippets[0]!.language).toBe("typescript");
  //   });
  // });

  // describe("filterByTag", () => {
  //   it("should return snippets matching the specified tag", async () => {
  //     const input1: CreateSnippetInput = {
  //       title: "Express Setup",
  //       description: "Basic setup for Express.js",
  //       code: "const express = require('express');",
  //       language: "javascript",
  //       category: "utility",
  //       tags: ["express", "nodejs"],
  //     };
  //     const input2: CreateSnippetInput = {
  //       title: "Koa Setup",
  //       description: "Basic setup for Koa.js",
  //       code: "const Koa = require('koa');",
  //       language: "javascript",
  //       category: "utility",
  //       tags: ["koa", "nodejs"],
  //     };
  //     const input3: CreateSnippetInput = {
  //       title: "Django Setup",
  //       description: "Basic setup for Django",
  //       code: "import django",
  //       language: "python",
  //       category: "utility",
  //       tags: ["django", "python"],
  //     };

  //     await service.add(input1);
  //     await service.add(input2);
  //     await service.add(input3);

  //     const expressSnippets = await service.filterByTag("express");
  //     expect(expressSnippets).toHaveLength(1);
  //     expect(expressSnippets[0]!.tags).toContain("express");

  //     const nodejsSnippets = await service.filterByTag("nodejs");
  //     expect(nodejsSnippets).toHaveLength(2);
  //     expect(nodejsSnippets.every((snippet) => snippet.tags.includes("nodejs"))).toBe(true);

  //     const djangoSnippets = await service.filterByTag("django");
  //     expect(djangoSnippets).toHaveLength(1);
  //     expect(djangoSnippets[0]!.tags).toContain("django");
  //   });
  // });

  // describe("getFavorites", () => {
  //   it("should return only favorite snippets", async () => {
  //     const input1: CreateSnippetInput = {
  //       title: "Fav Snippet 1",
  //       description: "First favorite snippet",
  //       code: "code 1",
  //       language: "javascript",
  //       category: "utility",
  //       favorite: true,
  //     };
  //     const input2: CreateSnippetInput = {
  //       title: "Fav Snippet 2",
  //       description: "Second favorite snippet",
  //       code: "code 2",
  //       language: "javascript",
  //       category: "utility",
  //       favorite: true,
  //     };
  //     const input3: CreateSnippetInput = {
  //       title: "Non-Fav Snippet",
  //       description: "Not a favorite snippet",
  //       code: "code 3",
  //       language: "javascript",
  //       category: "utility",
  //       favorite: false,
  //     };

  //     await service.add(input1);
  //     await service.add(input2);
  //     await service.add(input3);

  //     const favorites = await service.getFavorites();
  //     expect(favorites).toHaveLength(2);
  //     expect(favorites.every((snippet) => snippet.favorite)).toBe(true);
  //   });

  //   it("should return empty array when no favorites", async () => {
  //     const input1: CreateSnippetInput = {
  //       title: "Non-Fav Snippet 1",
  //       description: "Not a favorite snippet",
  //       code: "code 1",
  //       language: "javascript",
  //       category: "utility",
  //       favorite: false,
  //     };
  //     const input2: CreateSnippetInput = {
  //       title: "Non-Fav Snippet 2",
  //       description: "Also not a favorite snippet",
  //       code: "code 2",
  //       language: "javascript",
  //       category: "utility",
  //       favorite: false,
  //     };

  //     await service.add(input1);
  //     await service.add(input2);

  //     const favorites = await service.getFavorites();
  //     expect(favorites).toHaveLength(0);
  //   });
  // });

  // describe('toggleFavorite', () => {});
});
