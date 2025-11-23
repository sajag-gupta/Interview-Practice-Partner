import { Server as SocketIOServer, Socket } from "socket.io";
import { InterviewState, Message, JobRole, InterviewMode, UserPattern, Question, ServerToClientEvents, ClientToServerEvents, FeedbackData, InterviewConfig, AnswerEvaluation } from "@shared/schema";
import { PatternDetector } from "./PatternDetector";
import { GeminiService } from "./GeminiService";
import { FeedbackGenerator } from "./FeedbackGenerator";
import { DeepgramService } from "./DeepgramService";

export class InterviewOrchestrator {
  private io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>;
  private sessions: Map<string, InterviewSessionData> = new Map();
  private deepgramService: DeepgramService;

  constructor(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
    this.io = io;
    this.deepgramService = new DeepgramService();
  }

  handleConnection(socket: Socket<ClientToServerEvents, ServerToClientEvents>): void {
    console.log(`Client connected: ${socket.id}`);

    socket.on("start_interview", async (data: { role: JobRole; mode: InterviewMode; config: InterviewConfig }) => {
      await this.startInterview(socket, data.role, data.mode, data.config);
    });

    socket.on("send_message", async (message: string) => {
      await this.handleUserMessage(socket, message);
    });

    socket.on("send_voice_transcript", async (transcript: string) => {
      await this.handleUserMessage(socket, transcript);
    });

    // Deepgram streaming events
    socket.on("start_voice_stream", async () => {
      await this.startVoiceStream(socket);
    });

    socket.on("audio_chunk", (audioData: ArrayBuffer) => {
      this.handleAudioChunk(socket, Buffer.from(audioData));
    });

    socket.on("stop_voice_stream", () => {
      this.stopVoiceStream(socket);
    });

    socket.on("execute_command", async (command: "/change role" | "/end" | "/feedback", args?: any) => {
      await this.handleCommand(socket, command, args);
    });

    socket.on("request_feedback", async () => {
      await this.generateFeedback(socket);
    });

    socket.on("extract_documents", async (data: { jdText: string; resumeText: string; role: JobRole }) => {
      const gemini = new GeminiService();
      const result = await gemini.extractDocuments(data.jdText, data.resumeText);
      socket.emit("documents_extracted", {
        skills: result?.requiredSkills || [],
        responsibilities: result?.keyResponsibilities || [],
        strengths: result?.candidateStrengths || [],
        weaknesses: result?.candidateWeaknesses || [],
      });
    });

    socket.on("disconnect", () => {
      console.log(`Client disconnected: ${socket.id}`);
      this.deepgramService.stopLiveTranscription(socket.id);
      this.sessions.delete(socket.id);
    });
  }

  private async startInterview(socket: Socket<ClientToServerEvents, ServerToClientEvents>, role: JobRole, mode: InterviewMode, config: InterviewConfig): Promise<void> {
    const geminiService = new GeminiService();
    const patternDetector = new PatternDetector();
    const feedbackGenerator = new FeedbackGenerator(geminiService);

    const targetDurationSeconds = config.duration === "custom" 
      ? (config.customDurationMinutes || 20) * 60 
      : config.duration * 60;

    const sessionData: InterviewSessionData = {
      state: {
        sessionId: socket.id,
        role,
        mode,
        config,
        currentQuestion: 1,
        totalQuestions: 999,
        elapsedTime: 0,
        detectedPattern: "unknown",
        patternConfidence: 0,
        conversationHistory: [],
        isActive: true,
      },
      patternDetector,
      geminiService,
      feedbackGenerator,
      startTime: Date.now(),
      lastAnswerTime: Date.now(),
      targetDurationSeconds,
      lastEvaluation: undefined,
      hasAskedFollowUp: false,
    };

    this.sessions.set(socket.id, sessionData);

    sessionData.timerInterval = setInterval(() => {
      if (sessionData.state.isActive) {
        sessionData.state.elapsedTime = Math.floor((Date.now() - sessionData.startTime) / 1000);
        
        if (sessionData.state.elapsedTime >= sessionData.targetDurationSeconds) {
          this.endInterview(socket, sessionData);
        } else {
          socket.emit("interview_state", sessionData.state);
        }
      }
    }, 1000);

    const welcomeMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: `Hello! I'm your AI interviewer for the ${role} position. Let's begin with an introduction. Can you tell me about yourself and your relevant experience?`,
      timestamp: new Date(),
    };

    sessionData.state.conversationHistory.push(welcomeMessage);
    socket.emit("new_message", welcomeMessage);
    socket.emit("interview_state", sessionData.state);

    const nextQuestion: Question = {
      id: `q-1`,
      role,
      category: "Behavioral",
      difficulty: "Easy",
      question: welcomeMessage.content,
    };
    socket.emit("next_question", nextQuestion);
  }

  private async handleUserMessage(socket: Socket<ClientToServerEvents, ServerToClientEvents>, message: string): Promise<void> {
    const sessionData = this.sessions.get(socket.id);
    if (!sessionData) return;

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "user",
      content: message,
      timestamp: new Date(),
    };

    sessionData.state.conversationHistory.push(userMessage);
    const responseTime = Math.floor((Date.now() - sessionData.lastAnswerTime) / 1000);
    sessionData.lastAnswerTime = Date.now();
    socket.emit("new_message", userMessage);

    if (sessionData.state.elapsedTime >= sessionData.targetDurationSeconds) {
      await this.endInterview(socket, sessionData);
      return;
    }

    const lastQuestion = sessionData.state.conversationHistory
      .slice(-2)
      .find(m => m.role === "assistant")?.content || "";
    
    const evaluation = await sessionData.geminiService.evaluateAnswer(
      message,       // answer comes first
      lastQuestion,  // question comes second
      sessionData.state.role
    );
    sessionData.lastEvaluation = evaluation;

    sessionData.patternDetector.addSignal(evaluation, responseTime, message);
    const patternResult = sessionData.patternDetector.getPattern();
    sessionData.state.detectedPattern = patternResult.pattern;
    sessionData.state.patternConfidence = patternResult.confidence;

    socket.emit("interview_state", sessionData.state);

    // Check if answer needs follow-up clarification
    const needsFollowUp = evaluation.needsFollowUp || (evaluation.depth === "shallow" && evaluation.quality < 5);
    
    // Handle off-topic responses - send redirect and wait for next user response
    if (evaluation.isOffTopic) {
      const redirectMessage: Message = {
        id: `msg-${Date.now() + 1}`,
        role: "assistant",
        content: "I need to stay focused on interview practice. Please share your thoughts on the previous question, or I can ask you a new one if you'd like.",
        timestamp: new Date(),
      };
      sessionData.state.conversationHistory.push(redirectMessage);
      socket.emit("new_message", redirectMessage);
      return; // Wait for user's next response instead of immediately asking a new question
    }

    sessionData.state.currentQuestion++;
    socket.emit("interview_state", sessionData.state);

    // Smart follow-up logic: only ask follow-up if answer truly needs clarification
    const shouldAskFollowUp = needsFollowUp && 
      evaluation.quality < 7 && 
      evaluation.depth === "shallow" &&
      !sessionData.hasAskedFollowUp;

    // Generate follow-up or new question
    let nextQ: string;
    let questionCategory: "Technical" | "Behavioral" = "Technical";
    let questionDifficulty: "Easy" | "Medium" | "Hard" = "Medium";
    
    if (shouldAskFollowUp) {
      sessionData.hasAskedFollowUp = true;
      nextQ = await sessionData.geminiService.generateFollowUpQuestion(
        lastQuestion,
        message,
        sessionData.state.role
      );
    } else {
      sessionData.hasAskedFollowUp = false;
      const generatedResult = await sessionData.geminiService.generateInterviewQuestion(
        sessionData.state.role,
        sessionData.state.conversationHistory.slice(-6).map((m) => `${m.role}: ${m.content}`).join("\n"),
        sessionData.state.detectedPattern,
        sessionData.state.config.extractedSkills,
        sessionData.state.config.extractedResponsibilities
      );
      
      // Parse JSON response with question, category, and difficulty
      try {
        const parsed = JSON.parse(generatedResult);
        nextQ = parsed.question || generatedResult;
        questionCategory = parsed.category || "Technical";
        questionDifficulty = parsed.difficulty || "Medium";
      } catch (error) {
        nextQ = generatedResult;
      }
    }

    const questionMessage: Message = {
      id: `msg-${Date.now() + 2}`,
      role: "assistant",
      content: nextQ,
      timestamp: new Date(),
    };

    sessionData.state.conversationHistory.push(questionMessage);
    socket.emit("new_message", questionMessage);

    const nextQuestion: Question = {
      id: `q-${sessionData.state.currentQuestion}`,
      role: sessionData.state.role,
      category: questionCategory as "Technical" | "Behavioral",
      difficulty: questionDifficulty as "Easy" | "Medium" | "Hard",
      question: nextQ,
    };
    socket.emit("next_question", nextQuestion);
  }

  private async handleCommand(socket: Socket<ClientToServerEvents, ServerToClientEvents>, command: "/change role" | "/end" | "/feedback", args?: any): Promise<void> {
    const sessionData = this.sessions.get(socket.id);
    if (!sessionData) return;

    switch (command) {
      case "/end":
        await this.endInterview(socket, sessionData);
        break;
      case "/feedback":
        await this.generateFeedback(socket);
        break;
    }
  }

  private async generateFeedback(socket: Socket<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
    const sessionData = this.sessions.get(socket.id);
    if (!sessionData) return;

    const feedback = await sessionData.feedbackGenerator.generateFeedback(
      sessionData.state.conversationHistory,
      sessionData.state.role
    );

    socket.emit("feedback_ready", feedback);
  }

  private async endInterview(socket: Socket<ClientToServerEvents, ServerToClientEvents>, sessionData: InterviewSessionData): Promise<void> {
    sessionData.state.isActive = false;

    if (sessionData.timerInterval) {
      clearInterval(sessionData.timerInterval);
    }

    this.deepgramService.stopLiveTranscription(socket.id);

    const endMessage: Message = {
      id: `msg-${Date.now()}`,
      role: "system",
      content: "Thank you for completing the interview! Your feedback will be generated shortly.",
      timestamp: new Date(),
    };

    sessionData.state.conversationHistory.push(endMessage);
    socket.emit("new_message", endMessage);
    socket.emit("interview_ended");
    await this.generateFeedback(socket);
  }

  private async startVoiceStream(socket: Socket<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
    const sessionData = this.sessions.get(socket.id);
    if (!sessionData) return;

    await this.deepgramService.startLiveTranscription(
      socket,
      async (text: string, isFinal: boolean) => {
        // Send interim or final transcript to client
        if (isFinal) {
          socket.emit("final_transcript", text);
          
          // Check if user is giving a command first
          const isCommand = await this.processTranscriptCommand(socket, text);
          
          // If not a command, process as regular answer
          if (!isCommand) {
            await this.handleUserMessage(socket, text);
          }
        } else {
          socket.emit("interim_transcript", text);
        }
      },
      async () => {
        // User has been silent for too long - agent checks in
        // Note: Don't process transcript here - UtteranceEnd already handles it
        socket.emit("agent_checking_silence");
        const checkInMessage: Message = {
          id: `msg-${Date.now()}`,
          role: "assistant",
          content: "Are you still there? Take your time, and let me know when you're ready to continue.",
          timestamp: new Date(),
        };
        sessionData.state.conversationHistory.push(checkInMessage);
        socket.emit("new_message", checkInMessage);
      }
    );
  }

  private handleAudioChunk(socket: Socket<ClientToServerEvents, ServerToClientEvents>, audioData: Buffer): void {
    this.deepgramService.sendAudio(socket.id, audioData);
  }

  private async stopVoiceStream(socket: Socket<ClientToServerEvents, ServerToClientEvents>): Promise<void> {
    // Don't process transcript here - UtteranceEnd event handles it
    // This prevents duplicate evaluations when user stops mid-utterance
    this.deepgramService.stopLiveTranscription(socket.id);
  }

  private async processTranscriptCommand(socket: Socket<ClientToServerEvents, ServerToClientEvents>, transcript: string): Promise<boolean> {
    const sessionData = this.sessions.get(socket.id);
    if (!sessionData) return false;

    const lowerTranscript = transcript.toLowerCase().trim();

    // Natural command detection - end interview
    if (
      lowerTranscript.includes("end interview") ||
      lowerTranscript.includes("end the interview") ||
      lowerTranscript.includes("end this interview") ||
      lowerTranscript.includes("stop interview") ||
      lowerTranscript.includes("stop the interview") ||
      lowerTranscript.includes("stop this interview") ||
      lowerTranscript.includes("finish interview") ||
      lowerTranscript.includes("finish the interview") ||
      lowerTranscript.includes("finish this interview") ||
      lowerTranscript.includes("i'm done") ||
      lowerTranscript.includes("im done") ||
      lowerTranscript.includes("that's all") ||
      lowerTranscript.includes("thats all") ||
      lowerTranscript.includes("i am done") ||
      lowerTranscript.includes("we're done") ||
      lowerTranscript.includes("were done") ||
      lowerTranscript.includes("let's end") ||
      lowerTranscript.includes("lets end") ||
      lowerTranscript.includes("please end")
    ) {
      const confirmMessage: Message = {
        id: `msg-${Date.now()}`,
        role: "assistant",
        content: "Understood. Let me wrap up and generate your feedback.",
        timestamp: new Date(),
      };
      sessionData.state.conversationHistory.push(confirmMessage);
      socket.emit("new_message", confirmMessage);
      
      await this.endInterview(socket, sessionData);
      return true; // Command handled
    }

    // Feedback request
    if (
      lowerTranscript.includes("show feedback") ||
      lowerTranscript.includes("give feedback") ||
      lowerTranscript.includes("my feedback") ||
      lowerTranscript.includes("how did i do") ||
      lowerTranscript.includes("show me feedback")
    ) {
      await this.generateFeedback(socket);
      return true; // Command handled
    }

    // Ready to continue after pause (not really a command, just acknowledgment)
    if (
      lowerTranscript.includes("ready") ||
      lowerTranscript.includes("yes") ||
      lowerTranscript.includes("continue") ||
      lowerTranscript.includes("go ahead") ||
      lowerTranscript.includes("let's continue") ||
      lowerTranscript.includes("lets continue")
    ) {
      return false; // Not a command, let it be processed as answer
    }

    return false; // No command detected
  }
}

interface InterviewSessionData {
  state: InterviewState;
  patternDetector: PatternDetector;
  geminiService: GeminiService;
  feedbackGenerator: FeedbackGenerator;
  startTime: number;
  lastAnswerTime: number;
  targetDurationSeconds: number;
  lastEvaluation?: AnswerEvaluation;
  timerInterval?: NodeJS.Timeout;
  hasAskedFollowUp: boolean;
}
