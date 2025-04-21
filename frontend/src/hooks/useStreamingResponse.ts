import { useState, useCallback } from 'react';
import type { ContinueSessionStreamResponse } from '../types';

interface UseStreamingResponseOptions {
  onStreamStart?: (initialAssistantMessageId: string) => void;
  onStreamChunk?: (assistantMessageId: string, chunk: string) => void;
  onStreamEnd?: (
    assistantMessageId: string,
    fullResponse: ContinueSessionStreamResponse
  ) => void;
  onError?: (assistantMessageId: string | null, error: Error) => void;
}

/**
 * Hook to handle fetching and processing a streaming response where only the value
 * of the "response" key should be streamed chunk by chunk to the UI.
 */
export const useStreamingResponse = ({ 
  onStreamStart, 
  onStreamChunk, 
  onStreamEnd, 
  onError 
}: UseStreamingResponseOptions) => {
  const [isLoading, setIsLoading] = useState(false);

  const processStream = useCallback(async (response: Response, assistantMessageId: string) => {
    if (!response.body) {
      onError?.(assistantMessageId, new Error('Response body is missing'));
      return;
    }

    setIsLoading(true);
    onStreamStart?.(assistantMessageId);

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let fullStreamContent = '';
    let isInsideResponseValue = false;
    let responseValueStartIndex = -1; // Index where the actual value starts
    let responseValueSentSoFar = ''; // Track what we've sent via onStreamChunk
    let braceLevel = 0;
    let inString = false;
    let escaped = false;

    try {
      parseLoop: while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (isInsideResponseValue) {
             // console.error("Stream ended unexpectedly while processing response value.");
             throw new Error('Stream ended unexpectedly while parsing response value.');
          }
          if (fullStreamContent.trim()) {
            try {
              // Final validation parse
              const parsedJson = JSON.parse(fullStreamContent) as ContinueSessionStreamResponse;
              // Ensure the final state matches (onStreamEnd callback in MessageInput handles UI update)
              if (parsedJson.response !== responseValueSentSoFar) {
                  // console.warn('Final response value differs from streamed chunks.');

              }
              // Call onStreamEnd even if brace counting was off, as stream is done.
              onStreamEnd?.(assistantMessageId, parsedJson);
              break parseLoop;
            } catch (e) {
              // console.error("Failed to parse JSON at end of stream:", e);
              throw new Error('Stream ended with incomplete or invalid JSON object.');
            }
          } else {
              throw new Error('Stream ended with no content.');
          }
        }

        const chunk = decoder.decode(value, { stream: true });
        fullStreamContent += chunk;

        // --- Logic to find and stream response value --- 
        if (!isInsideResponseValue) {
            const keyIndex = fullStreamContent.indexOf('"response": "', responseValueStartIndex > -1 ? responseValueStartIndex : 0);
            if (keyIndex !== -1) {
                isInsideResponseValue = true;
                responseValueStartIndex = keyIndex + '"response": "'.length;
                 // Reset sent buffer when we find a *new* start key (shouldn't normally happen mid-stream)
                 // responseValueSentSoFar = ''; 
            }
        }

        if (isInsideResponseValue) {
            let searchStart = responseValueStartIndex; // Start searching from beginning of value
            let foundEndQuote = false;
            let currentResponseValue = '';

            while (searchStart < fullStreamContent.length) {
                 const char = fullStreamContent[searchStart];
                 if (char === '"' ) {
                     let backslashCount = 0;
                     let k = searchStart - 1;
                     while (k >= responseValueStartIndex && fullStreamContent[k] === '\\') {
                         backslashCount++;
                         k--;
                     }
                     if (backslashCount % 2 === 0) { // Not escaped
                         // Found the end quote for the response value
                         currentResponseValue = fullStreamContent.substring(responseValueStartIndex, searchStart);
                         foundEndQuote = true;
                         break; // Stop searching within this value
                     }
                 }
                 searchStart++;
            }

            // If end quote not yet found, the current value is the substring so far
            if (!foundEndQuote) {
                currentResponseValue = fullStreamContent.substring(responseValueStartIndex);
            }

            // Send only the *new* part of the response value
            if (currentResponseValue.length > responseValueSentSoFar.length) {
                 const newChunk = currentResponseValue.substring(responseValueSentSoFar.length);
                 onStreamChunk?.(assistantMessageId, newChunk);
                 responseValueSentSoFar = currentResponseValue; // Update tracked sent content
            }

            // If we found the end quote, reset state for next potential key
            if (foundEndQuote) {
                isInsideResponseValue = false;
                responseValueStartIndex = searchStart + 1; // Start looking for keys *after* this value
            }
        }
        // --- End response value streaming logic ---

        // --- JSON Completion Check --- 
        // (Still imperfect, relies on stream ending or full parse success)
        try {
            braceLevel = 0;
            inString = false;
            escaped = false;
            for (let i = 0; i < fullStreamContent.length; i++) {
                const char = fullStreamContent[i];
                if (char === '"' && !escaped) {
                    inString = !inString;
                }
                if (!inString) {
                    if (char === '{') braceLevel++;
                    if (char === '}') braceLevel--;
                }
                escaped = char === '\\' && !escaped;
            }

            if (braceLevel === 0 && !inString && fullStreamContent.includes('{') && fullStreamContent.includes('}')) {
                // Attempt to parse if braces seem balanced and we are not in a string
                const parsedJson = JSON.parse(fullStreamContent) as ContinueSessionStreamResponse;
                if (parsedJson.response !== responseValueSentSoFar) {
                    // console.warn('Streamed response value differs from final JSON on completion check.');

                }
                onStreamEnd?.(assistantMessageId, parsedJson);
                break parseLoop; // Exit outer loop
            }
        } catch (e) {
             if (fullStreamContent.length > 50000) {
                 throw new Error('Stream exceeded max length without valid JSON.');
             }
             // Ignore parse errors until braces balance or stream ends
        }
        // --- End JSON Completion Check --- 

      } // End parseLoop
    } catch (error) {
      // console.error('Error processing stream:', error);
      onError?.(assistantMessageId, error instanceof Error ? error : new Error('Unknown streaming error'));
    } finally {
      setIsLoading(false);
    }
  }, [onStreamStart, onStreamChunk, onStreamEnd, onError]);

  return {
    processStream,
    isLoading,
  };
}; 