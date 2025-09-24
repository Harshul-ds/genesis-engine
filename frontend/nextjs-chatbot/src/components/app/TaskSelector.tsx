import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";

export function TaskSelector() {
  // Get the live data and the selection function from the store
  const { availableTasks, selectedTaskTerm, selectTask } = useAppStore();

  return (
    <div className="flex flex-wrap gap-2">
      {availableTasks.map((task) => (
        <Button
          key={task.term}
          variant={selectedTaskTerm === task.term ? "default" : "secondary"}
          onClick={() => selectTask(task.term)}
        >
          {task.term}
        </Button>
      ))}
    </div>
  );
}
