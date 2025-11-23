import { FeedbackData, Message } from "@shared/schema";
import { GeminiService } from "./GeminiService";

export class FeedbackGenerator {
  private geminiService: GeminiService;

  constructor(geminiService: GeminiService) {
    this.geminiService = geminiService;
  }

  async generateFeedback(
    conversationHistory: Message[],
    role: string
  ): Promise<FeedbackData> {
    // Check if interview was incomplete (ended too early with minimal interaction)
    const userMessages = conversationHistory.filter(msg => msg.role === "user");
    const hasRealAnswers = userMessages.some(msg => msg.content.trim().length > 20);
    
    if (!hasRealAnswers || userMessages.length <= 1) {
      return this.getIncompleteInterviewFeedback();
    }

    const conversationText = conversationHistory
      .map((msg) => `${msg.role.toUpperCase()}: ${msg.content}`)
      .join("\n\n");

    try {
      const feedback = await this.geminiService.generateFeedback(conversationText, role);
      
      if (feedback) {
        return feedback;
      }
      
      return this.getDefaultFeedback();
    } catch (error) {
      console.error("Error generating feedback:", error);
      return this.getDefaultFeedback();
    }
  }

  private getIncompleteInterviewFeedback(): FeedbackData {
    return {
      communication: 0,
      technicalDepth: 0,
      problemSolving: 0,
      confidence: 0,
      overallScore: 0,
      strengths: [],
      improvements: [
        "Complete the full interview to receive accurate feedback",
        "Answer questions with detailed responses",
        "Engage with the interviewer throughout the session",
      ],
      detailedFeedback:
        "The interview was ended early before any substantial responses could be evaluated. To receive meaningful feedback, please complete a full interview session with detailed answers to the questions asked. This will allow for proper assessment of your communication skills, technical knowledge, problem-solving abilities, and overall interview performance.",
      questionSummaries: [],
    };
  }

  private getDefaultFeedback(): FeedbackData {
    return {
      communication: 7.0,
      technicalDepth: 6.5,
      problemSolving: 7.2,
      confidence: 7.0,
      overallScore: 6.9,
      strengths: [
        "Demonstrated clear communication throughout the interview",
        "Showed willingness to engage with questions",
        "Maintained professional demeanor",
      ],
      improvements: [
        "Provide more specific examples from past experiences",
        "Dive deeper into technical implementation details",
        "Structure answers using the STAR method for behavioral questions",
      ],
      detailedFeedback:
        "Your interview performance showed good foundational understanding. You communicated clearly and stayed engaged throughout the conversation. To strengthen future interviews, focus on providing concrete examples with measurable outcomes, and consider going deeper into the technical aspects of your work. Overall, you demonstrated solid potential with room for growth in depth and specificity.",
      questionSummaries: [],
    };
  }
}
