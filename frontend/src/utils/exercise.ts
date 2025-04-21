// Utility functions for exercise business logic
import type { ExerciseData } from '../types';
import type { Exercise, Submission } from '../components/Exercise/DragDropExercise';

/**
 * Transforms ExerciseData from backend to Exercise[] for the widget.
 */
export function transformExerciseData(exercises: ExerciseData): Exercise[] {
  return [
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
}

/**
 * Applies a hint to the current sentence slots and word bank.
 * Returns updated slots, bank, and whether a hint was applied.
 */
export function applyHint(
  userSentenceSlots: (null | { id: string; text: string })[],
  remainingWords: { id: string; text: string }[],
  correctSentence: string
): {
  newSlots: (null | { id: string; text: string })[];
  newBank: { id: string; text: string }[];
  hintApplied: boolean;
} {
  let hintApplied = false;
  let firstIncorrectSlotIndex = -1;
  const correctWords = correctSentence.split(' ');
  for (let i = 0; i < correctWords.length; i++) {
    if (
      userSentenceSlots[i] === null ||
      userSentenceSlots[i]?.text !== correctWords[i]
    ) {
      firstIncorrectSlotIndex = i;
      break;
    }
  }
  if (firstIncorrectSlotIndex === -1) {
    return { newSlots: userSentenceSlots, newBank: remainingWords, hintApplied };
  }
  const correctWordForSlot = correctWords[firstIncorrectSlotIndex];
  let wordToPlace: { id: string; text: string } | null = null;
  let wordSource: 'bank' | 'slot' | null = null;
  let sourceIndex = -1;
  const wordInBankIndex = remainingWords.findIndex(w => w.text === correctWordForSlot);
  if (wordInBankIndex !== -1) {
    wordToPlace = remainingWords[wordInBankIndex];
    wordSource = 'bank';
    sourceIndex = wordInBankIndex;
  } else {
    const wordInSlotsIndex = userSentenceSlots.findIndex(
      w => w !== null && w.text === correctWordForSlot
    );
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
    hintApplied = true;
    return { newSlots, newBank, hintApplied };
  }
  return { newSlots: userSentenceSlots, newBank: remainingWords, hintApplied };
} 