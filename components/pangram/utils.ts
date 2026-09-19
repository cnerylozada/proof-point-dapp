import { z } from "zod";

const wordSchema = z
  .string()
  .trim()
  .min(1, "Required")
  .regex(/^[a-zA-Z]+$/, "Letters only");

export const validateWord = (value: string) => {
  const result = wordSchema.safeParse(value);
  return result.success || result.error.issues[0].message;
};

export const shuffleLetters = (word: string) => {
  const letters = word.split("");
  for (let i = letters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [letters[i], letters[j]] = [letters[j], letters[i]];
  }
  return letters;
};
