'use client';

import { ReactNode } from 'react';

interface ControlsProps {
  onPower: () => void;
  onChannelUp: () => void;
  onChannelDown: () => void;
  onVolumeUp: () => void;
  onVolumeDown: () => void;
  isTurnedOn: boolean;
  volume: number;
  children?: ReactNode;
}

export function Controls({
  onPower,
  onChannelUp,
  onChannelDown,
  onVolumeUp,
  onVolumeDown,
  isTurnedOn,
  volume,
  children,
}: ControlsProps) {
  const buttonBaseClass = 'w-16 h-16 rounded-full font-bold text-white transition-all duration-150 active:scale-95';
  const buttonColorClass = isTurnedOn ? 'bg-red-600 hover:bg-red-700 active:bg-red-800' : 'bg-gray-600 hover:bg-gray-700';

  return (
    <div className="flex gap-8">
      <div className="flex flex-col gap-6">
        <button
          onClick={onPower}
          className={`${buttonBaseClass} ${buttonColorClass} text-sm shadow-lg`}
          title="Power (Space)"
        >
          PWR
        </button>

        <div className="flex gap-4">
          <button
            onClick={onChannelDown}
            disabled={!isTurnedOn}
            className={`${buttonBaseClass} ${isTurnedOn ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' : 'bg-gray-600 hover:bg-gray-700'} text-sm shadow-lg`}
            title="Channel Down (Arrow Up)"
          >
            CH-
          </button>
          <button
            onClick={onChannelUp}
            disabled={!isTurnedOn}
            className={`${buttonBaseClass} ${isTurnedOn ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800' : 'bg-gray-600 hover:bg-gray-700'} text-sm shadow-lg`}
            title="Channel Up (Arrow Down)"
          >
            CH+
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-4 items-center">
        <button
          onClick={onVolumeUp}
          disabled={!isTurnedOn}
          className={`${buttonBaseClass} ${isTurnedOn ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' : 'bg-gray-600 hover:bg-gray-700'} text-sm shadow-lg`}
          title="Volume Up (Arrow Right)"
        >
          VOL+
        </button>
        <div className="flex items-center gap-2">
          <span className="text-gray-700 font-bold">VOL</span>
          <div className="w-32 h-2 bg-gray-300 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-200"
              style={{ width: `${isTurnedOn ? volume : 0}%` }}
            />
          </div>
          <span className="text-gray-700 font-bold text-sm w-8">{isTurnedOn ? volume : '0'}</span>
        </div>
        <button
          onClick={onVolumeDown}
          disabled={!isTurnedOn}
          className={`${buttonBaseClass} ${isTurnedOn ? 'bg-green-600 hover:bg-green-700 active:bg-green-800' : 'bg-gray-600 hover:bg-gray-700'} text-sm shadow-lg`}
          title="Volume Down (Arrow Left)"
        >
          VOL-
        </button>
      </div>

      <div className="flex flex-col justify-center items-center">
        <div className="text-center">
          <p className="text-gray-800 font-bold text-xl tracking-wide">RETRO</p>
          <p className="text-gray-600 font-bold text-sm">TV</p>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>2024</p>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
