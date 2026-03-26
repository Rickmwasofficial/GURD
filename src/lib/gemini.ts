import { GoogleGenAI, Type } from "@google/genai";
import { Diagnosis } from "../types";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY is not set");
}

const ai = new GoogleGenAI({ apiKey });

export async function getDiagnosis(
  age: number,
  gender: string,
  symptoms: string[],
  symptomSeverity: Record<string, number>,
  locationName: string,
  images?: { face?: string; body?: string }
): Promise<Diagnosis['diagnosis']> {
  const symptomDescriptions = symptoms.map(s => {
    const severity = symptomSeverity[s] || 5;
    return `${s} (severity: ${severity}/10)`;
  }).join(', ');

  const prompt = `You are an expert medical AI assistant helping Community Health Volunteers in rural Kenya diagnose common childhood illnesses.

PATIENT INFORMATION:
- Age: ${age} months old child
- Gender: ${gender}
- Symptoms: ${symptomDescriptions}
- Location: ${locationName}

DIAGNOSTIC TASK:
Analyze the symptoms to determine the most likely diagnosis from these conditions:
1. Acute Malaria (Plasmodium falciparum)
2. Pneumonia (bacterial or viral)
3. Severe Acute Malnutrition (SAM)
4. Moderate Acute Malnutrition (MAM)
5. Combination of the above

CLINICAL CONTEXT:
- In rural Kenya, malaria is hyperendemic
- Pneumonia is the leading cause of death in children under 5
- Malnutrition weakens immune response and complicates diagnosis
- Children can die within 24 hours if not treated

RESPONSE FORMAT (JSON ONLY):
{
  "primaryDiagnosis": "specific diagnosis",
  "secondaryDiagnosis": "if applicable, otherwise null",
  "confidence": 85,
  "urgency": "critical|high|medium|low",
  "reasoning": "brief clinical reasoning for this diagnosis",
  "keyFindings": ["finding 1", "finding 2"],
  "treatment": {
    "immediate": "immediate actions required",
    "medication": "specific drugs and dosages",
    "monitoring": "what to watch for"
  },
  "redFlags": ["red flag 1", "red flag 2"],
  "referralNeeded": true,
  "followUp": "when to follow up"
}

CRITICAL REASONING RULES:
- High fever + chills + sweating = strong malaria indicator
- Rapid breathing + cough = pneumonia indicator
- Fever + rapid breathing = could be both malaria AND pneumonia
- If urgency is "critical" or "high", always recommend hospital referral
- Consider age: infants <6 months are higher risk
- If severity scores are >7, increase urgency level`;

  const parts: any[] = [{ text: prompt }];

  if (images?.face) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: images.face.split(',')[1]
      }
    });
    parts.push({ text: "Face photo for malnutrition assessment." });
  }

  if (images?.body) {
    parts.push({
      inlineData: {
        mimeType: "image/jpeg",
        data: images.body.split(',')[1]
      }
    });
    parts.push({ text: "Body photo for malnutrition assessment." });
  }

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: { parts },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          primaryDiagnosis: { type: Type.STRING },
          secondaryDiagnosis: { type: Type.STRING },
          confidence: { type: Type.INTEGER },
          urgency: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          keyFindings: { type: Type.ARRAY, items: { type: Type.STRING } },
          treatment: {
            type: Type.OBJECT,
            properties: {
              immediate: { type: Type.STRING },
              medication: { type: Type.STRING },
              monitoring: { type: Type.STRING }
            }
          },
          redFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
          referralNeeded: { type: Type.BOOLEAN },
          followUp: { type: Type.STRING }
        },
        required: ["primaryDiagnosis", "confidence", "urgency", "reasoning", "keyFindings", "treatment", "redFlags", "referralNeeded", "followUp"]
      }
    }
  });

  return JSON.parse(response.text);
}
