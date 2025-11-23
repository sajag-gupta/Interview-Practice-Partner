import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionCardProps {
  questionNumber: number;
  question: string;
  category: "Technical" | "Behavioral";
  difficulty?: "Easy" | "Medium" | "Hard";
}

export function QuestionCard({
  questionNumber,
  question,
  category,
  difficulty = "Medium",
}: QuestionCardProps) {
  const difficultyColors = {
    Easy: "bg-green-500/10 text-green-700 dark:text-green-400",
    Medium: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400",
    Hard: "bg-red-500/10 text-red-700 dark:text-red-400",
  };

  return (
    <Card className="p-6" data-testid="card-question">
      <div className="flex items-start justify-between gap-4 mb-4">
        <Badge variant="outline" data-testid="badge-question-number">
          Q{questionNumber}
        </Badge>
        <div className="flex gap-2">
          <Badge variant="secondary" data-testid="badge-category">
            {category}
          </Badge>
          <Badge
            className={difficultyColors[difficulty]}
            data-testid="badge-difficulty"
          >
            {difficulty}
          </Badge>
        </div>
      </div>
      <h3 className="text-xl font-medium leading-relaxed" data-testid="text-question">
        {question}
      </h3>
    </Card>
  );
}
