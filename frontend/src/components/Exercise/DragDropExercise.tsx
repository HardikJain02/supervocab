import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

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
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [userSentenceSlots, setUserSentenceSlots] = useState<(null | { id: string; text: string })[]>([]);
  const [remainingWords, setRemainingWords] = useState<{ id: string; text: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [userSubmissions, setUserSubmissions] = useState<Submission[]>([]);
  const [timeRanOut, setTimeRanOut] = useState(false);
  const [hintUsedThisTurn, setHintUsedThisTurn] = useState(false);

  const currentExercise = exercises[currentExerciseIndex];

  // Ref to hold the latest submissions to avoid stale closures
  const userSubmissionsRef = useRef(userSubmissions);
  useEffect(() => {
    userSubmissionsRef.current = userSubmissions;
  }, [userSubmissions]);

  // Initialize the exercise
  useEffect(() => {
    if (!currentExercise) return;
    // Always use the original casing from correctSentence for the word bank
    function shuffleArray(array: string[]) {
      return array
        .map(value => ({ value, sort: Math.random() }))
        .sort((a, b) => a.sort - b.sort)
        .map(({ value }) => value);
    }
    const correctWords = currentExercise.correctSentence.split(' ');
    const scrambledWords = shuffleArray(correctWords);
    setRemainingWords(scrambledWords.map((word, index) => ({ id: `word-${index}`, text: word })));
    const correctSentenceLength = correctWords.length;
    setUserSentenceSlots(Array(correctSentenceLength).fill(null));
    setTimeLeft(currentExercise.timeLimit);
    setIsCorrect(null);
    setShowResult(false);
    setTimeRanOut(false);
    setHintUsedThisTurn(false);
  }, [currentExerciseIndex, currentExercise]);

  // Timer effect
  useEffect(() => {
    if (!currentExercise || showResult || completed) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setTimeRanOut(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentExerciseIndex, showResult, completed, currentExercise]);

  // Handle submission logic
  const handleSubmit = useCallback((isAutoSubmit = false) => {
    const userAnswer = userSentenceSlots.filter(slot => slot !== null).map(w => w!.text).join(' ');
    const normalizedUserAnswer = userAnswer.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const normalizedCorrectAnswer = currentExercise.correctSentence.trim().toLowerCase().replace(/[.,!?;:]/g, '');
    const isAnswerCorrect = normalizedUserAnswer === normalizedCorrectAnswer;
    setIsCorrect(isAnswerCorrect);
    setShowResult(true);
    if (isAnswerCorrect) setScore(prevScore => prevScore + 1);
    const newSubmission: Submission = {
      level: currentExercise.level,
      correct: currentExercise.correctSentence,
      user: userAnswer,
      isCorrect: isAnswerCorrect,
      hintUsed: hintUsedThisTurn,
    };
    const latestSubmissions = userSubmissionsRef.current;
    const updatedSubmissions = [...latestSubmissions, newSubmission];
    setUserSubmissions(updatedSubmissions);
    setTimeout(() => {
      if (currentExerciseIndex < exercises.length - 1) {
        setCurrentExerciseIndex(prev => prev + 1);
      } else {
        setCompleted(true);
        const finalScore = updatedSubmissions.filter(sub => sub.isCorrect).length;
        onComplete(finalScore, updatedSubmissions);
      }
    }, 2000);
  }, [userSentenceSlots, currentExercise, currentExerciseIndex, exercises, onComplete, hintUsedThisTurn]);

  // Effect to trigger handleSubmit when time runs out
  useEffect(() => {
    if (timeRanOut) {
      handleSubmit(true);
      setTimeRanOut(false);
    }
  }, [timeRanOut, handleSubmit]);

  // Handle drag end
  const onDragEnd = (result: DropResult) => {
    const { source, destination } = result;
    if (!destination) return;
    const sourceId = source.droppableId;
    const destinationId = destination.droppableId;
    const sourceIndex = source.index;
    const destinationIndex = destination.index;
    if (sourceId === destinationId && sourceIndex === destinationIndex) return;
    const newRemainingWords = Array.from(remainingWords);
    const newUserSentenceSlots = Array.from(userSentenceSlots);
    if (sourceId === 'wordBank' && destinationId.startsWith('slot-')) {
      const slotIndex = parseInt(destinationId.split('-')[1], 10);
      const wordToMove = newRemainingWords.splice(sourceIndex, 1)[0];
      if (newUserSentenceSlots[slotIndex] !== null) {
        const wordToBank = newUserSentenceSlots[slotIndex];
        newRemainingWords.push(wordToBank!);
      }
      newUserSentenceSlots[slotIndex] = wordToMove;
      setRemainingWords(newRemainingWords);
      setUserSentenceSlots(newUserSentenceSlots);
    } else if (sourceId.startsWith('slot-') && destinationId === 'wordBank') {
      const slotIndex = parseInt(sourceId.split('-')[1], 10);
      const wordToMove = newUserSentenceSlots[slotIndex];
      if (wordToMove) {
        newUserSentenceSlots[slotIndex] = null;
        newRemainingWords.splice(destinationIndex, 0, wordToMove);
        setRemainingWords(newRemainingWords);
        setUserSentenceSlots(newUserSentenceSlots);
      }
    } else if (sourceId.startsWith('slot-') && destinationId.startsWith('slot-')) {
      const sourceSlotIndex = parseInt(sourceId.split('-')[1], 10);
      const destinationSlotIndex = parseInt(destinationId.split('-')[1], 10);
      const sourceWord = newUserSentenceSlots[sourceSlotIndex];
      const destinationWord = newUserSentenceSlots[destinationSlotIndex];
      newUserSentenceSlots[destinationSlotIndex] = sourceWord;
      newUserSentenceSlots[sourceSlotIndex] = destinationWord;
      setUserSentenceSlots(newUserSentenceSlots);
    } else if (sourceId === 'wordBank' && destinationId === 'wordBank') {
      const [movedWord] = newRemainingWords.splice(sourceIndex, 1);
      newRemainingWords.splice(destinationIndex, 0, movedWord);
      setRemainingWords(newRemainingWords);
    }
  };

  // Hint logic
  const handleHint = () => {
    if (hintUsedThisTurn || showResult || completed || !currentExercise) return;
    let hintApplied = false;
    let firstIncorrectSlotIndex = -1;
    for (let i = 0; i < currentExercise.correctSentence.split(' ').length; i++) {
      if (userSentenceSlots[i] === null || userSentenceSlots[i]?.text !== currentExercise.correctSentence.split(' ')[i]) {
        firstIncorrectSlotIndex = i;
        break;
      }
    }
    if (firstIncorrectSlotIndex === -1) return;
    const correctWordForSlot = currentExercise.correctSentence.split(' ')[firstIncorrectSlotIndex];
    let wordToPlace: { id: string; text: string } | null = null;
    let wordSource: 'bank' | 'slot' | null = null;
    let sourceIndex = -1;
    const wordInBankIndex = remainingWords.findIndex(w => w.text === correctWordForSlot);
    if (wordInBankIndex !== -1) {
      wordToPlace = remainingWords[wordInBankIndex];
      wordSource = 'bank';
      sourceIndex = wordInBankIndex;
    } else {
      const wordInSlotsIndex = userSentenceSlots.findIndex(w => w !== null && w.text === correctWordForSlot);
      if (wordInSlotsIndex !== -1 && wordInSlotsIndex !== firstIncorrectSlotIndex) {
        wordToPlace = userSentenceSlots[wordInSlotsIndex]!;
        wordSource = 'slot';
        sourceIndex = wordInSlotsIndex;
      }
    }
    if (wordToPlace) {
      const newSlots = [...userSentenceSlots];
      const newBank = [...remainingWords];
      const wordCurrentlyInTargetSlot = newSlots[firstIncorrectSlotIndex];
      newSlots[firstIncorrectSlotIndex] = wordToPlace;
      if (wordCurrentlyInTargetSlot !== null) {
        newBank.push(wordCurrentlyInTargetSlot);
      }
      if (wordSource === 'bank') {
        newBank.splice(sourceIndex, 1);
      } else if (wordSource === 'slot') {
        newSlots[sourceIndex] = null;
      }
      setUserSentenceSlots(newSlots);
      setRemainingWords(newBank);
      setHintUsedThisTurn(true);
      hintApplied = true;
    }
    if (!hintApplied) {
      // eslint-disable-next-line no-console
      console.warn('Hint requested, but could not find the correct word to place.');
    }
  };

  if (completed) {
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
            <div className="flex flex-col items-end w-24">
              <div className={`font-mono text-lg ${timeLeft <= 10 ? 'text-red-500 font-semibold' : timeLeft <= (currentExercise.timeLimit * 0.5) ? 'text-yellow-500' : 'text-gray-700'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
              <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                <div className={`h-1.5 rounded-full transition-all duration-500 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= (currentExercise.timeLimit * 0.5) ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.max(0, (timeLeft / currentExercise.timeLimit) * 100)}%` }}></div>
              </div>
            </div>
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
        <div className="mb-4 flex flex-wrap gap-2 items-center justify-center min-h-[4rem] border-2 border-dashed border-gray-300 p-4 rounded-md">
          {userSentenceSlots.map((word, index) => (
            <Droppable key={`slot-${index}`} droppableId={`slot-${index}`}>
              {(provided, snapshot) => (
                <div ref={provided.innerRef} {...provided.droppableProps} className={`border border-gray-400 rounded min-w-[80px] min-h-[40px] flex items-center justify-center p-1 ${snapshot.isDraggingOver ? 'bg-indigo-100 border-indigo-500 border-2' : 'bg-gray-50'} ${word ? 'border-solid' : 'border-dashed'}`}>
                  {word ? (
                    <Draggable key={word.id} draggableId={word.id} index={index}>
                      {(providedDrag, snapshotDrag) => (
                        <div ref={providedDrag.innerRef} {...providedDrag.draggableProps} {...providedDrag.dragHandleProps} className={`py-1 px-3 rounded cursor-pointer text-center ${snapshotDrag.isDragging ? 'bg-indigo-200 shadow-lg' : 'bg-indigo-100'}`}>{word.text}</div>
                      )}
                    </Draggable>
                  ) : (
                    <span className="text-gray-300 text-xs italic">Slot {index + 1}</span>
                  )}
                  {!word && provided.placeholder}
                </div>
              )}
            </Droppable>
          ))}
        </div>
        <Droppable droppableId="wordBank" direction="horizontal">
          {(provided, snapshot) => (
            <div ref={provided.innerRef} {...provided.droppableProps} className={`bg-gray-100 p-4 rounded-md mb-4 border-2 border-transparent ${snapshot.isDraggingOver ? 'bg-gray-200 border-indigo-400' : ''}`}>
              <p className="text-sm text-gray-500 mb-2">Available words:</p>
              <div className="flex flex-wrap gap-2">
                {remainingWords.map((word, index) => (
                  <Draggable key={word.id} draggableId={word.id} index={index}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className={`py-1 px-3 border border-gray-300 rounded shadow-sm cursor-pointer ${snapshot.isDragging ? 'bg-white shadow-lg scale-105' : 'bg-white hover:bg-gray-50'}`}>{word.text}</div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            </div>
          )}
        </Droppable>
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

 