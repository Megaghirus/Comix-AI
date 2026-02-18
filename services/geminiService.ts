import { GoogleGenAI, Type } from "@google/genai";
import { Character, GeneratedPanelData, ComicStyle, Language } from "../types";

// --- API KEYS STORAGE ---
let keys = {
    gemini: null as string | null,
    openai: null as string | null,
    deepseek: null as string | null,
    grok: null as string | null,
    qwen: null as string | null,
};

export type LLMProvider = keyof typeof keys;

export const setApiKeys = (newKeys: Partial<typeof keys>) => {
    keys = { ...keys, ...newKeys };
};

// --- API CLIENT HELPERS ---

const getGeminiClient = () => {
  if (keys.gemini) return new GoogleGenAI({ apiKey: keys.gemini });
  if (process.env.API_KEY) return new GoogleGenAI({ apiKey: process.env.API_KEY });
  throw new Error("Gemini API Key is missing. Configure it in Settings.");
};

// --- GENERIC OPENAI-COMPATIBLE CLIENT ---
// Used for DeepSeek, Grok, Qwen, and OpenAI
async function callLLM(
    provider: 'openai' | 'deepseek' | 'grok' | 'qwen',
    systemPrompt: string,
    userPrompt: string,
    jsonMode: boolean = true
): Promise<string> {
    let url = '';
    let model = '';
    let apiKey = '';

    switch (provider) {
        case 'openai':
            url = 'https://api.openai.com/v1/chat/completions';
            model = 'gpt-4o';
            apiKey = keys.openai || '';
            break;
        case 'deepseek':
            url = 'https://api.deepseek.com/chat/completions';
            model = 'deepseek-chat'; 
            apiKey = keys.deepseek || '';
            break;
        case 'grok':
            url = 'https://api.x.ai/v1/chat/completions';
            model = 'grok-2-latest';
            apiKey = keys.grok || '';
            break;
        case 'qwen':
            url = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions'; 
            model = 'qwen-plus';
            apiKey = keys.qwen || '';
            break;
    }

    if (!apiKey) throw new Error(`Missing API Key for ${provider}`);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: jsonMode && provider !== 'grok' ? { type: "json_object" } : undefined, 
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`${provider} API Error: ${err}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    } catch (error) {
        console.error(`${provider} Call Failed:`, error);
        throw error;
    }
}

// --- HELPER: ROBUST JSON PARSER ---
const cleanAndParseJSON = (text: string) => {
    if (!text) return null;
    try {
        let clean = text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
        return JSON.parse(clean);
    } catch (e) {
        console.error("JSON Parse Error:", e);
        try {
            const firstChar = text.match(/[\{\[]/);
            if (firstChar) {
                const start = text.indexOf(firstChar[0]);
                const endChar = firstChar[0] === '{' ? '}' : ']';
                const end = text.lastIndexOf(endChar);
                if (end > start) {
                    return JSON.parse(text.substring(start, end + 1));
                }
            }
        } catch (retryErr) {}
        throw new Error("AI Response Format Error.");
    }
};

// --- VALIDATION FUNCTIONS ---
export const validateKey = async (provider: LLMProvider, key: string): Promise<boolean> => {
    if (!key) return false;
    
    if (provider === 'gemini') {
        try {
            const ai = new GoogleGenAI({ apiKey: key });
            await ai.models.generateContent({ model: "gemini-3-flash-preview", contents: "Test" });
            return true;
        } catch { return false; }
    }

    let url = '';
    if (provider === 'openai') url = 'https://api.openai.com/v1/models';
    if (provider === 'deepseek') url = 'https://api.deepseek.com/models';
    if (provider === 'grok') url = 'https://api.x.ai/v1/models';
    if (provider === 'qwen') url = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/models';

    try {
        const res = await fetch(url, { method: 'GET', headers: { 'Authorization': `Bearer ${key}` } });
        return res.status === 200;
    } catch { return false; }
};

// --- HYBRID ORCHESTRATOR ---
async function generateTextHybrid(systemPrompt: string, userPrompt: string): Promise<string> {
    
    if (keys.deepseek) {
        try { return await callLLM('deepseek', systemPrompt, userPrompt); } catch (e) {}
    }
    if (keys.openai) {
        try { return await callLLM('openai', systemPrompt, userPrompt); } catch (e) {}
    }
    if (keys.grok) {
        try { return await callLLM('grok', systemPrompt, userPrompt); } catch (e) {}
    }
    if (keys.qwen) {
        try { return await callLLM('qwen', systemPrompt, userPrompt); } catch (e) {}
    }

    const ai = getGeminiClient();
    const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userPrompt,
        config: { systemInstruction: systemPrompt }
    });
    return result.text || "";
}

// --- NEW: PROMPT OPTIMIZER ---
export const optimizeSystemPrompt = async (basePrompt: string, lang: Language): Promise<string> => {
    const optimizerSystem = `You are a specialized Prompt Engineer. Your goal is to improve the user's system prompt to be more professional, structured, and effective for an AI Comic Creator Agent.
    The output must be in the same language as the input language or specifically in ${lang.toUpperCase()} if requested.
    Keep the original intent but enhance vocabulary, define constraints, and add persona details.`;
    
    const userMsg = `Improve this system prompt for an AI that creates comic scripts/images: "${basePrompt}". Language: ${lang}. Return ONLY the improved prompt text.`;

    return await generateTextHybrid(optimizerSystem, userMsg);
};


// --- AI FUNCTIONS ---

export const generateDescriptionFromConcept = async (concept: string, lang: Language): Promise<string> => {
    return await generateTextHybrid(
        `Ești un expert în design de personaje. Răspunde în limba ${lang}. Transformă conceptul într-o descriere vizuală detaliată (max 50 cuvinte).`,
        `Concept: "${concept}"`
    );
};

export const enhanceSceneDescription = async (simpleIdea: string, lang: Language): Promise<string> => {
    return await generateTextHybrid(
        `Ești un scenarist de benzi desenate. Răspunde în limba ${lang}. Dezvoltă ideea într-o descriere atmosferică, concisă (max 60 cuvinte).`,
        `Idee: "${simpleIdea}"`
    );
};

export interface ScriptPanel {
    description: string;
    caption: string;
}

export const generateStoryScript = async (
    storyIdea: string, 
    characters: Character[],
    lang: Language,
    customSystemPrompt?: string,
    numPanels: number = 4
): Promise<ScriptPanel[]> => {
    const charNames = characters.map(c => c.name).join(", ");
    
    // Base persona + User defined persona
    const baseSystem = customSystemPrompt 
        ? `${customSystemPrompt}. \nIMPORTANT: Output the 'caption' field strictly in ${lang.toUpperCase()} language. The 'description' field must be in ENGLISH for image generation.` 
        : `You are a professional comic book writer. Task: Break the story idea into exactly ${numPanels} sequential comic book panels.
           For each panel return JSON: { "description": "Visual details (English)", "caption": "Narration/Dialogue (${lang.toUpperCase()})" }.
           Output strictly a JSON Array.`;

    const userPrompt = `Story Idea: "${storyIdea}". Characters: ${charNames}.`;

    try {
        const text = await generateTextHybrid(baseSystem, userPrompt);
        return cleanAndParseJSON(text) as ScriptPanel[];
    } catch (error) {
        console.error("Script Gen Error:", error);
        throw error;
    }
};

export const analyzeCharacterImage = async (base64Image: string, lang: Language): Promise<string> => {
  const ai = getGeminiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/png', data: base64Image.split(',')[1] } },
          { text: `Describe character appearance in detail (face, clothes) in ${lang} language.` }
        ],
      },
    });
    return response.text || "";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

export const generateCharacterAvatar = async (
  name: string, 
  description: string, 
  style: ComicStyle = 'comic-book',
  referenceImageBase64?: string,
  isFullBody: boolean = false
): Promise<string> => {
  const ai = getGeminiClient();
  const stylePrompt = getStylePrompt(style);
  const shotType = isFullBody ? "Full body shot, head to toe visible" : "Close-up portrait";
  const aspectRatio = isFullBody ? "3:4" : "1:1";

  const detailedPrompt = await generateTextHybrid(
      "You are a Visual Prompt Engineer. Enhance this character description for an AI Image Generator. Keep it comma-separated, focus on visual adjectives.",
      `Character: ${name}. ${description}. Style: ${style}.`
  );

  let finalPrompt = `Character Design: ${name}. ${shotType}. ${detailedPrompt}. Style: ${stylePrompt}. No text. Neutral background.`;

  const parts: any[] = [{ text: finalPrompt }];
  if (referenceImageBase64) {
    const data = referenceImageBase64.includes(',') ? referenceImageBase64.split(',')[1] : referenceImageBase64;
    parts.push({ inlineData: { mimeType: 'image/png', data: data } });
    parts.push({ text: "Maintain strong facial resemblance to reference." });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } },
    });
    
    if (!response.candidates || response.candidates.length === 0) throw new Error("Safety Block");

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error) {
    console.error("Avatar Gen Error:", error);
    throw error;
  }
};

export const generatePanelTextData = async (
  sceneDescription: string,
  characters: Character[],
  style: ComicStyle,
  lang: Language,
  customSystemPrompt?: string,
  useProMode: boolean = false
): Promise<GeneratedPanelData> => {
  
  const charContext = characters.map(c => `${c.name}: ${c.description}`).join("\n");
  
  const baseSystem = customSystemPrompt
    ? `${customSystemPrompt}. \nTask: Create a comic panel. Output JSON: { "caption": "Narration in ${lang}", "imagePrompt": "Visual prompt in English" }. Context: ${charContext}`
    : `You are a comic book director. Style: ${style}.
      Output JSON:
      1. 'caption': Narration/Dialogue (${lang}, max 15 words).
      2. 'imagePrompt': Detailed visual prompt (English). Include camera angle, lighting. Context: ${charContext}.`;

  const userMessage = `Scene: ${sceneDescription}`;

  try {
      const text = await generateTextHybrid(baseSystem, userMessage);
      return cleanAndParseJSON(text) as GeneratedPanelData;
  } catch (error) {
    console.error("Panel Data Error:", error);
    throw error;
  }
};

export const generatePanelImage = async (
  imagePrompt: string, 
  activeCharacters: Character[],
  model: string = 'gemini-3-pro-image-preview',
  aspectRatio: string = '16:9'
): Promise<string> => {
  const ai = getGeminiClient();

  const parts: any[] = [];
  if (activeCharacters.length > 0) {
      parts.push({ text: "STRICT: Maintain character identity from references." });
      activeCharacters.forEach((char) => {
          if (char.avatarUrl && char.avatarUrl.includes(',')) {
              parts.push({ text: `REF '${char.name}':` });
              parts.push({ inlineData: { mimeType: 'image/png', data: char.avatarUrl.split(',')[1] } });
              parts.push({ text: `${char.description}` });
          }
      });
  }

  parts.push({ text: `SCENE: ${imagePrompt}. Style: High quality comic art, detailed. No text bubbles.` });

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: aspectRatio as any, imageSize: "1K" } },
    });

    if (!response.candidates || response.candidates.length === 0) throw new Error("Safety Block");

    for (const part of response.candidates[0].content.parts) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data");
  } catch (error) {
    console.error("Panel Image Error:", error);
    throw error;
  }
};

export const generateCoverImage = async (title: string, style: ComicStyle): Promise<string> => {
    const ai = getGeminiClient();
    const stylePrompt = getStylePrompt(style);
    
    const creativePrompt = await generateTextHybrid(
        "Create a visual description for a comic book cover.",
        `Title: "${title}". Style: ${style}.`
    );

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: `Cover Art: ${creativePrompt}. Style: ${stylePrompt}. No text.` }] },
            config: { imageConfig: { aspectRatio: "3:4", imageSize: "1K" } },
        });

        if (!response.candidates || response.candidates.length === 0) throw new Error("Safety Block");

        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
        }
        throw new Error("No cover data");
    } catch (error) {
        throw error;
    }
}

function getStylePrompt(style: ComicStyle): string {
  switch (style) {
    case 'anime': return "Anime style, cel shaded, vibrant, Studio Ghibli inspired details";
    case 'realistic': return "Cinematic realistic photography, 8k, highly detailed, dramatic lighting";
    case 'black-white': return "Noir comic style, black and white, high contrast ink lines, Sin City style";
    case 'pixel': return "Pixel art style, 16-bit retro game aesthetic";
    case 'watercolor': return "Watercolor painting style, soft edges, artistic, dreamy, pastel colors";
    case 'cyberpunk': return "Cyberpunk sci-fi style, neon lights, high tech, dark atmosphere, futuristic details";
    case 'steampunk': return "Steampunk style, brass, gears, victorian clothing, mechanical details, sepia tones";
    case '3d-render': return "3D Render style, Pixar/Disney animation style, cute, rounded shapes, soft lighting, 4k";
    case 'sketch': return "Pencil sketch style, rough lines, artistic, hand-drawn look, graphite textures";
    case 'retro-80s': return "Retro 80s Synthwave style, vibrant neon pinks and blues, grid backgrounds, vintage vibe";
    case 'flat-art': return "Modern Flat Art style, vector graphics, clean lines, bold solid colors, corporate memphis style";
    case 'comic-book':
    default: return "Modern American comic book style, bold lines, vibrant colors, dynamic shading, masterpiece";
  }
}