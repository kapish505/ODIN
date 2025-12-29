import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function evaluateThreatScenario(context: {
    missionId: string;
    threatType: string; // e.g., 'Solar Flare', 'Debris'
    severity: string;
    currentTrajectory: any;
    fuelLevel: number; // percentage
    crewStatus: string;
}) {
    try {
        if (!process.env.OPENAI_API_KEY) {
            console.warn("OPENAI_API_KEY not set. Returning mock AI response.");
            return mockAiResponse(context);
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "system",
                    content: `You are ODIN (Optimal Dynamic Interplanetary Navigator), an advanced AI strategy co-pilot for a spacecraft mission to the Moon.
Your goal is to ensure mission success and crew safety under uncertain conditions.
Analyze the provided threat context and trajectory data.
Propose a decision: either "MAINTAIN_TRAJECTORY" or "REPLAN_TRAJECTORY".
If "REPLAN_TRAJECTORY", suggest specific parameters for the new path (e.g., "increase delta-v", "delay arrival").
Justify your decision with clear, human-readable logs that explain the trade-offs (e.g., time vs. radiation vs. fuel).
Output format: JSON with fields: "decision", "reasoning", "suggestedAction", "logEntry".`
                },
                {
                    role: "user",
                    content: JSON.stringify(context)
                }
            ],
            response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        if (!content) throw new Error("No response from AI");

        return JSON.parse(content);
    } catch (error) {
        console.error("AI Evaluation failed:", error);
        // Fallback to safe default
        return {
            decision: "MAINTAIN_TRAJECTORY",
            reasoning: "AI Service unavailable. Defaulting to current safe path.",
            suggestedAction: "Monitor situation manually.",
            logEntry: "WARN: AI Co-pilot offline. Keeping current trajectory."
        };
    }
}

function mockAiResponse(context: any) {
    const isHighRisk = context.severity.toLowerCase().includes("high") || context.severity.toLowerCase().includes("critical");

    if (isHighRisk) {
        return {
            decision: "REPLAN_TRAJECTORY",
            reasoning: `High severity ${context.threatType} detected. Current path risks excessive exposure. Fuel reserves (${context.fuelLevel}%) sufficient for maneuver.`,
            suggestedAction: "Initiate Hohmann transfer modification to raise periapsis.",
            logEntry: `${context.threatType} detected. Rerouting via alternate trajectory. Result: +4 hours travel time, -85% risk exposure.`
        };
    }

    return {
        decision: "MAINTAIN_TRAJECTORY",
        reasoning: `${context.threatType} severity is manageable. Deviation cost outweighs risk.`,
        suggestedAction: "Continue monitoring. No maneuver required.",
        logEntry: `Minor ${context.threatType} noted. Maintaining primary trajectory to preserve fuel efficiency.`
    };
}
