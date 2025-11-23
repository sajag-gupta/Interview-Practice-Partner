import { Mic, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InterviewMode } from "@shared/schema";

interface ModeToggleProps {
  mode: InterviewMode;
  onModeChange: (mode: InterviewMode) => void;
}

export function ModeToggle({ mode, onModeChange }: ModeToggleProps) {
  return (
    <div className="flex gap-2 p-1 bg-muted rounded-md">
      <Button
        variant={mode === "voice" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("voice")}
        className="flex-1"
        data-testid="button-mode-voice"
      >
        <Mic className="h-4 w-4 mr-2" />
        Voice
      </Button>
      <Button
        variant={mode === "chat" ? "default" : "ghost"}
        size="sm"
        onClick={() => onModeChange("chat")}
        className="flex-1"
        data-testid="button-mode-chat"
      >
        <MessageSquare className="h-4 w-4 mr-2" />
        Chat
      </Button>
    </div>
  );
}
