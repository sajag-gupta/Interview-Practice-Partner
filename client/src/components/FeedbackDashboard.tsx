import { MessageSquare, Brain, Lightbulb, TrendingUp, Target } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ScoreBar } from "./ScoreBar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

interface FeedbackData {
  communication: number;
  technicalDepth: number;
  problemSolving: number;
  confidence: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
}

interface FeedbackDashboardProps {
  feedback: FeedbackData;
  onExportPDF?: () => void;
}

export function FeedbackDashboard({ feedback, onExportPDF }: FeedbackDashboardProps) {
  // Ensure all scores are numbers
  const numericFeedback = {
    ...feedback,
    communication: typeof feedback.communication === 'number' ? feedback.communication : parseFloat(String(feedback.communication)) || 0,
    technicalDepth: typeof feedback.technicalDepth === 'number' ? feedback.technicalDepth : parseFloat(String(feedback.technicalDepth)) || 0,
    problemSolving: typeof feedback.problemSolving === 'number' ? feedback.problemSolving : parseFloat(String(feedback.problemSolving)) || 0,
    confidence: typeof feedback.confidence === 'number' ? feedback.confidence : parseFloat(String(feedback.confidence)) || 0,
    overallScore: typeof feedback.overallScore === 'number' ? feedback.overallScore : parseFloat(String(feedback.overallScore)) || 0,
  };

  return (
    <div className="space-y-6 p-6" data-testid="feedback-dashboard">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Interview Feedback</h2>
        <Button onClick={onExportPDF} variant="outline" data-testid="button-export-pdf">
          Export PDF
        </Button>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-center mb-6">
          <div className="relative">
            <svg className="w-32 h-32">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                className="text-muted"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="currentColor"
                strokeWidth="8"
                strokeDasharray={`${(numericFeedback.overallScore / 10) * 351.86} 351.86`}
                strokeLinecap="round"
                className="text-primary -rotate-90 origin-center"
                style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-bold" data-testid="text-overall-score">
                {numericFeedback.overallScore.toFixed(1)}
              </span>
              <span className="text-sm text-muted-foreground">Overall</span>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div data-testid="score-communication">
            <ScoreBar
              label="Communication"
              score={numericFeedback.communication}
              icon={<MessageSquare className="h-4 w-4" />}
            />
          </div>
          <div data-testid="score-technical">
            <ScoreBar
              label="Technical Depth"
              score={numericFeedback.technicalDepth}
              icon={<Brain className="h-4 w-4" />}
            />
          </div>
          <div data-testid="score-problem-solving">
            <ScoreBar
              label="Problem Solving"
              score={numericFeedback.problemSolving}
              icon={<Lightbulb className="h-4 w-4" />}
            />
          </div>
          <div data-testid="score-confidence">
            <ScoreBar
              label="Confidence"
              score={numericFeedback.confidence}
              icon={<TrendingUp className="h-4 w-4" />}
            />
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Target className="h-5 w-5" />
          Detailed Feedback
        </h3>
        <p className="text-sm leading-relaxed mb-4" data-testid="text-detailed-feedback">
          {feedback.detailedFeedback}
        </p>

        <Separator className="my-4" />

        <div className="space-y-4">
          <div data-testid="section-strengths">
            <h4 className="font-medium text-sm text-green-600 dark:text-green-400 mb-2">
              Strengths
            </h4>
            <ul className="space-y-1">
              {feedback.strengths.map((strength, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`strength-${idx}`}>
                  <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
                  {strength}
                </li>
              ))}
            </ul>
          </div>

          <div data-testid="section-improvements">
            <h4 className="font-medium text-sm text-yellow-600 dark:text-yellow-400 mb-2">
              Areas for Improvement
            </h4>
            <ul className="space-y-1">
              {feedback.improvements.map((improvement, idx) => (
                <li key={idx} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`improvement-${idx}`}>
                  <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">→</span>
                  {improvement}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
