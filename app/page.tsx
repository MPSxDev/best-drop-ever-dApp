import AnimatedBackground from '@/components/AnimatedBackground';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-8 px-4 max-w-4xl mx-auto">
          {/* Hero section */}
          <div className="space-y-6">
            <div className="space-y-4">
              <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient leading-tight">
                BestDropEver
              </h1>
              <div className="h-1 w-32 bg-gradient-to-r from-purple-500 to-pink-500 mx-auto rounded-full animate-pulse-glow" />
            </div>
            
            <p className="text-xl md:text-2xl text-muted-foreground/80 font-light">
              Where Music Meets Community
            </p>
            
            <p className="text-lg text-muted-foreground/60 max-w-2xl mx-auto leading-relaxed">
              Discover, share, and connect through the power of music. Join the ultimate social platform for music lovers.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href="/login"
              className="group relative px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/25 backdrop-blur-sm border border-white/10"
            >
              <span className="relative z-10">Get Started</span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity" />
            </a>
            
            <a
              href="/explore"
              className="group px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-md border border-white/20 hover:border-white/30"
            >
              Explore Music
            </a>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="group p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-4 group-hover:animate-bounce">🎵</div>
              <h3 className="text-lg font-semibold mb-2 text-white">Discover</h3>
              <p className="text-sm text-muted-foreground/70">Find new music and artists tailored to your taste</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-4 group-hover:animate-bounce" style={{ animationDelay: '0.1s' }}>🎤</div>
              <h3 className="text-lg font-semibold mb-2 text-white">Share</h3>
              <p className="text-sm text-muted-foreground/70">Upload and share your musical creations</p>
            </div>
            
            <div className="group p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <div className="text-4xl mb-4 group-hover:animate-bounce" style={{ animationDelay: '0.2s' }}>🎧</div>
              <h3 className="text-lg font-semibold mb-2 text-white">Connect</h3>
              <p className="text-sm text-muted-foreground/70">Build connections with fellow music enthusiasts</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Floating CTA */}
      <div className="fixed bottom-8 right-8 z-20">
        <button className="group p-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-full shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/10">
          <span className="text-2xl group-hover:animate-pulse">🎶</span>
        </button>
      </div>
    </div>
  )
}
