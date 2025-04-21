import React, { useState, FormEvent, memo } from 'react';
import useChatStream from '../../hooks/useChatStream';
import clsx from 'clsx'; // Import clsx for conditional classes

// Simple SVG Send Icon
const SendIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

/**
 * User input component for sending messages, styled similarly to modern chat apps.
 */
const MessageInput: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const { sendMessage, isProcessing } = useChatStream();
  const canSubmit = inputValue.trim().length > 0 && !isProcessing;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const messageText = inputValue.trim();
    
    if (canSubmit && sendMessage(messageText)) {
      setInputValue(''); // Clear input field on successful send
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-3">
      {/* Input field styling - Added lighter placeholder */}
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder="Ask anything..."
        className="flex-1 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:focus:ring-indigo-600 dark:focus:border-indigo-600 dark:text-white disabled:opacity-70 placeholder:text-gray-400 dark:placeholder:text-gray-500"
        aria-label="Message input"
      />
      {/* Send button styling - More subtle background change */}
      <button
        type="submit"
        disabled={!canSubmit}
        className={clsx(
          'p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-gray-800',
          'transition-colors duration-150 ease-in-out',
          canSubmit 
            ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-500 focus:ring-gray-400' // Subtle active state
            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed' // Disabled state blends more
        )}
        aria-label="Send message"
      >
        <SendIcon />
      </button>
    </form>
  );
};

export default memo(MessageInput); 