import React, { useRef, useEffect, memo } from 'react';
import { Virtuoso, VirtuosoHandle } from 'react-virtuoso';
import { useMessages } from '../../context/MessagesContext';
import MessageItem from './MessageItem';

/**
 * ChatWindow component displays a virtualized list of chat messages.
 * It scrolls the latest user message to the top, and keeps the latest assistant message visible during streaming.
 */
const ChatWindow: React.FC = () => {
  const { messages } = useMessages();
  // Explicitly type the ref to allow null initial value and VirtuosoHandle when attached
  const virtuosoRef = useRef<VirtuosoHandle | null>(null);

  // Find the index of the latest user message
  const latestUserMessageIndex = messages.reduce((latestIndex, msg, index) => {
    if (msg.role === 'user') {
      return index;
    }
    return latestIndex;
  }, -1);

  // Scroll to the latest user message
  useEffect(() => {
    if (latestUserMessageIndex !== -1) {
      // Use setTimeout to ensure DOM updates are complete before scrolling
      setTimeout(() => {
        virtuosoRef.current?.scrollToIndex({
          index: latestUserMessageIndex,
          align: 'start', // Aligns the user message to the top
          behavior: 'auto', // Use 'auto' for instant jump to user message
        });

        // Removed the conflicting scroll logic for the assistant message
        // to prevent the "anxious" scrollbar behavior.
        /*
        const assistantMessageIndex = latestUserMessageIndex + 1;
        if (assistantMessageIndex < messages.length && messages[assistantMessageIndex]?.role === 'assistant') {
          virtuosoRef.current?.scrollToIndex({
            index: assistantMessageIndex,
            align: 'end',
            behavior: 'smooth',
          });
        }
        */
      }, 0); // Timeout with 0ms delay defers execution until after the current render cycle
    }
  }, [messages, latestUserMessageIndex]); // Rerun effect when messages or the target index changes

  return (
    <Virtuoso
      ref={virtuosoRef}
      data={messages}
      itemContent={(index, message) => (
        <MessageItem key={message.id} message={message} />
      )}
      // Ensure the Virtuoso component has a defined height to work correctly
      // The parent div provides flex sizing, but Virtuoso needs an explicit height.
      // Using vh unit might require adjustments based on surrounding layout.
      // Consider using flex-grow and min-height: 0 on the parent if issues arise.
      style={{ height: '100%' }} // Changed from 60vh to 100% to fill parent container
    />
  );
};

export default memo(ChatWindow);