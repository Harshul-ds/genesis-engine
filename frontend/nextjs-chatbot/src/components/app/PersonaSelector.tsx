import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function PersonaSelector() {
  // Get the live data and the selection function from the store
  const { availablePersonas, selectedPersonaTerm, selectPersona } = useAppStore();

  return (
    <div className="flex flex-col gap-2">
      {availablePersonas.map((persona) => (
        <Button
          key={persona.term}
          variant={selectedPersonaTerm === persona.term ? "default" : "outline"}
          className="justify-start"
          onClick={() => selectPersona(persona.term)}
        >
          {persona.term}
        </Button>
      ))}
    </div>
  );
}
