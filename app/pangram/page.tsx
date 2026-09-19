import { PangramSession } from "@/components/pangram/PangramSession";

export default function PangramPage() {
  return (
    <div className="flex w-full flex-col items-center px-4 py-16">
      <div className="w-full max-w-md">
        <PangramSession />
      </div>
    </div>
  );
}
