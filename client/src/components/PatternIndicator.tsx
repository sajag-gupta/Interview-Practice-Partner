import { Badge } from "@/components/ui/badge";
import { UserPattern } from "@shared/schema";
import { HelpCircle, Zap, MessageCircle, AlertTriangle, Brain } from "lucide-react";

interface PatternIndicatorProps {
  pattern: UserPattern;
  confidence: number;
}

export function PatternIndicator({ pattern, confidence }: PatternIndicatorProps) {
  const patternConfig: Record<UserPattern, { label: string; icon: typeof Brain; color: string }> = {
    confused: {
      label: "Guidance Mode",
      icon: HelpCircle,
      color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/20",
    },
    efficient: {
      label: "Efficient Mode",
      icon: Zap,
      color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20",
    },
    chatty: {
      label: "Focus Mode",
      icon: MessageCircle,
      color: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20",
    },
    edge_case: {
      label: "Structure Mode",
      icon: AlertTriangle,
      color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20",
    },
    unknown: {
      label: "Analyzing...",
      icon: Brain,
      color: "bg-muted text-muted-foreground border-border",
    },
  };

  const config = patternConfig[pattern];
  const Icon = config.icon;

  if (pattern === "unknown" || confidence < 0.3) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <Badge className={`${config.color} border`} data-testid="badge-pattern">
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {Math.round(confidence * 100)}% confident
      </span>
    </div>
  );
}
