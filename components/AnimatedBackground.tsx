import React from 'react';

export default function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Main gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-blue-900/20 to-pink-900/20 animate-gradient" />
      
      {/* Animated circles */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-full blur-3xl animate-float" />
      <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }} />
      
      {/* Floating music notes */}
      <div className="absolute top-20 left-20 text-6xl text-purple-500/20 animate-drift">♪</div>
      <div className="absolute top-40 right-32 text-4xl text-blue-500/20 animate-drift" style={{ animationDelay: '3s' }}>♫</div>
      <div className="absolute bottom-32 left-40 text-5xl text-pink-500/20 animate-drift" style={{ animationDelay: '6s' }}>♬</div>
      <div className="absolute bottom-20 right-20 text-3xl text-cyan-500/20 animate-drift" style={{ animationDelay: '9s' }}>♩</div>
      <div className="absolute top-60 left-1/3 text-4xl text-purple-400/20 animate-drift" style={{ animationDelay: '12s' }}>♪</div>
      <div className="absolute bottom-60 right-1/3 text-5xl text-blue-400/20 animate-drift" style={{ animationDelay: '15s' }}>♫</div>
      
      {/* Music wave bars */}
      <div className="absolute bottom-10 left-10 flex space-x-1">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-purple-500/30 to-pink-500/30 animate-music-wave rounded-full"
            style={{
              height: `${20 + Math.random() * 40}px`,
              animationDelay: `${i * 0.1}s`
            }}
          />
        ))}
      </div>
      
      {/* Additional wave bars */}
      <div className="absolute bottom-10 right-10 flex space-x-1">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="w-2 bg-gradient-to-t from-blue-500/30 to-cyan-500/30 animate-music-wave rounded-full"
            style={{
              height: `${15 + Math.random() * 35}px`,
              animationDelay: `${i * 0.15}s`
            }}
          />
        ))}
      </div>
      
      {/* Glowing orbs */}
      <div className="absolute top-32 right-40 w-4 h-4 bg-purple-500/50 rounded-full animate-pulse-glow" />
      <div className="absolute bottom-40 left-32 w-6 h-6 bg-pink-500/50 rounded-full animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-2/3 right-1/3 w-3 h-3 bg-blue-500/50 rounded-full animate-pulse-glow" style={{ animationDelay: '2s' }} />
      <div className="absolute top-1/3 left-2/3 w-5 h-5 bg-cyan-500/50 rounded-full animate-pulse-glow" style={{ animationDelay: '0.5s' }} />
      
      {/* Subtle grid overlay */}
      <div className="absolute inset-0 opacity-[0.02]">
        <div className="h-full w-full" style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }} />
      </div>
    </div>
  );
}
