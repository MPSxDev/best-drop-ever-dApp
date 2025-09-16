import AnimatedBackground from '@/components/AnimatedBackground';

export default function HomePage() {
  return (
    <div className="min-h-screen relative overflow-hidden">
      <AnimatedBackground />
      
      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen">
        <div className="text-center space-y-12 px-4 max-w-5xl mx-auto">
          {/* Hero section */}
          <div className="space-y-8">
            <div className="space-y-6">
              <div className="flex justify-center">
                <img 
                  src="/best_drops_ever_logo.png" 
                  alt="BestDropEver" 
                  className="h-32 md:h-48 w-auto object-contain"
                />
              </div>
              <div className="h-1 w-40 bg-gradient-to-r from-gray-600 to-gray-400 mx-auto rounded-full animate-pulse-glow" />
            </div>
            
            <p className="text-2xl md:text-3xl text-gray-300 font-light">
              Support Artists Through Blockchain
            </p>
            
            <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">
              Create unique tokens and support your favorite artists directly. Powered by Stellar blockchain technology for secure and transparent artist support.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <a
              href="/login"
              className="group relative px-10 py-5 bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-gray-500/25 backdrop-blur-sm border border-white/10"
            >
              <span className="relative z-10">Create Token</span>
              <div className="absolute inset-0 bg-gradient-to-r from-gray-700 to-gray-800 rounded-full blur opacity-50 group-hover:opacity-75 transition-opacity" />
            </a>
            
            <a
              href="/explore"
              className="group px-10 py-5 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-full transition-all duration-300 transform hover:scale-105 backdrop-blur-md border border-white/20 hover:border-white/30"
            >
              Buy Tokens
            </a>
          </div>

          {/* Features preview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-20">
            <div className="group p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <h3 className="text-xl font-semibold mb-4 text-white">Create Tokens</h3>
              <p className="text-gray-400 leading-relaxed">Launch unique tokens for your favorite artists using Stellar blockchain technology</p>
            </div>
            
            <div className="group p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <h3 className="text-xl font-semibold mb-4 text-white">Support Artists</h3>
              <p className="text-gray-400 leading-relaxed">Buy tokens to directly support your favorite artists and help them grow their careers</p>
            </div>
            
            <div className="group p-8 bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:transform hover:scale-105">
              <h3 className="text-xl font-semibold mb-4 text-white">Stellar Powered</h3>
              <p className="text-gray-400 leading-relaxed">Secure, fast, and transparent transactions powered by the Stellar blockchain network</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Clean floating element */}
      <div className="fixed bottom-8 right-8 z-20">
        <div className="group w-16 h-16 bg-gradient-to-r from-gray-700/80 to-gray-800/80 hover:from-gray-800/90 hover:to-gray-900/90 rounded-full shadow-2xl hover:shadow-gray-500/25 transition-all duration-300 transform hover:scale-110 backdrop-blur-sm border border-white/10 flex items-center justify-center">
          <div className="w-3 h-3 bg-white rounded-full animate-pulse-glow"></div>
        </div>
      </div>
    </div>
  )
}
