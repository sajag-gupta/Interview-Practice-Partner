import { z } from "zod";

// Interview Types
export type JobRole = "SDE" | "DevOps" | "Data Analyst" | "BA" | "PM" | "Sales" | "Support" | "Retail";

export type InterviewMode = "voice" | "chat";

export type UserPattern = "confused" | "efficient" | "chatty" | "edge_case" | "unknown";

export type InterviewDuration = 5 | 10 | 20 | "custom";
export type InterviewType = "technical" | "behavioral" | "mixed" | "rapid-fire";
export type ExperienceLevel = "entry" | "mid" | "senior" | "lead";

export interface InterviewConfig {
  duration: InterviewDuration;
  customDurationMinutes?: number;
  interviewType: InterviewType;
  answerTimeLimitSeconds: number;
  experienceLevel: ExperienceLevel;
  jdContent?: string;
  resumeContent?: string;
  extractedSkills?: string[];
  extractedResponsibilities?: string[];
  candidateStrengths?: string[];
  candidateWeaknesses?: string[];
}

export type MessageRole = "user" | "assistant" | "system";

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
}

export interface InterviewState {
  sessionId: string;
  role: JobRole;
  mode: InterviewMode;
  config: InterviewConfig;
  currentQuestion: number;
  totalQuestions: number;
  elapsedTime: number;
  detectedPattern: UserPattern;
  patternConfidence: number;
  conversationHistory: Message[];
  isActive: boolean;
}

export interface Question {
  id: string;
  role: JobRole;
  category: "Technical" | "Behavioral";
  difficulty: "Easy" | "Medium" | "Hard";
  question: string;
}

export interface AnswerEvaluation {
  quality: number; // 0-10
  depth: "shallow" | "moderate" | "deep";
  clarity: number; // 0-10
  relevance: number; // 0-10
  isOffTopic: boolean;
  comprehensionLevel: "confused" | "partial" | "clear";
  needsFollowUp: boolean;
}

export interface PatternSignals {
  responseLength: number;
  responseTime: number;
  clarityScore: number;
  offTopicCount: number;
  questionAskedCount: number;
  technicalDepth: number;
}

export interface FeedbackData {
  communication: number;
  technicalDepth: number;
  problemSolving: number;
  confidence: number;
  overallScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: string;
  questionSummaries: {
    question: string;
    answer: string;
    score: number;
    feedback: string;
  }[];
}

// WebSocket Events
export type ServerToClientEvents = {
  interview_state: (state: InterviewState) => void;
  new_message: (message: Message) => void;
  pattern_detected: (pattern: UserPattern, confidence: number) => void;
  next_question: (question: Question) => void;
  feedback_ready: (feedback: FeedbackData) => void;
  interview_ended: () => void;
  error: (error: string) => void;
  streaming_chunk: (chunk: string) => void;
  streaming_complete: () => void;
  documents_extracted: (data: { skills: string[]; responsibilities: string[]; strengths: string[]; weaknesses: string[] }) => void;
  interim_transcript: (text: string) => void;
  final_transcript: (text: string) => void;
  agent_checking_silence: () => void;
};

export type ClientToServerEvents = {
  start_interview: (data: { role: JobRole; mode: InterviewMode; config: InterviewConfig }) => void;
  send_message: (message: string) => void;
  send_voice_transcript: (transcript: string) => void;
  execute_command: (command: "/change role" | "/end" | "/feedback", args?: any) => void;
  request_feedback: () => void;
  extract_documents: (data: { jdText: string; resumeText: string; role: JobRole }) => void;
  start_voice_stream: () => void;
  audio_chunk: (audioData: ArrayBuffer) => void;
  stop_voice_stream: () => void;
};

// Validation Schemas
export const startInterviewSchema = z.object({
  role: z.enum(["SDE", "DevOps", "Data Analyst", "BA", "PM", "Sales", "Support", "Retail"]),
  mode: z.enum(["voice", "chat"]),
});

export const sendMessageSchema = z.object({
  message: z.string().min(1).max(5000),
});

export const commandSchema = z.object({
  command: z.enum(["/change role", "/end", "/feedback"]),
  args: z.any().optional(),
});
