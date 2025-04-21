import React from 'react';
import { DragDropContext } from 'react-beautiful-dnd';
import Timer from './Timer';
import WordBank from './WordBank';
import SentenceSlots from './SentenceSlots';
import ResultSummary from './ResultSummary';
import { useDragDropExercise } from '../../hooks/useDragDropExercise';

// Types for exercise data
export interface Exercise {
  level: string;
  correctSentence: string;
  scrambledSentence: string;
  timeLimit: number;
}

export interface Submission {
  level: string;
  correct: string;
  user: string;
  isCorrect: boolean;
  hintUsed: boolean;
}

interface DragDropExerciseProps {
  exercises: Exercise[];
  onComplete: (score: number, submissions: Submission[]) => void;
}

/**
 * DragDropExercise renders a drag-and-drop sentence unscrambling exercise.
 */
const DragDropExercise: React.FC<DragDropExerciseProps> = ({ exercises, onComplete }) => {
  const {
    currentExerciseIndex,
    userSentenceSlots,
    remainingWords,
    timeLeft,
    isCorrect,
    showResult,
    score,
    completed,
    userSubmissions,
    hintUsedThisTurn,
    currentExercise,
    handleSubmit,
    onDragEnd,
    handleHint,
  } = useDragDropExercise(exercises, onComplete);

  if (completed) {
    return (
      <ResultSummary completed={completed} score={score} exercises={exercises} userSubmissions={userSubmissions} />
    );
  }

  if (!currentExercise) return null;

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{currentExercise.level} Level</h3>
          <div className="flex items-center">
            <div className="font-medium text-indigo-600 mr-4">
              Sentence {currentExerciseIndex + 1}/{exercises.length}
            </div>
            <Timer timeLeft={timeLeft} timeLimit={currentExercise.timeLimit} />
          </div>
        </div>
        <div className="flex justify-center mb-4 space-x-2">
          {exercises.map((_, index) => {
            const submission = userSubmissions[index];
            let status: 'upcoming' | 'correct' | 'incorrect' | 'current' = 'upcoming';
            if (currentExerciseIndex > index) {
              status = submission?.isCorrect ? 'correct' : 'incorrect';
            } else if (currentExerciseIndex === index) {
              status = 'current';
            }
            return (
              <div key={index} className={`w-8 h-8 flex items-center justify-center rounded-full border-2 ${status === 'current' ? 'border-indigo-600 bg-indigo-100 text-indigo-600 font-bold' : status === 'correct' ? 'border-green-500 bg-green-100 text-green-600' : status === 'incorrect' ? 'border-red-500 bg-red-100 text-red-600' : 'border-gray-300 bg-gray-50 text-gray-400'}`}>{index + 1}</div>
            );
          })}
        </div>
        <SentenceSlots userSentenceSlots={userSentenceSlots} />
        <WordBank remainingWords={remainingWords} />
        <div className="flex space-x-2 mt-4">
          {!showResult && (
            <button onClick={handleHint} className={`w-1/2 py-2 px-4 border border-indigo-600 text-indigo-600 rounded-lg hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${hintUsedThisTurn ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={hintUsedThisTurn || showResult || completed} title={hintUsedThisTurn ? 'Hint already used for this question' : 'Get a hint'}>Hint</button>
          )}
          {!showResult && (
            <button onClick={() => handleSubmit()} className={`w-1/2 py-2 px-4 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors ${userSentenceSlots.every(slot => slot === null) ? 'opacity-50 cursor-not-allowed' : ''}`} disabled={userSentenceSlots.every(slot => slot === null) || showResult || completed}>Submit</button>
          )}
        </div>
        {showResult && (
          <div className={`p-4 rounded-md ${isCorrect ? 'bg-green-100' : 'bg-red-100'} mb-4`}>
            <p className="font-bold mb-2">{isCorrect ? '✓ Correct!' : '✗ Incorrect'}</p>
            <p className="text-sm mb-1">Correct sentence:</p>
            <p className="font-medium p-2 bg-white rounded">{currentExercise.correctSentence}</p>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export { DragDropExercise };

 