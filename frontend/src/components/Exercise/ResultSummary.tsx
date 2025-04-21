import React from 'react';
import type { Submission, Exercise } from './DragDropExercise';

interface ResultSummaryProps {
  completed: boolean;
  score: number;
  exercises: Exercise[];
  userSubmissions: Submission[];
}

/**
 * ResultSummary displays the summary after all exercises are completed.
 */
const ResultSummary: React.FC<ResultSummaryProps> = ({ completed, score, exercises }) => {
  if (!completed) return null;
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-center mb-4">Exercise Completed!</h3>
      <p className="text-center text-lg mb-6">
        You got <span className="font-bold text-indigo-600">{score}/{exercises.length}</span> correct!
      </p>
      <div className="text-center">
        <p className="text-gray-600 mb-4">Waiting for feedback...</p>
        <div className="flex items-center justify-center space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
};

export default ResultSummary; 