"use server";

import { gemini, GEMINI_MODEL } from "@/libs/gemini";

export type Difficulty = "easy" | "normal" | "hard";

// The joined answer must fit in a single Noir Field (31 bytes).
const MAX_TOTAL_LETTERS = 31;
const MAX_ATTEMPTS = 3;

const difficultyRules: Record<Difficulty, string> = {
  easy: "2 words, each 4-6 letters, very common everyday vocabulary (e.g. theme 'kitchen': 'spoon', 'plate').",
  normal:
    "3 words, each 5-8 letters, common but less obvious vocabulary (e.g. theme 'ocean': 'coral', 'tide', 'whale').",
  hard: "3 or 4 words, each 6-9 letters, less frequent but real vocabulary (e.g. theme 'astronomy': 'nebula', 'eclipse', 'orbit').",
};

const buildPrompt = (difficulty: Difficulty) => `
You create puzzles for a word-unscrambling game. The player sees each word with its letters shuffled and must guess the original words.

Pick ONE theme, then return words that all clearly belong to that theme, so the theme works as a hint.

Difficulty "${difficulty}": ${difficultyRules[difficulty]}

Rules:
- English common nouns only, lowercase letters a-z only. No spaces, hyphens, accents, digits, plurals or proper nouns.
- No repeated words, and no word containing another word from the list.
- Avoid words whose shuffled letters also spell another common word (e.g. "listen"/"silent").
- The total number of letters across all words must be ${MAX_TOTAL_LETTERS} or fewer.
- Pick a different, varied theme each time.
`;

const responseJsonSchema = {
  type: "object",
  properties: {
    theme: { type: "string" },
    words: { type: "array", items: { type: "string" }, minItems: 2, maxItems: 4 },
  },
  required: ["theme", "words"],
};

type PangramWords = { theme: string; words: string[] };

const isValid = ({ words }: PangramWords) =>
  words.length > 0 &&
  words.every((word) => /^[a-z]+$/.test(word)) &&
  new Set(words).size === words.length &&
  words.join("").length <= MAX_TOTAL_LETTERS;

export const generatePangramWords = async (
  difficulty: Difficulty,
): Promise<PangramWords> => {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const response = await gemini.models.generateContent({
        model: GEMINI_MODEL,
        contents: buildPrompt(difficulty),
        config: {
          responseMimeType: "application/json",
          responseJsonSchema,
          temperature: 1,
        },
      });

      const result = JSON.parse(response.text ?? "{}");
      const words: unknown[] = Array.isArray(result.words) ? result.words : [];
      const normalized = {
        theme: typeof result.theme === "string" ? result.theme : "",
        words: words.map((word) => String(word).trim().toLowerCase()),
      };

      if (isValid(normalized)) return normalized;
    } catch (error) {
      console.error(`Gemini attempt ${attempt + 1} failed`, error);
    }
  }

  return { theme: "", words: [] };
};
