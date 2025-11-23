import { GoogleGenAI } from "@google/genai";
import { AnswerEvaluation, UserPattern } from "@shared/schema";

export class GeminiService {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set");
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async evaluateAnswer(
    answer: string,
    question: string,
    role: string
  ): Promise<AnswerEvaluation> {
    // Check if this is a command rather than an answer to evaluate
    const commandPatterns = [
      /\b(please\s+)?(end|stop|finish|conclude|terminate)\s+(the\s+|this\s+)?(interview|session)\b/i,
      /\b(let'?s|lets)\s+(end|stop|finish)\b/i,
      /\b(i['']?m|i\s+am|we['']?re|that['']?s)\s+(done|finished|all)\b/i,
      /\b(show|display|give|see)\s+(me\s+)?(the\s+)?(feedback|results|score|evaluation)\b/i,
      /\bhow\s+(did\s+)?i\s+(do|perform)\b/i,
    ];
    
    const isCommand = commandPatterns.some((pattern) => pattern.test(answer));
    if (isCommand) {
      // Don't evaluate commands - return neutral evaluation
      return {
        quality: 7,
        depth: "moderate",
        clarity: 8,
        relevance: 10,
        isOffTopic: false,
        comprehensionLevel: "clear",
        needsFollowUp: false,
      };
    }

    const prompt = `Evaluate this ${role} interview response. Return ONLY valid JSON.

Question: "${question.substring(0, 300)}"
Answer: "${answer.substring(0, 500)}"

Evaluate:
- quality: 0-10 (overall answer quality)
- depth: "shallow" (basic/incomplete), "moderate" (adequate), or "deep" (comprehensive)
- clarity: 0-10 (how clear and structured)
- relevance: 0-10 (how on-topic)
- isOffTopic: true ONLY if answer is completely unrelated (e.g., talking about weather, sports, or personal life when asked technical questions). DO NOT mark as off-topic if candidate is providing any relevant professional experience, skills, or technical details.
- comprehensionLevel: "confused" (unclear understanding), "partial" (some understanding), "clear" (full understanding)
- needsFollowUp: true if answer is too short, vague, or incomplete (less than 20 words or lacks detail)

JSON only:`;

    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text?.trim();
      if (text) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            quality: Number(parsed.quality) || 5,
            depth: parsed.depth || "moderate",
            clarity: Number(parsed.clarity) || 5,
            relevance: Number(parsed.relevance) || 5,
            isOffTopic: parsed.isOffTopic || false,
            comprehensionLevel: parsed.comprehensionLevel || "partial",
            needsFollowUp: parsed.needsFollowUp || false,
          };
        }
      }
    } catch (error) {
      console.error("Error evaluating answer:", error);
    }
    return this.getDefaultEvaluation();
  }

  private getDefaultEvaluation(): AnswerEvaluation {
    return {
      quality: 5,
      depth: "moderate",
      clarity: 5,
      relevance: 5,
      isOffTopic: false,
      comprehensionLevel: "partial",
      needsFollowUp: false,
    };
  }

  async generateFollowUpQuestion(question: string, answer: string, role: string): Promise<string> {
    const prompt = `The candidate gave a short or incomplete answer. Ask a clarifying follow-up question.

Original question: "${question.substring(0, 200)}"
Their answer: "${answer.substring(0, 200)}"

Generate a friendly follow-up question to get more detail. Be supportive and conversational.

Examples:
- "Can you elaborate on that a bit more?"
- "That's interesting. Can you explain the difference between X and Y?"
- "Could you walk me through your specific approach?"

Keep it under 150 characters. Your follow-up question:`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text?.trim();
      return text || "Could you elaborate on that a bit more?";
    } catch (error) {
      return "Could you elaborate on that a bit more?";
    }
  }

  async generateInterviewQuestion(
    role: string, 
    conversationHistory: string, 
    userPattern: UserPattern,
    jdSkills?: string[],
    jdResponsibilities?: string[]
  ): Promise<string> {
    let patternGuidance = "";
    let acknowledgment = "";
    
    if (userPattern === "confused") {
      patternGuidance = "The candidate seems hesitant or confused. Be SUPPORTIVE and offer guidance. Ask simpler questions with clear expectations. Use slower pacing.";
      acknowledgment = "Start supportively: 'No worries! Let me ask something simpler...' or 'That's okay. Here's a clearer question...'";
    } else if (userPattern === "efficient") {
      patternGuidance = "The candidate is efficient and wants quick results. Compress the interview flow with focused, challenging questions.";
      acknowledgment = "Start with 'Perfect! Quick next one...' or 'Great! Moving fast - here's a tougher question...'";
    } else if (userPattern === "chatty") {
      patternGuidance = "The candidate goes off-topic or is chatty. Politely redirect to interview topics with specific, focused questions.";
      acknowledgment = "Start with 'I appreciate that! Now, let me ask something specific...' or 'Thanks! Let's focus on...'";
    } else if (userPattern === "edge_case") {
      patternGuidance = "The candidate is giving edge-case or unrelated responses. Politely but firmly redirect: 'I need to stay focused on interview practice.'";
      acknowledgment = "Start with 'I need to stay focused on the interview. Let me ask...' or 'Let's get back on track...'";
    } else {
      patternGuidance = "Start with a moderate-level question. Be friendly, professional, and supportive.";
      acknowledgment = "Start with 'Good! Now...' or 'That's helpful. Let me ask about...'";
    }

    let jdContext = "";
    if (jdSkills && jdSkills.length > 0) {
      jdContext = `\n\nREQUIRED SKILLS: ${jdSkills.slice(0, 5).join(", ")}. Tailor the question to test these specific skills.`;
    }
    if (jdResponsibilities && jdResponsibilities.length > 0) {
      jdContext += `\nKEY RESPONSIBILITIES: ${jdResponsibilities.slice(0, 3).join(", ")}. Ask about relevant experience.`;
    }

    const recentContext = conversationHistory.substring(Math.max(0, conversationHistory.length - 600));
    const hasContext = recentContext.length > 50;

    const prompt = `You are a friendly, conversational AI interviewer for a ${role} position. ${patternGuidance}

${hasContext ? `Recent conversation:\n${recentContext}\n\nBased on their previous answer, acknowledge it briefly and then ask your next question. If they struggled, make it easier. If they excelled, make it harder.` : 'This is the beginning of the interview.'}

Role-specific focus areas (vary your questions across these topics):
- SDE: Ask about REAL-WORLD scenarios like debugging, code reviews, team collaboration, project architecture decisions, production issues, API design, database optimization, testing strategies, deployment processes, NOT just algorithms/data structures
- DevOps: CI/CD pipelines, infrastructure automation, monitoring, incident management, cloud services, containerization, security practices
- Data Analyst: Business insights, stakeholder communication, data storytelling, Excel/SQL practical scenarios, dashboard design, metric definition
- BA: Requirements gathering, stakeholder interviews, process mapping, documentation, conflict resolution, change management
- PM: Product strategy, user research, roadmap planning, trade-off decisions, stakeholder management, metrics definition, launch planning${jdContext}

${acknowledgment}

CRITICAL AGENT BEHAVIOR RULES:
1. TONE: Friendly, professional, supportive - be conversational, not robotic
2. BREVITY: Keep responses short and clear (under 250 characters)
3. PRACTICAL FOCUS: Ask about REAL situations, not theory
4. OFF-TOPIC HANDLING: If previous answer was off-topic, politely redirect: "I need to stay focused on the interview. Let me ask..."
5. INCOMPLETE ANSWERS: If previous answer was short/vague, ask follow-up for clarification
6. DETAILED ANSWERS: If answer was comprehensive, move intelligently to next topic

Return ONLY valid JSON in this format:
{
  "question": "Brief acknowledgment + your question (max 250 chars)",
  "category": "Technical" or "Behavioral",
  "difficulty": "Easy" or "Medium" or "Hard"
}

Category guide:
- Technical: Code, systems, tools, architecture, debugging, performance, design
- Behavioral: Team collaboration, conflict resolution, leadership, communication, time management, decision making

Difficulty guide:
- Easy: Basic concepts, simple scenarios, common situations
- Medium: Moderate complexity, requires some depth, practical experience
- Hard: Complex scenarios, system design, advanced concepts, senior-level decisions

Examples:
{"question": "Great! Tell me about a challenging production bug you fixed recently.", "category": "Technical", "difficulty": "Medium"}
{"question": "I see. How do you handle disagreements with team members?", "category": "Behavioral", "difficulty": "Easy"}

Output only valid JSON:`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text?.trim() || "";
      
      // Try to parse JSON response
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return JSON.stringify({
          question: parsed.question || "Tell me about a challenging project you worked on.",
          category: parsed.category || "Technical",
          difficulty: parsed.difficulty || "Medium"
        });
      }
      
      // Fallback if JSON parsing fails
      return JSON.stringify({
        question: "Tell me about a challenging project you worked on.",
        category: "Technical",
        difficulty: "Medium"
      });
    } catch (error) {
      console.error("[GeminiService] Error generating question:", error);
      return JSON.stringify({
        question: "Tell me about a challenging project you worked on.",
        category: "Technical",
        difficulty: "Medium"
      });
    }
  }

  async generateFeedback(conversationHistory: string, role: string): Promise<any> {
    const prompt = `Analyze this ${role} interview conversation and provide constructive feedback in JSON format.

Conversation:
${conversationHistory.substring(Math.max(0, conversationHistory.length - 2000))}

Provide scores (0-10 decimals) and feedback:
{
  "communication": <score>,
  "technicalDepth": <score>,
  "problemSolving": <score>,
  "confidence": <score>,
  "overallScore": <score>,
  "strengths": ["specific strength 1", "specific strength 2"],
  "improvements": ["specific area 1", "specific area 2"],
  "detailedFeedback": "2-3 sentence summary"
}

Output only valid JSON:`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text?.trim();
      if (text) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            communication: Number(parsed.communication) || 7,
            technicalDepth: Number(parsed.technicalDepth) || 6.5,
            problemSolving: Number(parsed.problemSolving) || 7,
            confidence: Number(parsed.confidence) || 7,
            overallScore: Number(parsed.overallScore) || 6.9,
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Good communication", "Professional"],
            improvements: Array.isArray(parsed.improvements) ? parsed.improvements : ["More examples", "Deeper technical details"],
            detailedFeedback: parsed.detailedFeedback || "Good performance overall.",
            questionSummaries: [],
          };
        }
      }
    } catch (error) {
      console.error("Error generating feedback:", error);
    }
    return null;
  }

  async extractDocuments(jdContent: string, resumeContent: string): Promise<any> {
    const prompt = `Analyze the Job Description and Resume below. Extract key information in JSON format.

Job Description:
${jdContent.substring(0, 2000)}

Resume:
${resumeContent.substring(0, 2000)}

Return ONLY valid JSON with this exact structure:
{
  "requiredSkills": ["skill1", "skill2", "skill3"],
  "keyResponsibilities": ["responsibility1", "responsibility2"],
  "candidateStrengths": ["strength1", "strength2"],
  "candidateWeaknesses": ["weakness1", "weakness2"]
}

JSON only:`;
    try {
      const response = await this.ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      const text = response.text?.trim();
      if (text) {
        const match = text.match(/\{[\s\S]*\}/);
        if (match) {
          const parsed = JSON.parse(match[0]);
          return {
            requiredSkills: Array.isArray(parsed.requiredSkills) ? parsed.requiredSkills : [],
            keyResponsibilities: Array.isArray(parsed.keyResponsibilities) ? parsed.keyResponsibilities : [],
            candidateStrengths: Array.isArray(parsed.candidateStrengths) ? parsed.candidateStrengths : [],
            candidateWeaknesses: Array.isArray(parsed.candidateWeaknesses) ? parsed.candidateWeaknesses : [],
          };
        }
      }
    } catch (error) {
      console.error("Error extracting documents:", error);
    }
    return null;
  }
}
