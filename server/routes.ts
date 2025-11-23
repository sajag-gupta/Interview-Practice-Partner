import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { ServerToClientEvents, ClientToServerEvents } from "@shared/schema";
import { InterviewOrchestrator } from "./services/InterviewOrchestrator";

export async function registerRoutes(app: Express): Promise<Server> {
  // HTTP routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  const httpServer = createServer(app);

  // WebSocket server for real-time interview communication
  const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Initialize interview orchestrator
  const orchestrator = new InterviewOrchestrator(io);

  // Handle WebSocket connections
  io.on("connection", (socket) => {
    orchestrator.handleConnection(socket);
  });

  console.log("WebSocket server initialized for AI interview sessions");

  return httpServer;
}
