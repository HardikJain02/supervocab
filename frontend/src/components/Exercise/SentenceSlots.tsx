import React from 'react';
import { Droppable, Draggable } from 'react-beautiful-dnd';

interface Word {
  id: string;
  text: string;
}

interface SentenceSlotsProps {
  userSentenceSlots: (null | Word)[];
}

/**
 * SentenceSlots displays the droppable slots for sentence construction.
 */
const SentenceSlots: React.FC<SentenceSlotsProps> = ({ userSentenceSlots }) => (
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
);

export default SentenceSlots; 