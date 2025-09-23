// ===== ABOUT PAGE COMPONENT =====
const { useState, useEffect } = React;

function AboutPage({ goTo }) {
  return (
    <div className="pt-20 pb-24 px-4 max-w-5xl mx-auto">
      <h1 className="text-4xl md:text-5xl font-space font-bold text-white mb-6">About MusicBae</h1>
      <div className="card p-6 md:p-10 space-y-6">
        <p className="text-white/80 leading-relaxed text-lg">
          MusicBae is more than a music platform—it’s a movement redefining how artists and fans connect. We believe music creators should be fairly rewarded for their craft. That’s why we built a space where artists can earn directly from fans, without relying on middlemen or streaming payouts that undervalue their work
        </p>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white/5 rounded-xl p-5">
            <h2 className="text-2xl font-bold text-white mb-3">For Artists</h2>
            <p className="text-white/70">
              MusicBae offers a streamlined way to share music, connect with listeners, and receive gratuities that can fund future creations. Upload your tracks, share your unique link, and watch your music reach the people who truly value it.
            </p>
          </div>
          <div className="bg-white/5 rounded-xl p-5">
            <h2 className="text-2xl font-bold text-white mb-3">For Fans</h2>
            <p className="text-white/70">
              Discover fresh, high‑quality tracks released here. By tipping your favorite artists, you get early access and become part of their creative journey. Every gratuity you send yields more of the music you love.
            </p>
          </div>
        </div>

        <div className="bg-white/5 rounded-xl p-5">
          <h2 className="text-2xl font-bold text-white mb-3">Our Mission</h2>
          <ul className="list-disc list-inside text-white/80 space-y-2">
            <li>Empower artists to achieve financial sustainability.</li>
            <li>Give fans exclusive access to the music they love.</li>
            <li>Foster a community where creativity and appreciation fuel each other.</li>
          </ul>
        </div>

        <div className="bg-white/5 rounded-xl p-5">
          <h2 className="text-2xl font-bold text-white mb-3">Quality First</h2>
          <p className="text-white/70">
            We prioritize quality over quantity. Many streaming platforms compress music until it loses its depth; we deliver actual audio files in .mp3 and .wav formats so you can hear the music exactly as the artist intended—club‑ready for DJs, crystal‑clear for casual listening.
          </p>
        </div>

        <div className="bg-white/5 rounded-xl p-5">
          <h2 className="text-2xl font-bold text-white mb-3">Our Story</h2>
          <p className="text-white/80 mb-3">
            MusicBae was born from a simple but powerful truth: music deserves better. Traditional streaming often undervalues creators and disconnects fans. We built MusicBae so appreciation becomes tangible—fueling creativity, paying for studio time, and keeping music alive.
          </p>
          <p className="text-white/70 mb-3">
          Fans are now directly connected with the artists they love - receiving their music before any labels, platforms or anyone else.
          </p>
          <p className="text-white/70">
            What started as a vision has grown into a global network of artists and fans determined to change how music is experienced and supported.
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button className="btn btn-primary" onClick={() => goTo('register-artist')}>I’m an Artist</button>
          <button className="btn btn-outline" onClick={() => goTo('artists')}>Discover Artists</button>
        </div>
      </div>
    </div>
  );
}

// Export component
window.AboutPage = AboutPage; 