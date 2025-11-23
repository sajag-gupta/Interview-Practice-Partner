import { useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  InterviewState,
  Message,
  Question,
  FeedbackData,
  JobRole,
  InterviewMode,
  UserPattern,
  ServerToClientEvents,
  ClientToServerEvents,
} from "@shared/schema";
import { useToast } from "./use-toast";

export function useInterview(onInterviewEnded?: () => void) {
  const [socket, setSocket] = useState<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [interviewState, setInterviewState] = useState<InterviewState | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [detectedPattern, setDetectedPattern] = useState<{ pattern: UserPattern; confidence: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const onInterviewEndedRef = useRef(onInterviewEnded);

  // Update ref when callback changes without triggering reconnection
  useEffect(() => {
    onInterviewEndedRef.current = onInterviewEnded;
  }, [onInterviewEnded]);

  useEffect(() => {
    const socketInstance = io({
      path: "/socket.io",
    });

    socketInstance.on("connect", () => {
      console.log("Connected to interview server");
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("Disconnected from interview server");
      setIsConnected(false);
    });

    socketInstance.on("interview_state", (state: InterviewState) => {
      setInterviewState(state);
    });

    socketInstance.on("new_message", (message: Message) => {
      setMessages((prev) => [...prev, message]);
      // Stop processing when AI responds
      if (message.role === "assistant") {
        setIsProcessing(false);
      }
    });

    socketInstance.on("pattern_detected", (pattern: UserPattern, confidence: number) => {
      setDetectedPattern({ pattern, confidence });
      
      const patternLabels: Record<UserPattern, string> = {
        confused: "Confused - I'll provide more guidance",
        efficient: "Efficient - Keeping questions focused",
        chatty: "Chatty - Redirecting to key topics",
        edge_case: "Needs Structure - Asking clearer questions",
        unknown: "Analyzing your style...",
      };

      toast({
        title: "AI Adaptation",
        description: patternLabels[pattern],
        duration: 3000,
      });
    });

    socketInstance.on("next_question", (question: Question) => {
      setCurrentQuestion(question);
    });

    socketInstance.on("feedback_ready", (feedbackData: FeedbackData) => {
      console.log("Feedback received:", feedbackData);
      setFeedback(feedbackData);
    });

    socketInstance.on("interview_ended", () => {
      toast({
        title: "Interview Ended",
        description: "Thank you for practicing! Your feedback is ready.",
      });
      // Trigger callback to show feedback view
      if (onInterviewEndedRef.current) {
        onInterviewEndedRef.current();
      }
    });

    socketInstance.on("error", (error: string) => {
      toast({
        title: "Error",
        description: error,
        variant: "destructive",
      });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [toast]);

  const startInterview = useCallback(
    (role: JobRole, mode: InterviewMode, config?: any) => {
      if (socket) {
        setMessages([]);
        setFeedback(null);
        setDetectedPattern(null);
        setCurrentQuestion(null);
        socket.emit("start_interview", { role, mode, config: config || { duration: 10, interviewType: "mixed", answerTimeLimitSeconds: 120, experienceLevel: "mid" } });
      }
    },
    [socket]
  );

  const sendMessage = useCallback(
    (message: string) => {
      if (socket) {
        setIsProcessing(true);
        socket.emit("send_message", message);
      }
    },
    [socket]
  );

  const sendVoiceTranscript = useCallback(
    (transcript: string) => {
      if (socket) {
        setIsProcessing(true);
        socket.emit("send_voice_transcript", transcript);
      }
    },
    [socket]
  );

  const executeCommand = useCallback(
    (command: "/change role" | "/end" | "/feedback", args?: any) => {
      if (socket) {
        socket.emit("execute_command", command, args);
      }
    },
    [socket]
  );

  const requestFeedback = useCallback(() => {
    if (socket) {
      socket.emit("request_feedback");
    }
  }, [socket]);

  return {
    socket,
    isConnected,
    interviewState,
    messages,
    currentQuestion,
    feedback,
    detectedPattern,
    isProcessing,
    setIsProcessing,
    startInterview,
    sendMessage,
    sendVoiceTranscript,
    executeCommand,
    requestFeedback,
  };
}
