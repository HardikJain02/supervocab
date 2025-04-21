import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface Word {
  id: string;
  text: string;
}

interface WordBankProps {
  remainingWords: Word[];
}

/**
 * WordBank displays the available draggable words for the exercise.
 */
const WordBank: React.FC<WordBankProps> = ({ remainingWords }) => (
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
);

export default WordBank; 