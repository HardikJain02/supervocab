import React, { memo, useState, useCallback } from 'react';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import { DragDropExercise, Exercise, Submission } from '../Exercise/DragDropExercise';
import { useSession } from '../../context/SessionContext';
import { useMessages } from '../../context/MessagesContext';
import type { ExerciseData } from '../../types';
import useChatStream from '../../hooks/useChatStream';

/**
 * Main chat application container that combines the chat window and input
 */
const ChatApp: React.FC = () => {
  const { sessionId } = useSession();
  const { messages, clearLastAssistantExercises, addMessage } = useMessages();
  const [exerciseMode, setExerciseMode] = useState(false);
  const [exerciseData, setExerciseData] = useState<Exercise[] | null>(null);
  const { sendHiddenMessage } = useChatStream();

  // Helper to transform ExerciseData to Exercise[] for the widget
  const transformExerciseData = (exercises: ExerciseData): Exercise[] => [
    {
      level: 'Basic',
      correctSentence: exercises.basic.unscrambled,
      scrambledSentence: exercises.basic.scrambled,
      timeLimit: 20,
    },
    {
      level: 'Intermediate',
      correctSentence: exercises.intermediate.unscrambled,
      scrambledSentence: exercises.intermediate.scrambled,
      timeLimit: 40,
    },
    {
      level: 'Advanced',
      correctSentence: exercises.advanced.unscrambled,
      scrambledSentence: exercises.advanced.scrambled,
      timeLimit: 60,
    },
  ];

  // Listen for new assistant messages with exercises
  React.useEffect(() => {
    if (!messages.length) return;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg.role === 'assistant' && lastMsg.exercises && !exerciseMode) {
      setExerciseData(transformExerciseData(lastMsg.exercises));
      setExerciseMode(true);
    }
  }, [messages, exerciseMode]);

  // Handle exercise completion and get feedback from API
  const handleExerciseComplete = useCallback(
    async (score: number, submissions: Submission[]) => {
      setExerciseMode(false);
      setExerciseData(null);
      clearLastAssistantExercises();
      const attempts = submissions.map((sub, i) => {
        const userText = sub.user && sub.user.trim() ? sub.user : "I didn't attempt";
        return `${i + 1}: ${userText}${sub.hintUsed ? ' (used a hint)' : ''}`;
      }).join(', ');
      const user_message = `I scored ${score}/3. This is my attempt for the exercise: ${attempts}`;
      addMessage({ role: 'checkpoint', content: `Exercise completed: You scored ${score}/3` });
      // Use sendHiddenMessage to stream assistant response without showing user_message
      sendHiddenMessage(user_message);
    },
    [clearLastAssistantExercises, addMessage, sendHiddenMessage]
  );

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 shadow-lg rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
      {exerciseMode && exerciseData ? (
        <div className="flex-1 flex items-center justify-center">
          <DragDropExercise exercises={exerciseData} onComplete={handleExerciseComplete} />
        </div>
      ) : (
        <>
          <div className="flex-1 min-h-0 p-4"> 
            <ChatWindow />
          </div>
          <div className="border-t border-gray-100 dark:border-gray-700/50 p-4 bg-gray-50 dark:bg-gray-800">
            <MessageInput />
          </div>
        </>
      )}
    </div>
  );
};

export default memo(ChatApp); 