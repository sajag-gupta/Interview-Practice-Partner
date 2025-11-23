import { createClient, LiveTranscriptionEvents, LiveClient } from "@deepgram/sdk";
import { Server as SocketIOServer, Socket } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents } from "@shared/schema";

export class DeepgramService {
  private deepgramClient: ReturnType<typeof createClient>;
  private liveConnections: Map<string, LiveClient> = new Map();
  private transcriptBuffers: Map<string, TranscriptBuffer> = new Map();
  private silenceTimers: Map<string, NodeJS.Timeout> = new Map();
  private socketRefs: Map<string, Socket<ClientToServerEvents, ServerToClientEvents>> = new Map();
  private connectionWarnings: Map<string, boolean> = new Map();
  private readonly SILENCE_THRESHOLD_MS = 15000; // 15 seconds of silence before checking in
  private readonly PAUSE_CHECK_MS = 3000; // Check for pauses every 3 seconds

  constructor() {
    const apiKey = process.env.DEEPGRAM_API_KEY;
    if (!apiKey) {
      throw new Error("DEEPGRAM_API_KEY is not set in environment variables");
    }
    this.deepgramClient = createClient(apiKey);
  }

  async startLiveTranscription(
    socket: Socket<ClientToServerEvents, ServerToClientEvents>,
    onTranscript: (text: string, isFinal: boolean) => void,
    onSilence: () => void
  ): Promise<void> {
    const socketId = socket.id;

    // Prevent duplicate connections for the same socket
    if (this.liveConnections.has(socketId)) {
      console.warn(`[Deepgram] ⚠️ Connection already exists for ${socketId}, closing old one first`);
      this.stopLiveTranscription(socketId);
      // Wait for cleanup before starting new connection
      await new Promise(resolve => setTimeout(resolve, 600));
    }

    // Store socket reference for later use
    this.socketRefs.set(socketId, socket);

    // Clear any previous warning flag
    this.connectionWarnings.delete(socketId);

    // Initialize transcript buffer for this session
    this.transcriptBuffers.set(socketId, {
      interimText: "",
      finalText: "",
      lastSpeechTime: Date.now(),
    });

    // Create live transcription connection with proper audio format configuration
    const connection = this.deepgramClient.listen.live({
      model: "nova-2",
      language: "en-US",
      encoding: "linear16",
      sample_rate: 16000,
      channels: 1,
      smart_format: true,
      interim_results: true,
      endpointing: 1500, // Detect end of speech after 1.5s of silence (was 800ms - too aggressive)
      utterance_end_ms: 2500, // Consider utterance ended after 2.5s of silence (was 1200ms - too short)
      vad_events: true, // Voice activity detection events
      filler_words: true,
      punctuate: true,
      keywords: ["internship:2", "React:2", "Django:2", "MERN:2", "MongoDB:2", "Express:2", "Node:2", "DevOps:2", "CI/CD:2", "observability:2", "dashboard:2", "API:2", "database:2", "SQL:2", "NoSQL:2"],
    });

    this.liveConnections.set(socketId, connection);

    // Handle connection open
    connection.on(LiveTranscriptionEvents.Open, () => {
      // Notify client that connection is ready
      socket.emit("interim_transcript", "");

      // Start silence detection monitoring
      this.startSilenceMonitoring(socketId, onSilence);
    });

    // Handle transcription results
    connection.on(LiveTranscriptionEvents.Transcript, (data) => {
      const transcript = data.channel?.alternatives?.[0]?.transcript;
      const isFinal = data.is_final;
      const buffer = this.transcriptBuffers.get(socketId);

      if (buffer) {
        if (transcript && transcript.length > 0) {
          // Update last speech time
          buffer.lastSpeechTime = Date.now();

          if (isFinal) {
            // Append to final text buffer (accumulate until utterance ends)
            buffer.finalText += (buffer.finalText ? " " : "") + transcript;
            buffer.interimText = ""; // Clear interim
            // Don't send to client yet - wait for utterance end
          } else {
            // Send interim text to client for live feedback
            buffer.interimText = transcript;
            onTranscript(transcript, false);
          }
        }
      }
    });

    // Handle speech started event
    connection.on(LiveTranscriptionEvents.SpeechStarted, () => {
      const buffer = this.transcriptBuffers.get(socketId);
      if (buffer) {
        buffer.lastSpeechTime = Date.now();
      }
    });

    // Handle utterance end (user finished speaking)
    connection.on(LiveTranscriptionEvents.UtteranceEnd, () => {
      const buffer = this.transcriptBuffers.get(socketId);
      if (buffer && buffer.finalText.length > 0) {
        const finalText = buffer.finalText.trim();
        
        // Call the transcript callback so commands can be detected
        onTranscript(finalText, true);
        
        // Clear the buffer after sending (but keep buffer object for next utterance)
        buffer.finalText = "";
        buffer.interimText = "";
        buffer.lastSpeechTime = Date.now();
      }
    });

    // Handle errors
    connection.on(LiveTranscriptionEvents.Error, (error) => {
      console.error(`[Deepgram] Error for ${socketId}:`, error);
    });

    // Handle connection close
    connection.on(LiveTranscriptionEvents.Close, () => {
      console.log(`[Deepgram] Connection closed for ${socketId}`);
      this.cleanup(socketId);
    });
  }

  sendAudio(socketId: string, audioData: Buffer): void {
    const connection = this.liveConnections.get(socketId);
    if (connection && connection.getReadyState() === 1) {
      // Send audio buffer to Deepgram - use the underlying ArrayBuffer
      connection.send(audioData.buffer.slice(audioData.byteOffset, audioData.byteOffset + audioData.byteLength));
      
      // Clear warning flag once connection is working
      if (this.connectionWarnings.has(socketId)) {
        this.connectionWarnings.delete(socketId);
      }
    } else {
      // Only log warning once per session
      if (!this.connectionWarnings.has(socketId)) {
        if (!connection) {
          console.warn(`[Deepgram] ⚠️ No connection yet for ${socketId} (waiting for start_voice_stream)`);
        } else {
          console.warn(`[Deepgram] ⚠️ Connection not ready for ${socketId} (state: ${connection.getReadyState()})`);
        }
        this.connectionWarnings.set(socketId, true);
      }
    }
  }

  private startSilenceMonitoring(socketId: string, onSilence: () => void): void {
    // Clear any existing timer
    const existingTimer = this.silenceTimers.get(socketId);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    // Check for silence periodically
    const timer = setInterval(() => {
      const buffer = this.transcriptBuffers.get(socketId);
      if (!buffer) {
        clearInterval(timer);
        return;
      }

      const timeSinceLastSpeech = Date.now() - buffer.lastSpeechTime;
      const connectionAge = Date.now() - buffer.lastSpeechTime;

      // Only trigger if user hasn't spoken at all for a long time
      // Don't trigger during normal conversation flow
      if (
        timeSinceLastSpeech > this.SILENCE_THRESHOLD_MS &&
        buffer.finalText.length === 0 &&
        buffer.interimText.length === 0 &&
        connectionAge > 10000 // Connection active for at least 10 seconds
      ) {
        onSilence();
        // Reset the speech time to avoid repeated triggers
        buffer.lastSpeechTime = Date.now();
      }
    }, this.PAUSE_CHECK_MS);

    this.silenceTimers.set(socketId, timer);
  }

  clearTranscriptBuffer(socketId: string): void {
    const buffer = this.transcriptBuffers.get(socketId);
    if (buffer) {
      buffer.finalText = "";
      buffer.interimText = "";
      buffer.lastSpeechTime = Date.now();
    }
  }

  getCompleteTranscript(socketId: string): string {
    const buffer = this.transcriptBuffers.get(socketId);
    return buffer?.finalText || "";
  }

  stopLiveTranscription(socketId: string): void {
    const connection = this.liveConnections.get(socketId);
    if (connection) {
      connection.finish();
    }
    
    // Delay cleanup to allow final transcripts to arrive
    setTimeout(() => {
      this.cleanup(socketId);
    }, 500);
  }

  private cleanup(socketId: string): void {
    // Clear silence timer
    const timer = this.silenceTimers.get(socketId);
    if (timer) {
      clearInterval(timer);
      this.silenceTimers.delete(socketId);
    }

    // Remove connections and buffers
    this.liveConnections.delete(socketId);
    this.transcriptBuffers.delete(socketId);
    this.socketRefs.delete(socketId);
    this.connectionWarnings.delete(socketId);
  }
}

interface TranscriptBuffer {
  interimText: string;
  finalText: string;
  lastSpeechTime: number;
}
