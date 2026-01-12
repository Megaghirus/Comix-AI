import { GoogleGenAI, Type } from "@google/genai";
import { Character, GeneratedPanelData, ComicStyle } from "../types";

// Helper to get a fresh instance with the user's selected key
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const checkApiKey = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    return await window.aistudio.hasSelectedApiKey();
  }
  return false;
};

export const promptForApiKey = async (): Promise<void> => {
  if (window.aistudio && window.aistudio.openSelectKey) {
    await window.aistudio.openSelectKey();
  } else {
    alert("AI Studio environment not detected.");
  }
};

/**
 * Analyzes an uploaded image to generate a character description.
 */
export const analyzeCharacterImage = async (base64Image: string): Promise<string> => {
  const ai = getAIClient();
  const prompt = "Describe the physical appearance of the character in this image in detail, focusing on facial features, hair, clothing, and distinct traits suitable for generating consistent comic book images. Do not include background details.";

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
          { text: prompt }
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

/**
 * Generates an avatar image for a character.
 * Supports Image-to-Image if referenceImageBase64 is provided.
 */
export const generateCharacterAvatar = async (
  name: string, 
  description: string, 
  style: ComicStyle = 'comic-book',
  referenceImageBase64?: string
): Promise<string> => {
  const ai = getAIClient();
  const stylePrompt = getStylePrompt(style);
  
  // Explicit instructions to prevent text generation
  const noTextInstruction = "IMPORTANT: Do NOT generate any text, speech bubbles, captions, name tags, or typography inside the image. The image must be a clean character portrait only.";

  let userPrompt = `Create a character portrait. Name: ${name}. Style: ${stylePrompt}. ${noTextInstruction}`;
  
  if (referenceImageBase64) {
    userPrompt += `\nINSTRUCTION: Transform the person in the attached reference image into a ${style} character. MAINTAIN STRONG FACIAL RESEMBLANCE to the reference image (eyes, nose, mouth shape). Keep the hair and clothing similar but render everything in the requested artistic style.`;
  } else {
    userPrompt += `\nDescription: ${description}. Neutral background.`;
  }

  const parts: any[] = [{ text: userPrompt }];

  if (referenceImageBase64) {
    // Extract base64 data if it includes the prefix
    const data = referenceImageBase64.includes(',') 
      ? referenceImageBase64.split(',')[1] 
      : referenceImageBase64;
      
    parts.push({
      inlineData: {
        mimeType: 'image/png',
        data: data
      }
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned");
  } catch (error) {
    console.error("Error generating avatar:", error);
    throw error;
  }
};

/**
 * Step 1: Generates text content based on selected characters and style.
 */
export const generatePanelTextData = async (
  sceneDescription: string,
  characters: Character[],
  style: ComicStyle
): Promise<GeneratedPanelData> => {
  const ai = getAIClient();
  
  const charContext = characters.map(c => `${c.name}: ${c.description}`).join("\n");
  const stylePrompt = getStylePrompt(style);

  const systemInstruction = `
    Ești un regizor și scenarist de benzi desenate expert.
    Stilul vizual selectat este: ${style}.
    
    Returnează un JSON cu:
    1. 'caption': O scurtă narațiune sau replică de dialog în limba ROMÂNĂ.
    2. 'imagePrompt': Un prompt vizual detaliat în ENGLEZĂ. 
       Acesta TREBUIE să includă descrierea fizică a personajelor selectate (${charContext}).
       Specifică stilul artistic: ${stylePrompt}.
  `;

  const userPrompt = `
    Personaje prezente în scenă:
    ${charContext}

    Acțiunea dorită:
    ${sceneDescription}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: userPrompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            caption: { type: Type.STRING },
            imagePrompt: { type: Type.STRING }
          },
          required: ["caption", "imagePrompt"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No text response");
    
    return JSON.parse(text) as GeneratedPanelData;
  } catch (error) {
    console.error("Error generating panel text:", error);
    throw error;
  }
};

/**
 * Step 2: Generates the actual image.
 */
export const generatePanelImage = async (imagePrompt: string): Promise<string> => {
  const ai = getAIClient();
  
  // Ensure the panel image also doesn't contain accidental text/bubbles from the model itself, 
  // as we add them programmatically.
  const cleanImagePrompt = `${imagePrompt} . Do not include speech bubbles or text in the image itself.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: {
        parts: [{ text: cleanImagePrompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "16:9",
          imageSize: "1K"
        }
      },
    });

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data returned for panel");
  } catch (error) {
    console.error("Error generating panel image:", error);
    throw error;
  }
};

function getStylePrompt(style: ComicStyle): string {
  switch (style) {
    case 'anime': return "Anime style, cel shaded, vibrant, Studio Ghibli inspired details";
    case 'realistic': return "Cinematic realistic photography, 8k, highly detailed, dramatic lighting";
    case 'black-white': return "Noir comic style, black and white, high contrast ink lines, Sin City style";
    case 'watercolor': return "Watercolor painting style, soft edges, artistic, pastel colors";
    case 'pixel': return "Pixel art style, 16-bit retro game aesthetic";
    case 'comic-book':
    default: return "Modern American comic book style, bold lines, vibrant colors, dynamic shading";
  }
}