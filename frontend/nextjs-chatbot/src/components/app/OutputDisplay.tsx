import { Textarea } from "@/components/ui/textarea";

interface OutputDisplayProps {
  finalAnswer?: string;
  isLoading?: boolean;
}

export function OutputDisplay({ finalAnswer = '', isLoading = false }: OutputDisplayProps) {
  if (isLoading) {
    return (
      <Textarea
        readOnly
        placeholder="Generating AI response..."
        className="bg-gray-900 h-full resize-none text-blue-400"
        value="Generating your AI response...\n\nThis may take a few moments as we:\n• Perform web research\n• Assemble the perfect prompt\n• Query our AI models\n• Generate your response"
      />
    );
  }

  if (!finalAnswer) {
    return (
      <Textarea
        readOnly
        placeholder="The final AI response will appear here..."
        className="bg-gray-900 h-full resize-none"
      />
    );
  }

  return (
    <Textarea
      readOnly
      className="bg-gray-900 h-full resize-none text-green-400"
      value={finalAnswer}
    />
  );
}
