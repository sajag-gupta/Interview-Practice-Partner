import { useState, useRef, useEffect } from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Message } from "@shared/schema";
import { Socket } from "socket.io-client";

type RecordingStatus = "idle" | "listening" | "processing" | "speaking";

interface VoiceInterfaceProps {
  onTranscript?: (text: string) => void;
  questionId?: string;
  messages?: Message[];
  socket?: Socket;
  isProcessing?: boolean;
  onProcessingChange?: (isProcessing: boolean) => void;
}

export function VoiceInterface({ onTranscript, questionId, messages = [], socket, isProcessing: externalProcessing, onProcessingChange }: VoiceInterfaceProps) {
  const [status, setStatus] = useState<RecordingStatus>("idle");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const statusRef = useRef<RecordingStatus>("idle");
  const lastMessageIdRef = useRef<string>("");
  const isStreamingRef = useRef(false);
  const connectionReadyRef = useRef(false);
  const pendingRestartRef = useRef(false);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Sync external processing state with internal status
  useEffect(() => {
    if (externalProcessing === false && status === "processing") {
      // Processing completed, reset to idle
      setStatus("idle");
    }
  }, [externalProcessing, status]);

  // Auto-start mic when interview begins (first assistant message)
  useEffect(() => {
    if (messages.length === 1 && messages[0].role === "assistant" && socket && status === "idle") {
      // Give user a moment to see the welcome message, then auto-start mic
      const timer = setTimeout(() => {
        if (statusRef.current === "idle") {
          handleStartListening();
        }
      }, 3000); // 3 second delay after TTS speaks
      
      return () => clearTimeout(timer);
    }
  }, [messages.length, socket, status]);

  // Handle AI messages - speak them out loud
  useEffect(() => {
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.id !== lastMessageIdRef.current) {
        lastMessageIdRef.current = lastMessage.id;
        
        // Pause listening while AI speaks
        if (status === "listening" && socket) {
          handleStopListening();
        }
        
        speakText(lastMessage.content);
      }
    }
  }, [messages, status, socket]);

  // Listen for Deepgram transcription events
  useEffect(() => {
    if (!socket) return;

    const handleInterimTranscript = (text: string) => {
      if (text === "") {
        // Empty string means connection is ready
        connectionReadyRef.current = true;
        return;
      }
      setInterimTranscript(text);
    };

    const handleFinalTranscript = (text: string) => {
      setTranscript(text);
      setInterimTranscript("");
      
      // Just update UI - voice stream callback already sent to backend
      setStatus("processing");
      if (onProcessingChange) {
        onProcessingChange(true);
      }
      
      // Stop the current stream
      handleStopListening();
    };

    const handleAgentCheckingSilence = () => {
      // Agent is checking if user is still there
      setStatus("idle");
      setTranscript("");
      setInterimTranscript("");
    };

    socket.on("interim_transcript", handleInterimTranscript);
    socket.on("final_transcript", handleFinalTranscript);
    socket.on("agent_checking_silence", handleAgentCheckingSilence);

    return () => {
      socket.off("interim_transcript", handleInterimTranscript);
      socket.off("final_transcript", handleFinalTranscript);
      socket.off("agent_checking_silence", handleAgentCheckingSilence);
    };
  }, [socket, onTranscript]);

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const speak = () => {
        setStatus("speaking");
        const utterance = new SpeechSynthesisUtterance(text);
        
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
          v.name.includes('Natural') || 
          v.name.includes('Premium') ||
          v.name.includes('Google') ||
          v.name.includes('Microsoft') ||
          v.name.includes('Zira') ||
          v.name.includes('David')
        ) || voices.find(v => v.lang.startsWith('en-')) || voices[0];
        
        if (preferredVoice) utterance.voice = preferredVoice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';
        
        utterance.onend = () => {
          setStatus("idle");
          // Auto-resume mic after AI finishes speaking (with a small delay)
          if (socket && !isStreamingRef.current && statusRef.current === "speaking") {
            setTimeout(() => {
              if (statusRef.current === "idle" && !isStreamingRef.current) {
                console.log("[Voice] 🔄 AI finished speaking, auto-resuming mic...");
                handleStartListening();
              }
            }, 1000); // 1 second delay
          }
        };
        
        utterance.onerror = () => {
          setStatus("idle");
        };
        
        window.speechSynthesis.speak(utterance);
      };
      
      if (window.speechSynthesis.getVoices().length === 0) {
        window.speechSynthesis.onvoiceschanged = () => speak();
      } else {
        setTimeout(speak, 100);
      }
    }
  };

  const handleStartListening = async () => {
    if (!socket) {
      console.error("Socket not available");
      return;
    }

    if (status === "speaking") {
      console.log("Cannot record while AI is speaking");
      return;
    }

    // Prevent duplicate streams
    if (isStreamingRef.current) {
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 16000,
          channelCount: 1,
        }
      });

      mediaStreamRef.current = stream;
      isStreamingRef.current = true;
      connectionReadyRef.current = false;
      
      // Tell backend to start Deepgram connection FIRST
      socket.emit("start_voice_stream");
      
      // Wait for connection to be ready before starting audio processing
      const waitForConnection = setInterval(() => {
        if (connectionReadyRef.current) {
          clearInterval(waitForConnection);
          startAudioProcessing();
        }
      }, 100);
      
      // Timeout after 3 seconds
      setTimeout(() => {
        if (!connectionReadyRef.current) {
          clearInterval(waitForConnection);
          startAudioProcessing();
        }
      }, 3000);
      
      const startAudioProcessing = () => {
        // Create audio context for processing (16kHz mono)
        const audioContext = new AudioContext({ sampleRate: 16000 });
        audioContextRef.current = audioContext;
        
        const source = audioContext.createMediaStreamSource(stream);
        
        // Use smaller buffer for lower latency (2048 samples = 128ms at 16kHz)
        const processor = audioContext.createScriptProcessor(2048, 1, 1);
        processorRef.current = processor;
        
        let chunkCount = 0;
        processor.onaudioprocess = (e) => {
          if (!isStreamingRef.current || !socket) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          
          // Convert Float32Array to Int16Array (LINEAR16 PCM format)
          const int16Data = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
          }
          
          // Send raw PCM audio to backend
          socket.emit("audio_chunk", int16Data.buffer);
        };
        
        source.connect(processor);
        processor.connect(audioContext.destination);
        
        setStatus("listening");
        setTranscript("");
        setInterimTranscript("");
      };
    
    } catch (error) {
      alert("Microphone access denied or not available");
      setStatus("idle");
    }
  };

  const handleStopListening = () => {
    if (!socket) return;

    isStreamingRef.current = false;
    connectionReadyRef.current = false;

    // Stop audio processing
    if (processorRef.current) {
      processorRef.current.disconnect();
      processorRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }

    // Tell backend to stop Deepgram connection
    socket.emit("stop_voice_stream");

    setStatus("idle");
  };

  const handleMicClick = () => {
    if (status === "speaking") {
      return;
    }

    if (status === "idle" || status === "processing") {
      handleStartListening();
    } else if (status === "listening") {
      handleStopListening();
    }
  };

  const getStatusBadge = () => {
    const statusConfig = {
      idle: { label: "Ready", variant: "secondary" as const },
      listening: { label: "Listening...", variant: "default" as const },
      processing: { label: "Processing", variant: "secondary" as const },
      speaking: { label: "AI Speaking", variant: "default" as const },
    };
    return statusConfig[status];
  };

  const displayText = interimTranscript || transcript;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 pb-32">
        <div className="flex flex-col items-center gap-4 max-w-2xl mx-auto w-full">
          <Badge variant={getStatusBadge().variant} className="mb-2">
            {getStatusBadge().label}
          </Badge>

          <div className="text-center text-sm text-muted-foreground max-w-md">
            <p className="mb-2">🎙️ Powered by Deepgram AI</p>
            <p className="text-xs">
              {status === "listening" 
                ? "Speak naturally. The AI will respond automatically."
                : status === "speaking"
                ? "AI is speaking. Please wait..."
                : "Click the microphone to start speaking"}
            </p>
          </div>

          {status === "listening" && (
            <div className="flex gap-1 items-end h-12">
              {[...Array(5)].map((_, i) => (
                <div
                  key={i}
                  className="w-2 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 100}%`,
                    animationDelay: `${i * 0.1}s`,
                  }}
                />
              ))}
            </div>
          )}

          {displayText && (
            <Card className="p-4 max-w-2xl w-full mx-auto">
              <p className="text-sm text-muted-foreground mb-1">
                {interimTranscript ? "Speaking..." : "You said:"}
              </p>
              <p className={`text-base ${interimTranscript ? "text-muted-foreground italic" : ""}`}>
                {displayText}
              </p>
            </Card>
          )}
        </div>
      </div>
      
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t p-4 flex justify-center">
        <Button
          size="icon"
          variant={status === "listening" ? "default" : "outline"}
          className={`h-16 w-16 rounded-full ${status === "listening" ? "animate-pulse" : ""}`}
          onClick={handleMicClick}
          disabled={status === "processing" || status === "speaking"}
        >
          {status === "listening" ? (
            <Square className="h-8 w-8" />
          ) : (
            <Mic className="h-8 w-8" />
          )}
        </Button>
      </div>
    </div>
  );
}
