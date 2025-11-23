import { Progress } from "@/components/ui/progress";

interface ScoreBarProps {
  label: string;
  score: number;
  maxScore?: number;
  icon?: React.ReactNode;
}

export function ScoreBar({ label, score, maxScore = 10, icon }: ScoreBarProps) {
  // Ensure score is a number
  const numericScore = typeof score === 'number' ? score : parseFloat(String(score)) || 0;
  const percentage = (numericScore / maxScore) * 100;
  
  const getColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <div className="space-y-2" data-testid={`score-bar-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon && <span className="text-muted-foreground">{icon}</span>}
          <span className="text-sm font-medium">{label}</span>
        </div>
        <span className={`text-sm font-semibold ${getColor(numericScore)}`} data-testid="text-score-value">
          {numericScore.toFixed(1)}/10
        </span>
      </div>
      <Progress value={percentage} className="h-2" />
    </div>
  );
}
