

export interface VocabularyItem {
  word: string;     // Can be Word, Grammar Pattern, or Phrase
  reading: string;  // Reading or Context
  meaning: string;  // English Meaning/Explanation
  meaning_mm?: string; // Myanmar Meaning/Explanation
  type?: 'vocab' | 'grammar' | 'phrase'; // New field to distinguish type
  context?: string; // Example sentence or context
  context_html?: string; // Example sentence with ruby tags
  context_en?: string; // English translation of context
  context_mm?: string; // Myanmar translation of context
}

export interface Question {
  id: string;
  question: string;
  question_en?: string;
  question_mm?: string;
  options: string[];
  options_en?: string[];
  options_mm?: string[];
  correctIndex: number;
  explanation: string; // Now primarily Japanese Plain or fallback
  explanation_html?: string; // Japanese with Ruby
  explanation_jp?: string; // Japanese Plain
  explanation_en?: string; // English Translation
  explanation_mm?: string; // Myanmar Translation
}

export interface DialogueLine {
  speaker: string; // "A", "B", or "Narrator"
  japanese: string;
  japanese_html: string; // Contains <ruby> tags
  english: string;
  myanmar: string;
}

export interface GrammarPoint {
  pattern: string;
  explanation: string;
  explanation_mm?: string;
  example: string;
  example_html?: string; // Example with ruby tags
  example_en?: string;
  example_mm?: string;
}

export interface UsefulPhrase {
  phrase: string;
  meaning: string;
  meaning_mm?: string;
  context: string;
  context_html?: string; // Example with ruby tags
  context_en?: string;
  context_mm?: string;
}

export type DifficultyLevel = 'N5' | 'N4' | 'N3' | 'N2' | 'N1' | 'BJT' | 'Native' | 'Anime' | 'Natural';

export interface ListeningScenario {
  id?: string; // Optional ID for persistence
  title: string; // Default EN
  title_en?: string;
  title_jp?: string;
  title_mm?: string;
  topic: string;
  difficulty: DifficultyLevel;
  summary: string; // Default EN
  summary_en?: string;
  summary_jp?: string;
  summary_mm?: string;
  dialogue: DialogueLine[];
  vocabulary: VocabularyItem[];
  questions: Question[];
  grammar?: GrammarPoint[];
  useful_phrases?: UsefulPhrase[];
}

export interface SavedSession {
  id: string;
  topicId: TopicId;
  scenario: ListeningScenario;
  audioData: string; // Base64
  createdAt: number;
  lineAudioCache?: Record<number, string>; // Index -> Base64
}

export type UILanguage = 'en' | 'jp' | 'mm';

export type AppTheme = 
  | 'sakura' 
  | 'fuji' 
  | 'jinjya' 
  | 'beach' 
  | 'sky' 
  | 'forest' 
  | 'magic' 
  | 'night' 
  | 'anime' 
  | 'demon_slayer' 
  | 'love' 
  | 'rain'
  | 'three_d'
  | 'fire'
  | 'hanabi'
  | 'winter'
  | 'one_piece'
  | 'galaxy';

export type TopicId = 
  | 'company_interview'
  | 'long_speech_news'
  | 'long_speech_presentation'
  | 'long_speech_job_intro'
  | 'long_speech_ceremony'
  | 'business' 
  | 'news' 
  | 'culture' 
  | 'casual' 
  | 'keigo' 
  | 'debate'
  | 'tech'
  | 'travel'
  | 'medical'
  | 'education'
  | 'environment'
  | 'legal'
  | 'history'
  | 'sports'
  | 'cooking'
  | 'gossip'
  | 'politics'
  | 'economy'
  | 'social_issues'
  | 'romance'
  | 'family'
  | 'personal_problems'
  | 'scolding'
  | 'custom'
  | 'others';

export interface TopicDef {
  id: TopicId;
  label: string; // Default EN
  label_jp: string;
  label_mm: string;
  description: string; // Default EN
  description_jp: string;
  description_mm: string;
  icon: string;
  color: string;
  category: 'Dialogue' | 'Long Speech';
}