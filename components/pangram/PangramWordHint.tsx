import { Label } from "@/components/ui/label";

type PangramWordHintProps = {
  inputId: string;
  index: number;
  letters: string[];
};

export const PangramWordHint = ({
  inputId,
  index,
  letters,
}: PangramWordHintProps) => (
  <>
    <div className="flex items-center justify-between">
      <Label htmlFor={inputId}>Word {index + 1}</Label>
      <span className="text-xs text-muted-foreground">
        {letters.length} letters
      </span>
    </div>

    <div className="flex flex-wrap gap-1.5" aria-hidden>
      {letters.map((letter, letterIndex) => (
        <span
          key={letterIndex}
          className="flex size-9 items-center justify-center rounded-md border border-border bg-muted font-mono text-base font-semibold uppercase"
        >
          {letter}
        </span>
      ))}
    </div>
  </>
);
