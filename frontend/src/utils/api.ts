import type {
  StartSessionPayload,
  StartSessionResponse,
  ContinueSessionPayload,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE || '';

/**
 * Initiates a new chat session.
 * @param payload - User information for starting the session.
 * @returns The session ID and initial greeting.
 */
export const startSession = async (
  payload: StartSessionPayload
): Promise<StartSessionResponse> => {
  const response = await fetch(`${API_BASE_URL}/session/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    // Attempt to read error details from the response body
    let errorDetails = 'Failed to start session';
    try {
      const errorData = await response.json();
      errorDetails = errorData.detail || errorDetails; // Assuming backend sends error in 'detail' field
    } catch (e) {
      // Ignore if response body is not JSON or empty
    }
    throw new Error(`${errorDetails} (Status: ${response.status})`);
  }

  return response.json() as Promise<StartSessionResponse>;
};

/**
 * Sends a user message or exercise results to continue the session.
 * Note: This function initiates the request, but the response stream
 * needs to be handled separately (e.g., in useStreamingResponse hook).
 * @param payload - Session ID and user message/results.
 * @returns The raw Fetch Response object to allow stream processing.
 */
export const continueSessionRaw = async (
  payload: ContinueSessionPayload
): Promise<Response> => {
  const response = await fetch(`${API_BASE_URL}/session/continue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let errorDetails = 'Failed to continue session';
    try {
      const errorData = await response.json();
      errorDetails = errorData.detail || errorDetails;
    } catch (e) {
      // Ignore
    }
    throw new Error(`${errorDetails} (Status: ${response.status})`);
  }

  // Return the raw response for stream handling
  return response;
}; 