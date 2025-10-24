import type { Strings_GET } from "../models/string.schema.ts";

export class QueryParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueryParseError";
  }
}

export class ConflictingFiltersError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictingFiltersError";
  }
}

export interface ParsedFilters {
  is_palindrome?: boolean;
  min_length?: number;
  max_length?: number;
  word_count?: number;
  contains_character?: string;
}

export const parseNaturalLanguageQuery = (query: string): ParsedFilters => {
  const lowerCaseQuery = query.toLowerCase();
  const filters: ParsedFilters = {};

  if (lowerCaseQuery.includes("palindromic")) {
    filters.is_palindrome = true;
  }

  if (lowerCaseQuery.includes("single word")) {
    filters.word_count = 1;
  }

  const longerThanMatch = lowerCaseQuery.match(/longer than (\d+) characters/);
  if (longerThanMatch) {
    filters.min_length = parseInt(longerThanMatch[1], 10) + 1;
  }

  const containsLetterMatch = lowerCaseQuery.match(
    /containing the letter (\w)/
  );
  if (containsLetterMatch) {
    filters.contains_character = containsLetterMatch[1];
  }

  if (lowerCaseQuery.includes("first vowel")) {
    filters.contains_character = "a";
  }

  if (Object.keys(filters).length === 0) {
    throw new QueryParseError("Unable to parse natural language query");
  }

  if (
    filters.min_length !== undefined &&
    filters.max_length !== undefined &&
    filters.min_length > filters.max_length
  ) {
    throw new ConflictingFiltersError(
      "Query parsed but resulted in conflicting filters"
    );
  }

  return filters;
};
