import { useCallback, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { continueSessionRaw } from '../utils/api';
import type { ContinueSessionPayload, ContinueSessionStreamResponse } from '../types';
import { useStreamingResponse } from './useStreamingResponse';
import { useSession } from '../context/SessionContext';
import { useMessages } from '../context/MessagesContext';

/**
 * Custom hook that manages chat message streaming logic 
 * Separates business logic from UI components
 */
export const useChatStream = () => {
  const { sessionId } = useSession();
  const {
    addMessage,
    startAssistantMessage,
    updateAssistantMessage,
  } = useMessages();

  // Track streaming message ID to avoid stale state in callbacks
  const streamingMessageIdRef = useRef<string | null>(null);

  // Setup streaming response handler
  const {
    processStream,
    isLoading: isStreaming,
  } = useStreamingResponse({
    onStreamStart: useCallback((id: string) => {
      // No console log needed
    }, []),
    
    onStreamChunk: useCallback((id: string, chunk: string) => {
      updateAssistantMessage(id, chunk, false);
    }, [updateAssistantMessage]),
    
    onStreamEnd: useCallback((id: string, fullResponse: ContinueSessionStreamResponse) => {
      console.log('Stream end fullResponse:', fullResponse);
      updateAssistantMessage(
        id,
        fullResponse.response,
        true,
        fullResponse.exercises ?? null,
        fullResponse.currentWord ?? null,
        fullResponse.currentWordProgress ?? null
      );
      streamingMessageIdRef.current = null;
      
      // Handle optional exercise data if available
      if (fullResponse.exercises) {
        
        console.log('Exercises received:', fullResponse.exercises);
      }
    }, [updateAssistantMessage]),
    
    onError: useCallback((id: string | null, error: Error) => {
      if (id) {
        updateAssistantMessage(id, `Error: ${error.message}`, true);
      }
      streamingMessageIdRef.current = null;
      
      console.error('Chat streaming error:', error.message);
    }, [updateAssistantMessage]),
  });

  // Mutation to send messages and handle streaming
  const mutation = useMutation({
    mutationFn: async (payload: ContinueSessionPayload) => {
      if (!sessionId) {
        // Should not happen if UI prevents sending without session
        throw new Error("Cannot send message without a session ID.");
      }
      const response = await continueSessionRaw(payload);
      if (streamingMessageIdRef.current) {
        await processStream(response, streamingMessageIdRef.current);
      } else {

        throw new Error("Missing streaming message ID"); 
      }
    },
    
    onMutate: () => {
      const assistantMsgId = startAssistantMessage('');
      streamingMessageIdRef.current = assistantMsgId;
    },
    
    onError: (error) => {
      if (streamingMessageIdRef.current) {
        updateAssistantMessage(
          streamingMessageIdRef.current, 
          `Failed to send message: ${error.message}`, 
          true
        );
        streamingMessageIdRef.current = null;
      }

      console.error('Message sending error:', error.message);
    },
  });

  // Send user message and initiate assistant response
  const sendMessage = useCallback((messageText: string) => {
    const trimmedMessage = messageText.trim();
    // Check sessionId exists before sending
    if (!trimmedMessage || !sessionId || mutation.isPending || isStreaming) {
      return false;
    }

    // Add user message to UI
    addMessage({ role: 'user', content: trimmedMessage });

    // Send to API
    mutation.mutate({
      session_id: sessionId, // Use sessionId from useSession
      user_message: trimmedMessage,
    });
    
    return true;
  }, [sessionId, addMessage, mutation, isStreaming, startAssistantMessage, updateAssistantMessage]);

  // Send a message and stream assistant response, but do NOT add user message to chat
  const sendHiddenMessage = useCallback((messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || !sessionId || mutation.isPending || isStreaming) {
      return false;
    }
    // Only stream assistant response, do not add user message
    mutation.mutate({
      session_id: sessionId,
      user_message: trimmedMessage,
    });
    return true;
  }, [sessionId, mutation, isStreaming, startAssistantMessage, updateAssistantMessage]);

  return {
    sendMessage,
    sendHiddenMessage,
    isProcessing: mutation.isPending || isStreaming,
  };
};

export default useChatStream; 