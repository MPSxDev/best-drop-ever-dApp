import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden bg-black">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-950 to-gray-900 animate-gradient" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-gray-800/15 to-gray-700/15 rounded-full blur-3xl animate-float" />
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-gray-900/15 to-gray-800/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-gray-700/15 to-gray-900/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      <div className="absolute bottom-1/4 left-3/4 w-72 h-72 bg-gradient-to-r from-gray-800/10 to-gray-900/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '6s' }} />
      
      {/* Additional floating shapes */}
      <div className="absolute top-16 right-16 w-48 h-48 bg-gradient-to-r from-gray-900/10 to-gray-800/10 rounded-full blur-2xl animate-drift" />
      <div className="absolute bottom-20 left-20 w-56 h-56 bg-gradient-to-r from-gray-800/10 to-black/10 rounded-full blur-2xl animate-drift" style={{ animationDelay: '8s' }} />
      
      {/* Glowing orbs */}
      <div className="absolute top-32 right-40 w-4 h-4 bg-gray-600/40 rounded-full animate-pulse-glow" />
      <div className="absolute bottom-40 left-32 w-6 h-6 bg-gray-700/40 rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-gray-500/40 rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 left-2/3 w-5 h-5 bg-gray-600/40 rounded-full animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
      <div className="absolute top-1/2 right-1/4 w-2 h-2 bg-gray-400/50 rounded-full animate-pulse-glow" style={{ animationDelay: '3s' }} />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px'
        }} />
      </div>
      
      {/* Moving gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-gray-950/5 to-transparent animate-drift opacity-50" />
    </div>
  );
}
