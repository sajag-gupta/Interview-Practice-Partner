import { UserPattern, PatternSignals, AnswerEvaluation } from "@shared/schema";

export class PatternDetector {
  private signals: PatternSignals[] = [];
  private currentPattern: UserPattern = "unknown";
  private confidence: number = 0;

  addSignal(evaluation: AnswerEvaluation, responseTime: number, message: string): void {
    const signal: PatternSignals = {
      responseLength: message.length,
      responseTime,
      clarityScore: evaluation.clarity,
      offTopicCount: evaluation.isOffTopic ? 1 : 0,
      questionAskedCount: this.countQuestionsInResponse(message),
      technicalDepth: evaluation.depth === "deep" ? 3 : evaluation.depth === "moderate" ? 2 : 1,
    };

    this.signals.push(signal);
    this.analyzePattern();
  }

  private countQuestionsInResponse(message: string): number {
    return (message.match(/\?/g) || []).length;
  }

  private analyzePattern(): void {
    if (this.signals.length < 2) {
      this.currentPattern = "unknown";
      this.confidence = 0;
      return;
    }

    const recent = this.signals.slice(-3);
    const avgLength = recent.reduce((sum, s) => sum + s.responseLength, 0) / recent.length;
    const avgClarity = recent.reduce((sum, s) => sum + s.clarityScore, 0) / recent.length;
    const offTopicRate = recent.reduce((sum, s) => sum + s.offTopicCount, 0) / recent.length;
    const questionRate = recent.reduce((sum, s) => sum + s.questionAskedCount, 0) / recent.length;
    const avgDepth = recent.reduce((sum, s) => sum + s.technicalDepth, 0) / recent.length;

    let detectedPattern: UserPattern = "unknown";
    let confidence = 0;

    if (avgLength < 15 || avgClarity < 2.5) {
      detectedPattern = "edge_case";
      confidence = Math.min(0.85, 0.5 + (this.signals.length * 0.1));
    }
    else if ((avgClarity < 6 && questionRate > 0.5) || (avgClarity < 5 && avgDepth < 1.8)) {
      detectedPattern = "confused";
      confidence = Math.min(0.9, 0.6 + (this.signals.length * 0.1));
    }
    else if (avgLength > 40 && avgLength < 250 && avgClarity >= 7 && avgDepth >= 2 && offTopicRate < 0.2) {
      detectedPattern = "efficient";
      confidence = Math.min(0.95, 0.7 + (this.signals.length * 0.08));
    }
    else if (avgLength > 400 || offTopicRate > 0.4) {
      detectedPattern = "chatty";
      confidence = Math.min(0.88, 0.6 + (this.signals.length * 0.1));
    }

    this.currentPattern = detectedPattern;
    this.confidence = confidence;
  }

  getPattern(): { pattern: UserPattern; confidence: number } {
    return {
      pattern: this.currentPattern,
      confidence: this.confidence,
    };
  }

  reset(): void {
    this.signals = [];
    this.currentPattern = "unknown";
    this.confidence = 0;
  }
}
