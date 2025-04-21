import React from 'react';

interface TimerProps {
  timeLeft: number;
  timeLimit: number;
}

/**
 * Timer displays the countdown and progress bar for the exercise.
 */
const Timer: React.FC<TimerProps> = ({ timeLeft, timeLimit }) => (
  <div className="flex flex-col items-end w-24">
    <div className={`font-mono text-lg ${timeLeft <= 10 ? 'text-red-500 font-semibold' : timeLeft <= (timeLimit * 0.5) ? 'text-yellow-500' : 'text-gray-700'}`}>{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</div>
    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
      <div className={`h-1.5 rounded-full transition-all duration-500 ease-linear ${timeLeft <= 10 ? 'bg-red-500' : timeLeft <= (timeLimit * 0.5) ? 'bg-yellow-500' : 'bg-green-500'}`} style={{ width: `${Math.max(0, (timeLeft / timeLimit) * 100)}%` }}></div>
    </div>
  </div>
);

export default Timer; 