/**
 * Represents a user message or an assistant message in the chat.
 */
export interface ChatMessage {
  id: string; // Unique identifier for the message
  role: 'user' | 'assistant' | 'system' | 'checkpoint';
  content: string;
  timestamp: number;
  isLoading?: boolean; // Optional flag for streaming/pending assistant messages
  exercises?: ExerciseData | null;
  currentWord?: string | null;
  currentWordProgress?: string | null;

}

/**
 * Information about the user.
 */
export interface UserInfo {
  name: string;
  sourceLanguage: string;
  targetLanguage: string;
}

/**
 * Expected payload for the POST /session/start request.
 */
export interface StartSessionPayload {
  user_name: string;
  source_language: string;
  target_language: string;
}

/**
 * Expected response from the POST /session/start request.
 */
export interface StartSessionResponse {
  session_id: string;
  greeting: string;
}

/**
 * Expected payload for the POST /session/continue request.
 */
export interface ContinueSessionPayload {
  session_id: string;
  user_message: string;
}

/**
 * Represents the structure of the exercise data received from the backend.
 */
export interface ExerciseData {
  basic: {
    unscrambled: string;
    scrambled: string;
  };
  intermediate: {
    unscrambled: string;
    scrambled: string;
  };
  advanced: {
    unscrambled: string;
    scrambled: string;
  };
  count: number;
}

/**
 * Expected JSON structure within the streaming response from /session/continue.
 */
export interface ContinueSessionStreamResponse {
  response: string;         // The textual response to display
  currentCategory: string | null;
  currentWord: string | null;
  currentWordProgress: string | null; 
  exercises: ExerciseData | null;
} 