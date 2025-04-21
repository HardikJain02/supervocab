import { useState, useRef, useEffect, useCallback } from 'react';
import type { Exercise, Submission } from '../components/Exercise/DragDropExercise';
import { applyHint } from '../utils/exercise';

/**
 * useDragDropExercise encapsulates the business logic for the drag-and-drop exercise.
 */
export function useDragDropExercise(exercises: Exercise[], onComplete: (score: number, submissions: Submission[]) => void) {
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
  const onDragEnd = (result: any) => {
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
    const { newSlots, newBank, hintApplied } = applyHint(
      userSentenceSlots,
      remainingWords,
      currentExercise.correctSentence
    );
    if (hintApplied) {
      setUserSentenceSlots(newSlots);
      setRemainingWords(newBank);
      setHintUsedThisTurn(true);
    } else {
      // eslint-disable-next-line no-console
      console.warn('Hint requested, but could not find the correct word to place.');
    }
  };

  return {
    currentExerciseIndex,
    setCurrentExerciseIndex,
    userSentenceSlots,
    setUserSentenceSlots,
    remainingWords,
    setRemainingWords,
    timeLeft,
    setTimeLeft,
    isCorrect,
    setIsCorrect,
    showResult,
    setShowResult,
    score,
    setScore,
    completed,
    setCompleted,
    userSubmissions,
    setUserSubmissions,
    timeRanOut,
    setTimeRanOut,
    hintUsedThisTurn,
    setHintUsedThisTurn,
    currentExercise,
    handleSubmit,
    onDragEnd,
    handleHint,
    exercises,
    onComplete,
  };
} 