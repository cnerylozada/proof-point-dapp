import { GoogleGenAI } from "@google/genai";

// Server-only: reads GEMINI_API_KEY from the environment. Never import from client components.
export const gemini = new GoogleGenAI({});

export const GEMINI_MODEL = "gemini-3.1-flash-lite";
