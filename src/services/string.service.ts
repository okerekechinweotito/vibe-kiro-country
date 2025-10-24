import type { Strings_GET } from "../models/string.schema.ts";
import { analyzedStrings } from "./db.service.ts";

export class StringConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StringConflictError";
  }
}

export class StringNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StringNotFoundError";
  }
}

export class StringFactory {
  private readonly str: string;

  constructor(str: string) {
    this.str = str;
  }
  analyzeString = async (): Promise<Strings_GET> => {
    if (analyzedStrings.has(this.str)) {
      throw new StringConflictError("String already exists in the system");
    }
    const hash = await this.getHashString();
    const result: Strings_GET = {
      id: hash,
      value: this.str,
      properties: {
        length: this.getStringLength(),
        is_palindrome: this.isPalindrome(),
        unique_characters: this.getUniqueCharCount(),
        word_count: this.getWordCount(),
        sha256_hash: hash,
        character_frequency_map: this.getCharFrequencyMap(),
      },
      created_at: new Date().toISOString(),
    };
    analyzedStrings.set(this.str, result);
    return result;
  };
  getCharFrequencyMap = (): { [key: string]: number } => {
    const charFrequencyMap: { [key: string]: number } = {};
    for (const char of this.str) {
      charFrequencyMap[char] = (charFrequencyMap[char] || 0) + 1;
    }
    return charFrequencyMap;
  };

  getUniqueCharCount = (): number => {
    return new Set(this.str).size;
  };

  getStringLength = (): number => {
    return this.str.length;
  };

  getWordCount = (): number => {
    const words = this.str.trim().split(/\s+/);
    return words[0] === "" ? 0 : words.length;
  };

  isPalindrome = (): boolean => {
    const lowerCaseStr = this.str.toLowerCase().replace(/\s/g, "");
    return lowerCaseStr === lowerCaseStr.split("").reverse().join("");
  };

  getHashString = async (): Promise<string> => {
    const buffer = await crypto.subtle.digest(
      "sha-256",
      new TextEncoder().encode(this.str)
    );
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  };
}

export const getStringByValue = (value: string): Strings_GET => {
  for (const analyzedString of analyzedStrings.values()) {
    if (analyzedString.value === value) {
      return analyzedString;
    }
  }
  throw new StringNotFoundError("String with the given ID was not found");
};

export const getAllStrings = (filters: {
  is_palindrome?: boolean;
  min_length?: number;
  max_length?: number;
  word_count?: number;
  contains_character?: string;
}): Strings_GET[] => {
  let strings = Array.from(analyzedStrings.values());

  if (filters.is_palindrome !== undefined) {
    strings = strings.filter(
      (s) => s.properties.is_palindrome === filters.is_palindrome
    );
  }

  if (filters.min_length !== undefined) {
    strings = strings.filter((s) => s.properties.length >= filters.min_length!);
  }

  if (filters.max_length !== undefined) {
    strings = strings.filter((s) => s.properties.length <= filters.max_length!);
  }

  if (filters.word_count !== undefined) {
    strings = strings.filter(
      (s) => s.properties.word_count === filters.word_count!
    );
  }

  if (filters.contains_character !== undefined) {
    strings = strings.filter((s) =>
      s.value.includes(filters.contains_character!)
    );
  }

  return strings;
};

export const deleteStringByValue = (value: string): void => {
  const stringExists = analyzedStrings.has(value);
  if (!stringExists) {
    throw new StringNotFoundError("String does not exist in the system");
  }
  analyzedStrings.delete(value);
};

