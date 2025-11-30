

import { GoogleGenAI, Type, Modality } from "@google/genai";
import { ListeningScenario, TopicId, DifficultyLevel } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: API_KEY });

const SYSTEM_INSTRUCTION = `
You are an expert Japanese language educator specializing in JLPT and Business Japanese (BJT).
Create realistic, level-appropriate content.
- Use natural phrasing suitable for the requested level.
- Ensure the content is substantive and logical.
- CRITICAL: Provide Furigana for ALL Kanji in 'japanese_html', 'example_html', 'context_html', and 'explanation_html' fields using standard HTML <ruby> tags.
`;

/**
 * Helper to retry async operations that might fail due to network/server transient issues.
 */
async function retryOperation<T>(operation: () => Promise<T>, retries = 5, delay = 1000, operationName = 'Operation'): Promise<T> {
  try {
    return await operation();
  } catch (error: any) {
    const errString = String(error);
    const errMsg = error?.message || '';
    
    console.warn(`${operationName} failed (Retries left: ${retries}). Error:`, error);
    
    // Check for common error signatures including the specific RPC/XHR error
    const isNetworkError = 
      errMsg.includes('Rpc failed') || 
      errMsg.includes('fetch failed') ||
      errMsg.includes('network') ||
      errMsg.includes('xhr error') ||
      errString.includes('Rpc failed') ||
      errString.includes('xhr error') ||
      errString.includes('[0]'); // Often appears in the raw XHR error array

    const isServerError = 
      error?.status === 500 || 
      error?.status === 503 ||
      error?.code === 500 ||
      (error?.error && error.error.code === 500);

    const shouldRetry = retries > 0 && (isNetworkError || isServerError);

    if (shouldRetry) {
      // Exponential backoff with jitter
      const jitter = Math.random() * 500;
      const nextDelay = (delay * 1.5) + jitter;
      console.log(`Retrying ${operationName} in ${Math.round(nextDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, nextDelay));
      return retryOperation(operation, retries - 1, nextDelay, operationName);
    }
    
    throw error;
  }
}

export const generateScenario = async (topic: TopicId, level: DifficultyLevel, customPrompt?: string, numSpeakers: number = 2): Promise<ListeningScenario> => {
  return retryOperation(async () => {
    let levelInstruction = `Target Level: ${level}.`;
    if (level === 'Anime') {
        levelInstruction = `Target Level: Anime Style. Use casual, dramatic, or character-specific speech patterns typical of anime.`;
    } else if (level === 'Natural') {
        levelInstruction = `Target Level: Natural Speaking (Authentic). Use spontaneous-sounding Japanese. Include common fillers (e.g., あの、えーと、なんか), natural hesitations, contractions (e.g., ～ちゃう), and sentence-final particles typical of real conversation.`;
    } else if (level === 'N5') {
        levelInstruction = `Target Level: JLPT N5 (Beginner). Use very basic vocabulary and grammar (desu/masu form). Use primarily Hiragana and Katakana. Limit Kanji to N5 level (e.g., 日, 本, 人, 学, 生). Sentences should be short and simple.`;
    } else if (level === 'N4') {
        levelInstruction = `Target Level: JLPT N4 (Basic). Use basic vocabulary and grammar (te-form, nai-form, ta-form). Sentences can be slightly compound but keep them straightforward.`;
    }

    const isLongSpeech = topic.includes('long_speech');
    
    let structureInstruction = "";
    if (isLongSpeech) {
        let subType = 'Structured Presentation/Speech';
        if (topic === 'long_speech_news') subType = 'Formal News Report';
        else if (topic === 'long_speech_job_intro') subType = 'Company Information Session / Job Introduction Speech';
        else if (topic === 'long_speech_ceremony') subType = 'Formal Ceremony Speech (Greeting/Congratulatory)';

        structureInstruction = `
        This is a ${subType}.
        Content format: A SINGLE speaker (Narrator) giving a continuous speech/report.
        CRITICAL: Even though it is one speaker, SPLIT the 'dialogue' into 5-8 logical parts (paragraphs or sentence groups).
        Set the 'speaker' field for all parts to "Narrator".
        Do NOT create a conversation between two people.
        `;
    } else if (topic === 'company_interview') {
        structureInstruction = `
        This is a Job Interview (Formal Business Japanese).
        Speaker A: Interviewer (Hiring Manager/HR).
        Speaker B: Applicant (The listener's role model).
        The dialogue should cover: Self-introduction, strengths/weaknesses, motivation for applying, and specific questions related to the job field.
        Length: Approximately 10-14 exchanges.
        Context: ${customPrompt || 'General Job Interview'}
        `;
    } else if (topic === 'custom') {
        // Handle custom topic speaker counts
        if (numSpeakers === 1) {
            structureInstruction = `
            Format: Monologue / Short Story / Speech.
            Speaker: Narrator.
            Split the content into 5-8 logical parts.
            `;
        } else if (numSpeakers === 3) {
            structureInstruction = `
            Format: Conversation between 3 people (Speaker A, Speaker B, Speaker C).
            Ensure all 3 speakers participate naturally.
            Length: Approximately 12-16 exchanges total.
            `;
        } else {
            structureInstruction = `
            Format: Dialogue between 2 people (Speaker A and Speaker B).
            Length: Approximately 8-12 exchanges per speaker.
            `;
        }
    } else {
        structureInstruction = `
        The scenario should be a dialogue between two people (Speaker A and Speaker B).
        Length: Approximately 8-12 exchanges per speaker.
        `;
    }

    let topicDescription = topic.replace('long_speech_', '');
    if (topic === 'custom' && customPrompt) {
        topicDescription = customPrompt;
    } else if (topic === 'company_interview') {
        topicDescription = "Job Interview" + (customPrompt ? `: ${customPrompt}` : "");
    }

    const prompt = `Create a Japanese listening practice scenario about: ${topicDescription}.
    ${levelInstruction}
    ${structureInstruction}
    
    Format requirements:
    - Translations: Provide English, Japanese (for title/summary), and Myanmar translations for Title, Summary, Dialogue, Vocabulary, Grammar explanations, and Phrase meanings.
    - Dialogue: Provide the Japanese text (plain), Japanese text with HTML Ruby tags for Furigana (japanese_html), English translation, and Myanmar translation for each part.
    - Vocabulary: List 5-8 key words. Provide 'context' (example sentence) in plain Japanese AND 'context_html' (with <ruby> tags). Include English/Myanmar translations for the context.
    - Grammar: List 2-3 key grammar points. 
      - 'example': Japanese example sentence (plain).
      - 'example_html': Japanese example sentence with <ruby> tags.
      - 'example_en': English translation of example.
      - 'example_mm': Myanmar translation of example.
    - Useful Phrases: List 2-3 useful idiomatic phrases. 
      - 'context': Japanese example sentence (plain).
      - 'context_html': Japanese example sentence with <ruby> tags.
      - 'context_en': English translation of example.
      - 'context_mm': Myanmar translation of context.
    - Questions: 3 comprehension questions. Include English/Myanmar translations. 
      - 'explanation': The MAIN explanation must be in JAPANESE (plain text).
      - 'explanation_html': The MAIN explanation in JAPANESE with <ruby> tags for furigana.
      - 'explanation_en': English translation of the explanation.
      - 'explanation_mm': Myanmar translation of the explanation.
    
    For all '_html' fields, ensure ALL Kanji have furigana. Example: <ruby>日<rt>に</rt></ruby><ruby>本<rt>ほん</rt></ruby><ruby>語<rt>ご</rt></ruby>
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Title in English" },
            title_en: { type: Type.STRING },
            title_jp: { type: Type.STRING },
            title_mm: { type: Type.STRING },
            topic: { type: Type.STRING },
            difficulty: { type: Type.STRING, enum: ["N5", "N4", "N3", "N2", "N1", "BJT", "Native", "Anime", "Natural"] },
            summary: { type: Type.STRING, description: "Summary in English" },
            summary_en: { type: Type.STRING },
            summary_jp: { type: Type.STRING },
            summary_mm: { type: Type.STRING },
            dialogue: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  speaker: { type: Type.STRING, description: "A, B, C, or Narrator" },
                  japanese: { type: Type.STRING, description: "Plain text without tags" },
                  japanese_html: { type: Type.STRING, description: "Text with <ruby> tags for furigana" },
                  english: { type: Type.STRING },
                  myanmar: { type: Type.STRING },
                },
                required: ["speaker", "japanese", "japanese_html", "english", "myanmar"],
              },
            },
            vocabulary: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  reading: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  meaning_mm: { type: Type.STRING },
                  context: { type: Type.STRING },
                  context_html: { type: Type.STRING },
                  context_en: { type: Type.STRING },
                  context_mm: { type: Type.STRING },
                },
                required: ["word", "reading", "meaning", "meaning_mm"],
              },
            },
            grammar: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  pattern: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                  explanation_mm: { type: Type.STRING },
                  example: { type: Type.STRING },
                  example_html: { type: Type.STRING },
                  example_en: { type: Type.STRING },
                  example_mm: { type: Type.STRING },
                },
                required: ["pattern", "explanation", "explanation_mm", "example"],
              },
            },
            useful_phrases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phrase: { type: Type.STRING },
                  meaning: { type: Type.STRING },
                  meaning_mm: { type: Type.STRING },
                  context: { type: Type.STRING, description: "Japanese example sentence" },
                  context_html: { type: Type.STRING },
                  context_en: { type: Type.STRING, description: "English translation of context" },
                  context_mm: { type: Type.STRING, description: "Myanmar translation of context" },
                },
                required: ["phrase", "meaning", "meaning_mm", "context"],
              },
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  question: { type: Type.STRING },
                  question_en: { type: Type.STRING },
                  question_mm: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  options_en: { type: Type.ARRAY, items: { type: Type.STRING } },
                  options_mm: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correctIndex: { type: Type.INTEGER },
                  explanation: { type: Type.STRING, description: "Japanese explanation (Plain)" },
                  explanation_html: { type: Type.STRING, description: "Japanese explanation (Ruby)" },
                  explanation_en: { type: Type.STRING, description: "English explanation" },
                  explanation_mm: { type: Type.STRING, description: "Myanmar explanation" },
                },
                required: ["id", "question", "options", "correctIndex", "explanation"],
              },
            },
          },
          required: ["title", "topic", "difficulty", "summary", "dialogue", "vocabulary", "questions"],
        },
      },
    });

    let text = response.text || "";
    // Sanitize Markdown code blocks if present
    text = text.replace(/^```json\s*/, "").replace(/^```\s*/, "").replace(/\s*```$/, "");

    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as ListeningScenario;
  }, 5, 1000, "Generate Scenario");
};

interface VoiceMap {
  A?: string;
  B?: string;
  C?: string;
  Narrator?: string;
}

export const generateAudio = async (scenario: ListeningScenario, voiceMap?: VoiceMap): Promise<string> => {
  return retryOperation(async () => {
    let dialogueText = "";
    
    // Default voices if not provided
    const voices = {
      A: voiceMap?.A || 'Kore',
      B: voiceMap?.B || 'Fenrir',
      C: voiceMap?.C || 'Zephyr',
      Narrator: voiceMap?.Narrator || 'Fenrir'
    };

    // Check if it's a narrator/monologue style
    const isMonologue = scenario.dialogue.every(l => l.speaker === 'Narrator');
    
    if (isMonologue) {
        // Single Speaker Mode
        scenario.dialogue.forEach(line => {
             dialogueText += `${line.japanese}\n`;
        });

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: dialogueText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voices.Narrator }
              }
            }
          }
        });
        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("Failed to generate audio data");
        return audioData;

    } else {
        // Multi Speaker Mode
        
        // 1. Identify all unique speakers in the dialogue
        const uniqueSpeakers = Array.from(new Set(scenario.dialogue.map(l => (l.speaker || "").trim())))
            .filter(s => s && s !== 'Narrator'); // Exclude Narrator if mixed (rare) or handle separately
        
        // 2. Dynamically map unique speakers to 'Speaker A' and 'Speaker B' slots.
        // The API only supports exactly 2 enabled_voices in multiSpeakerVoiceConfig.
        const speakerToLabelMap: Record<string, string> = {};
        const availableSlots = ['Speaker A', 'Speaker B'];
        
        uniqueSpeakers.forEach((speakerName, index) => {
            // If we have more than 2 speakers, we wrap around or reuse Speaker B.
            // This is a limitation of the current API (max 2 distinct voices per request).
            // For 3 speakers, C will use Voice B's slot (but we can't change the voice mid-stream easily).
            const slot = index < availableSlots.length ? availableSlots[index] : 'Speaker B';
            speakerToLabelMap[speakerName] = slot;
        });

        // 3. Construct dialogue with mapped labels
        scenario.dialogue.forEach(line => {
            const originalSpeaker = (line.speaker || "").trim();
            let label = speakerToLabelMap[originalSpeaker];
            
            // Fallback for Narrator in dialogue or unexpected speakers
            if (!label) {
                label = 'Speaker A'; 
            }
            
            dialogueText += `${label}: ${line.japanese}\n`;
        });

        // 4. Configure the 2 voices
        const speakerVoiceConfigs = [
            {
                speaker: 'Speaker A',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voices.A } }
            },
            {
                speaker: 'Speaker B',
                voiceConfig: { prebuiltVoiceConfig: { voiceName: voices.B } }
            }
        ];

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash-preview-tts",
          contents: [{ parts: [{ text: dialogueText }] }],
          config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
              multiSpeakerVoiceConfig: {
                speakerVoiceConfigs: speakerVoiceConfigs
              }
            }
          }
        });

        const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!audioData) throw new Error("Failed to generate audio data");
        return audioData;
    }
  }, 5, 1000, "Generate Audio");
};

export const generateLineAudio = async (text: string, speaker: string): Promise<string> => {
  return retryOperation(async () => {
    // Determine voice based on speaker 'A' or others
    // Try to guess gender/role from speaker string or default
    let voiceName = 'Fenrir';
    if (speaker === 'A' || speaker === 'female' || speaker.includes('Woman') || speaker.includes('Female')) {
        voiceName = 'Kore';
    } else if (speaker === 'B' || speaker === 'male' || speaker.includes('Man') || speaker.includes('Male')) {
        voiceName = 'Fenrir';
    }
    
    if (!text || text.trim().length === 0) {
        throw new Error("Text is empty");
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("Failed to generate audio data");

    return audioData;
  }, 3, 1000, "Generate Line Audio"); 
};

export const generatePreviewAudio = async (voiceName: string): Promise<string> => {
  return retryOperation(async () => {
    // Standard preview phrase default
    let text = "天気がいいから、頑張りましょう。";
    
    // Map specific voices to specific character scripts
    switch (voiceName) {
        case 'Kore': // Haruka
            text = "日本に着いたら、寿司タワーを食べるぞ！歩け！";
            break;
        case 'Zephyr': // Miki
            text = "寝たら負け！カフェインで脳を洗おう！";
            break;
        case 'Puck': // Kenji
            text = "RSがない？じゃあ、目の前のノートが運命だ！";
            break;
        case 'Fenrir': // Hiroshi
            text = "東京のバナナは別格だ！それを目標に頑張ろう！";
            break;
        case 'Charon': // Taro
            text = "試験は俺を落とせない！逆に試験が泣きながら降参する！";
            break;
        default:
            text = "天気がいいから、頑張りましょう。";
            break;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: voiceName }
          }
        }
      }
    });

    const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!audioData) throw new Error("Failed to generate preview audio");

    return audioData;
  }, 3, 1000, "Preview Audio");
};