"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generatePangramWords, type Difficulty } from "@/services/pangram";
import { PangramGame } from "./PangramGame";

const difficulties: Difficulty[] = ["easy", "normal", "hard"];

export const PangramSession = () => {
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null);
  const [words, setWords] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);

  const startGame = async (selected: Difficulty) => {
    setDifficulty(selected);
    setFailed(false);

    try {
      const { words } = await generatePangramWords(selected);
      if (words.length > 0) {
        setWords(words);
        return;
      }
    } catch (error) {
      console.error(error);
    }

    setFailed(true);
    setDifficulty(null);
  };

  if (difficulty && words) {
    return (
      <PangramGame
        words={words}
        difficulty={difficulty}
        onSubmit={(guesses) => console.log(guesses)}
      />
    );
  }

  const isLoading = difficulty !== null;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold tracking-tight">Pangram</h2>
        <p className="text-sm text-muted-foreground">
          Choose a difficulty to start.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {difficulties.map((option) => (
          <Button
            key={option}
            variant={difficulty === option ? "default" : "outline"}
            size="lg"
            disabled={isLoading}
            onClick={() => startGame(option)}
            className="capitalize"
          >
            {difficulty === option && <Loader2 className="animate-spin" />}
            {option}
          </Button>
        ))}
      </div>

      {failed && (
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t generate words. Please pick a difficulty to try again.
        </p>
      )}
    </div>
  );
};
