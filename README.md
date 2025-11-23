# InterviewProAI - AI Interview Practice Partner

An intelligent conversational AI agent designed to help users prepare for job interviews through realistic mock interviews, intelligent follow-up questions, and comprehensive feedback analysis.

## Overview

InterviewProAI simulates realistic interview scenarios across multiple job roles using Google Gemini's language model for natural, context-aware conversations that adapt to user interaction patterns in real-time.

## Core Features

**Multiple Role Support** - Conducts specialized mock interviews for SDE, DevOps, Data Analyst, Business Analyst, Product Manager, Sales, Customer Support, and Retail roles with curated question banks.

**Dual Interaction Modes** - Voice mode with Deepgram API for speech-to-text/text-to-speech, and chat mode for text-based interviews.

**Intelligent Interviewer Behavior** - Generates contextual follow-up questions, probes for technical depth, and adapts difficulty based on responses.

**Real-time Pattern Detection** - Classifies user behavior (confused, efficient, chatty, edge case) and adjusts interview style accordingly.

**Comprehensive Feedback** - Post-interview analysis with multi-dimensional scores, strengths, improvement areas, and actionable recommendations.

**Analytics Dashboard** - Visual performance metrics with score breakdowns and progress tracking across sessions.

## Design Philosophy and Technical Decisions

### Conversational Quality

```
┌─────────────────────────────────────────────────────────┐
│              Conversation Flow Design                   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User Input ──────────────┐                             │
│                            │                            │
│                            ▼                            │
│                  ┌──────────────────┐                   │
│                  │  Context Manager │                   │
│                  │  (Full History)  │                   │
│                  └────────┬─────────┘                   │
│                           │                             │
│                           ▼                             │
│                  ┌──────────────────┐                   │
│                  │ Gemini 2.5 Flash │                   │
│                  │  NLU & Response  │                   │
│                  └────────┬─────────┘                   │
│                           │                             │
│         ┌─────────────────┼─────────────────┐           │
│         │                 │                 │           │
│         ▼                 ▼                 ▼           │
│  ┌──────────┐    ┌───────────────┐   ┌─────────┐        │
│  │Reference │    │Dynamic Follow │   │ Probe   │        │
│  │Previous  │    │  -up Question │   │Technical│        │
│  │ Answers  │    │   Generation  │   │ Details │        │
│  └──────────┘    └───────────────┘   └─────────┘        │
│                                                         │
│  Natural, Context-Aware Interview Experience            │
└─────────────────────────────────────────────────────────┘
```

**Natural Language Understanding** - Uses Google Gemini 2.5 Flash for superior context retention and conversation coherence across long interview sessions.

**Context-Aware Responses** - Maintains full conversation history to reference previous answers, ask relevant follow-ups, and build upon topics naturally.

**Dynamic Follow-up Generation** - Generates questions dynamically based on responses, probing technical details and exploring concepts rather than following a rigid script.

### Agentic Behavior

```
┌────────────────────────────────────────────────────────────┐
│           Pattern Detection & Adaptation System            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  User Response ──────────┐                                 │
│                          │                                 │
│                          ▼                                 │
│                ┌──────────────────┐                        │
│                │ PatternDetector  │                        │
│                │ Analyze: Length  │                        │
│                │ Keywords, Context│                        │
│                └────────┬─────────┘                        │
│                         │                                  │
│         ┌───────────────┼───────────────┬────────┐         │
│         │               │               │        │         │
│         ▼               ▼               ▼        ▼         │
│    ┌────────┐    ┌──────────┐    ┌────────┐ ┌──────┐       │
│    │Confused│    │Efficient │    │ Chatty │ │Edge  │       │ 
│    │  User  │    │   User   │    │  User  │ │Case  │       │
│    └───┬────┘    └────┬─────┘    └───┬────┘ └──┬───┘       │
│        │              │               │         │          │
│        ▼              ▼               ▼         ▼          │
│    Guidance       Harder          Redirect   Set           │
│    & Hints      Questions         Gently   Boundaries      │
│                                                            │
│              Autonomous Decision Making                    │
└────────────────────────────────────────────────────────────┘
```

**Adaptive Interview Flow** - Makes autonomous decisions about progression, topic depth, and when to provide hints or redirect.

**Pattern Recognition and Adaptation** - Analyzes conversation metrics (response length, keywords, context relevance) to classify behavior and adjust style. Confused users get guidance, efficient users get harder questions, chatty users are redirected, and edge cases are handled professionally.

**Intelligent State Management** - Tracks answered questions, scores, patterns, and context throughout the session for informed decision-making.

### Technical Implementation Highlights

```
┌───────────────────────────────────────────────────────┐
│          Modular Service Architecture                 │
├───────────────────────────────────────────────────────┤
│                                                       │
│              ┌──────────────────────┐                 │
│              │ InterviewOrchestrator│                 │
│              │ (Central Coordinator)│                 │
│              └──────────┬───────────┘                 │
│                         │                             │
│        ┌────────────────┼────────────────┐            │
│        │                │                │            │
│        ▼                ▼                ▼            │
│  ┌──────────┐    ┌───────────┐   ┌──────────┐         │
│  │  Gemini  │    │  Pattern  │   │ Feedback │         │
│  │ Service  │    │ Detector  │   │Generator │         │
│  └──────────┘    └───────────┘   └──────────┘         │
│                                                       │
│        ▼                                  ▼           │
│  ┌──────────┐                      ┌──────────┐       │
│  │ Deepgram │                      │   Zod    │       │
│  │ Service  │◄────Socket.IO───────►│Validation│       │
│  └──────────┘                      └──────────┘       │
│                                                       │
│  TypeScript Type Safety + React Query Optimization    │
└───────────────────────────────────────────────────────┘
```

**Real-time Communication** - Socket.IO enables instant messaging, voice streaming, live pattern detection, and seamless mode switching.

**Modular Service Architecture** - Specialized services (`InterviewOrchestrator`, `GeminiService`, `PatternDetector`, `FeedbackGenerator`, `DeepgramService`) improve maintainability and testability.

**Type Safety** - Shared TypeScript schemas with Zod validation ensure consistency and reduce runtime errors.

**Optimistic UI Updates** - React Query provides immediate user feedback during background operations.

### Intelligence and Adaptability

```
┌──────────────────────────────────────────────────────────┐
│         AI Intelligence Decision Framework               │
├──────────────────────────────────────────────────────────┤
│                                                          │
│                   User Input                             │
│                       │                                  │
│                       ▼                                  │
│            ┌────────────────────┐                        │
│            │  Multi-factor       │                       │
│            │  Analysis Engine    │                       │
│            └─────────┬──────────┘                        │
│                      │                                   │
│      ┌───────────────┼────────────────┬──────────┐       │
│      │               │                │          │       │
│      ▼               ▼                ▼          ▼       │
│  Skill Level    Progress      Time Constraints  Pattern  │
│  (Inferred)     Tracking      & Token Limits    Type     │
│      │               │                │          │       │
│      └───────────────┴────────┬───────┴──────────┘       │
│                               │                          │
│                               ▼                          │
│                    ┌───────────────────┐                 │
│                    │ Prompt Engineering │                │
│                    │ Phase-Specific     │                │
│                    └────────┬──────────┘                 │
│                             │                            │
│                             ▼                            │
│                    Contextual Response                   │
│                    + Error Recovery                      │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

**Context Window Management** - Prioritizes recent messages while staying within token limits, summarizing older context when needed.

**Prompt Engineering** - Specialized prompts for each interview phase maintain appropriate tone and behavior.

**Error Recovery** - Gracefully handles API failures, network issues, and unexpected inputs without breaking flow.

**Multi-turn Reasoning** - Considers skill level, progress, time constraints, and interaction patterns when generating responses.

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Google Gemini API key (free tier available at https://aistudio.google.com)
- Deepgram API key (free tier includes 45,000 minutes of transcription)

## Installation and Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd InterviewProAI
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` and add your API keys:
   ```env
   # Get your Gemini API key from: https://aistudio.google.com/app/apikey
   GEMINI_API_KEY=your_gemini_api_key_here
   
   # Get your Deepgram API key from: https://console.deepgram.com/
   DEEPGRAM_API_KEY=your_deepgram_api_key_here
   
   PORT=5000
   NODE_ENV=development
   ```
   
   **Important:** Never commit your `.env` file to version control!

4. **Start the development server**
   ```bash
   npm run dev
   ```
   
   The app will be available at `http://localhost:5000`

## API Keys Setup

### Google Gemini API Key
1. Visit https://aistudio.google.com/app/apikey
2. Sign in with your Google account
3. Click "Create API key"
4. Copy the key to your `.env` file

### Deepgram API Key (For Voice Mode)
1. Visit https://console.deepgram.com/signup
2. Create a free account (no credit card required)
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

## Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production (creates optimized bundle)
- `npm start` - Start production server (run `npm run build` first)
- `npm run check` - Run TypeScript type checking

## Production Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Set environment variables on your production server:
   ```bash
   GEMINI_API_KEY=your_production_key
   DEEPGRAM_API_KEY=your_production_key
   PORT=5000
   NODE_ENV=production
   ```

3. Start the production server:
   ```bash
   npm start
   ```

## Demo Scenarios and Testing

### The Confused User
**Scenario**: Unsure about role selection or how to answer.
**Response**: Provides role descriptions, hints, simpler questions, and structured guidance.
**Example**: For vague answers, the agent offers sample structures and encourages elaboration.

### The Efficient User
**Scenario**: Wants quick practice with concise, well-structured answers.
**Response**: Maintains brisk pace, increases difficulty, minimizes small talk.
**Example**: After 3-4 focused responses, moves through questions faster with harder technical content.

### The Chatty User
**Scenario**: Goes off-topic or provides lengthy responses.
**Response**: Politely redirects while maintaining professional tone.
**Example**: "That's interesting, but let's focus on the interview questions. Here's what I'd like to ask next..."

### The Edge Case User
**Scenario**: Invalid inputs or requests beyond capabilities.
**Response**: Communicates boundaries, handles gracefully, redirects to valid activities.
**Example**: Clarifies its role as a practice tool when asked to schedule real company interviews.

## Technology Stack

### Frontend
- **React 18**: Modern component-based UI framework
- **TypeScript**: Type-safe development experience
- **Tailwind CSS**: Utility-first styling for responsive design
- **shadcn/ui**: Accessible, customizable component library
- **Socket.IO Client**: Real-time bidirectional communication
- **Wouter**: Lightweight routing solution
- **React Query**: Server state management with caching
- **Recharts**: Data visualization for analytics dashboard

### Backend
- **Node.js with Express**: Lightweight, flexible server framework
- **Socket.IO**: WebSocket-based real-time communication
- **Google Gemini 1.5 Flash**: Advanced language model for natural conversations
- **Deepgram**: High-accuracy speech-to-text and text-to-speech
- **TypeScript**: End-to-end type safety
- **Zod**: Runtime schema validation

## Architecture Overview

The application follows a client-server architecture with real-time communication:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                         │
│  ┌────────────┐  ┌──────────────┐  ┌──────────────────┐     │
│  │ Chat UI    │  │ Voice UI     │  │ Analytics        │     │
│  │ Component  │  │ Component    │  │ Dashboard        │     │
│  └─────┬──────┘  └──────┬───────┘  └────────┬─────────┘     │
│        │                 │                    │             │
│        └─────────────────┴────────────────────┘             │
│                          │                                  │
│                   Socket.IO Client                          │
└──────────────────────────┼──────────────────────────────────┘
                           │
                    WebSocket Connection
                           │
┌──────────────────────────┼──────────────────────────────────┐
│                   Socket.IO Server                          │
│                          │                                  │
│  ┌───────────────────────┴────────────────────────┐         │
│  │        Interview Orchestrator Service          │         │
│  │  (State Management, Flow Control, Routing)     │         │
│  └──┬──────────┬──────────────┬──────────────┬───┘          │
│     │          │              │              │              │
│  ┌──▼────┐ ┌──▼──────┐ ┌─────▼─────┐ ┌─────▼──────┐         │
│  │Gemini │ │ Pattern │ │ Feedback  │ │ Deepgram   │         │
│  │Service│ │Detector │ │ Generator │ │  Service   │         │
│  └───────┘ └─────────┘ └───────────┘ └────────────┘         │
│                                                             │
│                    Express.js Backend                       │
└─────────────────────────────────────────────────────────────┘
```

### Project Structure

```
InterviewProAI/
├── client/                      # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/             # shadcn/ui base components
│   │   │   ├── ChatInterface.tsx
│   │   │   ├── VoiceInterface.tsx
│   │   │   ├── FeedbackDashboard.tsx
│   │   │   └── ...
│   │   ├── hooks/              # Custom React hooks
│   │   │   ├── useInterview.ts # Main interview state management
│   │   │   └── use-toast.ts
│   │   ├── lib/                # Utility functions
│   │   ├── pages/              # Page components
│   │   └── App.tsx             # Root application component
│   └── public/                 # Static assets
├── server/                     # Backend Express server
│   ├── services/               # Core business logic
│   │   ├── InterviewOrchestrator.ts  # Main interview coordinator
│   │   ├── GeminiService.ts          # AI model integration
│   │   ├── PatternDetector.ts        # User behavior analysis
│   │   ├── FeedbackGenerator.ts      # Post-interview feedback
│   │   └── DeepgramService.ts        # Speech services
│   ├── routes.ts               # API endpoint definitions
│   └── index.ts               # Server entry point
├── shared/                    # Shared code between client/server
│   └── schema.ts              # TypeScript types and Zod schemas
└── .env                       # Environment configuration
```

## Performance Considerations

**Response Time** - Under 2 seconds average with streaming support.
**Scalability** - Stateless design enables horizontal scaling with efficient WebSocket management.
**Cost Optimization** - Gemini Flash balances quality and cost with managed context windows.

## Future Enhancements

- Multi-language support and resume parsing
- Interview recording and playback
- Calendar integration and peer mock interviews
- ML-based skill gap identification

## Known Limitations

- Voice mode requires stable internet
- AI may lack depth in highly specialized roles
- Scores are estimates, not professional assessments
- English only
