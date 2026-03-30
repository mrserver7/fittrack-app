import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export function getGeminiModel() {
  return genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
}

export async function generateSessionSummary(sessionData: {
  exercises: { name: string; sets: { weight: number; reps: number; rpe?: number }[] }[];
  duration: number;
  totalVolume: number;
  prs: string[];
  previousVolume?: number;
}) {
  const model = getGeminiModel();
  const prompt = `You are a concise, motivating fitness AI coach. Analyze this workout session and give a brief 2-3 sentence summary with one actionable tip.

Session data:
- Duration: ${sessionData.duration} minutes
- Total volume: ${sessionData.totalVolume} kg
${sessionData.previousVolume ? `- Previous session volume: ${sessionData.previousVolume} kg (${Math.round(((sessionData.totalVolume - sessionData.previousVolume) / sessionData.previousVolume) * 100)}% change)` : ""}
- PRs hit: ${sessionData.prs.length > 0 ? sessionData.prs.join(", ") : "None"}
- Exercises: ${sessionData.exercises.map(e => `${e.name} (${e.sets.length} sets)`).join(", ")}

Keep it short, positive, and actionable. No markdown formatting.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateWeightSuggestion(exerciseData: {
  exerciseName: string;
  recentSessions: { date: string; weight: number; reps: number; rpe?: number }[];
  targetSets: number;
  targetRepsMin?: number;
  targetRepsMax?: number;
  targetRPE?: number;
}) {
  const model = getGeminiModel();
  const prompt = `You are a strength training AI. Based on recent performance, suggest today's working weight.

Exercise: ${exerciseData.exerciseName}
Target: ${exerciseData.targetSets} sets x ${exerciseData.targetRepsMin || "?"}${exerciseData.targetRepsMax ? `-${exerciseData.targetRepsMax}` : ""} reps${exerciseData.targetRPE ? ` @ RPE ${exerciseData.targetRPE}` : ""}

Recent sessions (newest first):
${exerciseData.recentSessions.map(s => `  ${s.date}: ${s.weight}kg x ${s.reps} reps${s.rpe ? ` @ RPE ${s.rpe}` : ""}`).join("\n")}

Respond with ONLY a JSON object: {"suggestedWeight": number, "reason": "brief explanation"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(text);
}

export async function chatWithCoach(message: string, context: {
  clientName: string;
  currentProgram?: string;
  recentWorkouts?: string;
  goals?: string;
}) {
  const model = getGeminiModel();
  const prompt = `You are a friendly, knowledgeable fitness AI coach inside the FitTrack app. You help clients with training questions, form tips, recovery advice, and motivation. Keep responses concise (2-4 sentences max). Be encouraging but honest.

Client: ${context.clientName}
${context.currentProgram ? `Current program: ${context.currentProgram}` : ""}
${context.recentWorkouts ? `Recent activity: ${context.recentWorkouts}` : ""}
${context.goals ? `Goals: ${context.goals}` : ""}

Client asks: "${message}"

Respond naturally, no markdown formatting.`;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

export async function generateDeloadSuggestion(data: {
  weeksTraining: number;
  avgRPE: number;
  volumeTrend: string;
  performanceTrend: string;
}) {
  const model = getGeminiModel();
  const prompt = `You are a strength coach AI. Should this client deload?

- Consecutive training weeks: ${data.weeksTraining}
- Average RPE last week: ${data.avgRPE}
- Volume trend: ${data.volumeTrend}
- Performance trend: ${data.performanceTrend}

Respond with ONLY JSON: {"shouldDeload": boolean, "reason": "brief explanation", "suggestedAction": "brief recommendation"}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().replace(/```json\n?|\n?```/g, "").trim();
  return JSON.parse(text);
}
