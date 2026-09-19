"use client";

import { useMemo } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PangramHeader, type Difficulty } from "./PangramHeader";
import { PangramWordHint } from "./PangramWordHint";
import { shuffleLetters, validateWord } from "./utils";

type PangramGameProps = {
  words: string[];
  difficulty: Difficulty;
  onSubmit: (guesses: string[]) => void;
};

type FormValues = {
  guesses: { value: string }[];
};

export const PangramGame = ({
  words,
  difficulty,
  onSubmit,
}: PangramGameProps) => {
  const scrambledWords = useMemo(() => words.map(shuffleLetters), [words]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { guesses: words.map(() => ({ value: "" })) },
  });

  const { fields } = useFieldArray({ control, name: "guesses" });

  const submit = (values: FormValues) =>
    onSubmit(values.guesses.map((guess) => guess.value));

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex w-full flex-col gap-6 rounded-xl border border-border bg-card p-6 text-card-foreground shadow-sm"
    >
      <PangramHeader wordCount={words.length} difficulty={difficulty} />

      <div className="flex flex-col gap-5">
        {fields.map((field, index) => {
          const letters = scrambledWords[index];
          const error = errors.guesses?.[index]?.value;
          const inputId = `pangram-word-${index}`;

          return (
            <div key={field.id} className="flex flex-col gap-2">
              <PangramWordHint
                inputId={inputId}
                index={index}
                letters={letters}
              />

              <Input
                id={inputId}
                autoComplete="off"
                spellCheck={false}
                placeholder="Your guess"
                aria-invalid={!!error}
                {...register(`guesses.${index}.value`, {
                  validate: validateWord,
                })}
              />
              {error && (
                <span className="text-sm text-destructive">{error.message}</span>
              )}
            </div>
          );
        })}
      </div>

      <Button type="submit" size="lg" disabled={isSubmitting}>
        Submit
      </Button>
    </form>
  );
};
