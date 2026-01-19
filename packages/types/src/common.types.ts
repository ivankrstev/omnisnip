/**
 * Commonly used primitive and domain-specific types shared across the application.
 */

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
