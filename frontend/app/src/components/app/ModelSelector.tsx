// src/components/app/ModelSelector.tsx
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppStore } from "@/lib/store";

export function ModelSelector() {
  const { availableModels, selectedModel, selectModel } = useAppStore();

  if (availableModels.length === 0) {
    return <div className="text-sm text-gray-400">Loading models...</div>;
  }

  return (
    <Select value={selectedModel || ''} onValueChange={selectModel}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an AI Model" />
      </SelectTrigger>
      <SelectContent>
        {availableModels.map((modelId) => (
          <SelectItem key={modelId} value={modelId}>
            {modelId}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
