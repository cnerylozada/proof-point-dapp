import { Badge } from "@/components/ui/badge";

export type Difficulty = "easy" | "normal" | "hard";

type PangramHeaderProps = {
  wordCount: number;
  difficulty: Difficulty;
};

const difficultyVariant = {
  easy: "secondary",
  normal: "outline",
  hard: "destructive",
} as const;

export const PangramHeader = ({ wordCount, difficulty }: PangramHeaderProps) => (
  <header className="flex items-start justify-between gap-4">
    <div className="flex flex-col gap-1">
      <h2 className="text-lg font-semibold tracking-tight">Pangram</h2>
      <p className="text-sm text-muted-foreground">
        Unscramble {wordCount === 1 ? "the word" : `all ${wordCount} words`}.
      </p>
    </div>
    <Badge variant={difficultyVariant[difficulty]} className="capitalize">
      {difficulty}
    </Badge>
  </header>
);
