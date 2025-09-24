import { Textarea } from "@/components/ui/textarea";
import { useAppStore } from "@/lib/store";

export function PromptDisplay() {
  // Subscribe to the new, live assembledMetaPrompt state
  const assembledMetaPrompt = useAppStore((state) => state.assembledMetaPrompt);

  return (
    <Textarea
      readOnly
      className="bg-gray-900 h-full resize-none text-lime-400"
      value={assembledMetaPrompt}
    />
  );
}
