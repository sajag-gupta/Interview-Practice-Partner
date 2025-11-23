# InterviewProAI

AI-powered interview practice application with real-time feedback using Google Gemini.

## Features

- 🎯 Multiple job role interviews (SDE, DevOps, Data Analyst, BA, PM, Sales, Support, Retail)
- 💬 Chat and Voice interview modes
- 🤖 Real-time AI-powered feedback using Google Gemini
- 📊 Pattern detection (confused, efficient, chatty, edge case)
- 📈 Detailed performance analytics
- 🎨 Modern UI with dark/light theme support
- 📄 PDF export for feedback reports

## Prerequisites

- Node.js 18 or higher
- npm or yarn package manager
- Google Gemini API key (free tier available)
- Deepgram API key (free tier includes 45,000 minutes)

## Setup

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

## Tech Stack

### Frontend
- React 18
- TypeScript
- Tailwind CSS
- shadcn/ui components
- Socket.IO Client
- Wouter (routing)
- React Query
- Recharts (analytics)

### Backend
- Node.js
- Express
- Socket.IO
- Google Gemini AI
- TypeScript

## Project Structure

```
InterviewProAI/
├── client/              # Frontend React application
│   ├── src/
│   │   ├── components/  # UI components
│   │   ├── hooks/       # Custom React hooks
│   │   ├── lib/         # Utilities
│   │   └── pages/       # Page components
│   └── public/          # Static assets
├── server/              # Backend Express server
│   ├── services/        # Business logic services
│   ├── data/           # Question bank
│   └── routes.ts       # API routes
├── shared/             # Shared types and schemas
└── .env                # Environment variables
```

## License

MIT
