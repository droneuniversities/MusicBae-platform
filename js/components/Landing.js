// ===== MODERN LANDING PAGE COMPONENT =====
function ModernLandingPage({ goTo }) {
  const { showToast } = useApp();
  
  const handleJoin = () => {
    goTo('register');
    showToast('Welcome to MusicBae! 🎵');
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg opacity-20"></div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-accent rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 gradient-primary rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 pt-20 pb-24 px-4 max-w-6xl mx-auto">
        {/* Hero Section */}
        <section className="text-center mb-20 animate-fadeIn">
          <div className="mb-8">
            <div className="w-24 h-24 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">🎵</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-space font-bold mb-6">
              <span className="gradient-primary bg-clip-text text-transparent">Music</span>
              <span className="text-white">Bae</span>
            </h1>
            <p className="text-xl md:text-2xl text-white/80 font-medium mb-8 max-w-3xl mx-auto">
              The revolutionary platform where artists share unreleased music and fans support them through direct tipping
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              className="btn btn-primary text-lg px-8 py-4"
              onClick={handleJoin}
            >
              Start Creating
            </button>
            <button
              className="btn btn-outline text-lg px-8 py-4"
              onClick={() => goTo('register-fan')}
            >
              Join as Fan
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: 'Artists', value: '500+', icon: '🎤' },
              { label: 'Songs', value: '2,000+', icon: '🎵' },
              { label: 'Tips Given', value: '$50K+', icon: '💰' },
              { label: 'Downloads', value: '10K+', icon: '⬇️' }
            ].map(stat => (
              <div key={stat.label} className="card text-center hover:scale-105 transition-all">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-20">
          <h2 className="text-4xl font-space font-bold text-center mb-12">Why Artists Choose MusicBae</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="card">
              <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">🎤</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Direct Fan Connection</h3>
              <p className="text-white/70 mb-4">Connect directly with your fans through unreleased music. No intermediaries, just pure artist-fan relationships.</p>
              <ul className="space-y-2 text-white/60">
                <li>• Upload up to 4 exclusive tracks</li>
                <li>• Real-time fan engagement</li>
                <li>• Direct messaging with supporters</li>
                <li>• Build your loyal fanbase</li>
              </ul>
            </div>
            <div className="card">
              <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center mb-6">
                <span className="text-2xl">💰</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Transparent Earnings</h3>
              <p className="text-white/70 mb-4">Keep 90% of all tips with transparent fees. No hidden costs, just fair compensation for your art.</p>
              <ul className="space-y-2 text-white/60">
                                  <li>• 90% artist, 10% platform fee</li>
                <li>• Instant tip notifications</li>
                <li>• Withdraw anytime ($20 minimum)</li>
                <li>• Multiple payment methods</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Featured Artists */}
        <section className="mb-20">
          <h2 className="text-4xl font-space font-bold text-center mb-12">Featured Artists</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            {mockDB.featuredArtists.map(artistId => {
              const artist = mockDB.users.find(u => u.id === artistId);
              return (
                <div key={artistId} className="card text-center cursor-pointer hover:scale-105 transition-all" onClick={() => goTo('artist-profile', slugify(artist.name))}>
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto">
                    <span className="text-3xl">{artist.picture}</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">{artist.name}</h3>
                  {artist.verified && <span className="text-primary text-sm">✓ Verified</span>}
                  <p className="text-white/60 text-sm mt-2">{artist.bio.substring(0, 40)}...</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-3xl font-space font-bold mb-4">Ready to Start Your Journey?</h2>
            <p className="text-white/70 mb-6">Join thousands of artists already earning from their unreleased music</p>
            <button
              className="btn btn-primary text-lg px-8 py-4"
              onClick={handleJoin}
            >
              Get Started Now
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// Export component
window.Landing = {
  ModernLandingPage
}; 