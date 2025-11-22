import React from 'react';

interface VisualizerProps {
  isPlaying: boolean;
}

export const Visualizer: React.FC<VisualizerProps> = ({ isPlaying }) => {
  // Generate 5 bars
  const bars = Array.from({ length: 5 });

  return (
    <div className="flex items-center justify-center gap-1 h-12 w-20">
      {bars.map((_, index) => (
        <div
          key={index}
          className={`w-2 bg-indigo-500 rounded-full transition-all duration-200 ${
            isPlaying ? 'audio-bar' : 'h-2 opacity-30'
          }`}
          style={{
            animationDelay: `${index * 0.1}s`,
            animationDuration: '0.8s'
          }}
        />
      ))}
    </div>
  );
};