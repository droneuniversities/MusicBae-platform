// ===== HOME PAGE COMPONENT =====
function HomePage({ goTo }) {
  const { showToast, user, theme } = useApp();
  const isDark = theme === 'dark'; // Theme-based logo switching
  const [openFaq, setOpenFaq] = useState(null);
  const [hp, setHp] = useState(null);
  const [txt, setTxt] = useState({});
  
  const handleJoinArtist = () => {
    goTo('register-artist');
    showToast('Join as an artist on MusicBae! 🎤');
  };

  const handleJoinFan = () => {
    goTo('register-fan');
    showToast('Join as a fan on MusicBae! 👥');
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    (async () => {
      try {
        // Only call superadmin endpoints if the viewer is superadmin
        if (user?.role === 'superadmin') {
          const [hpRes, tRes] = await Promise.allSettled([api.saGetHomepage(), api.saGetHomepageTexts()]);
          setHp(hpRes.status==='fulfilled' ? (hpRes.value.homepage || null) : null);
          setTxt(tRes.status==='fulfilled' ? (tRes.value.texts || {}) : {});
        } else {
          setHp(null);
          setTxt({});
        }
      } catch (_) {
        setHp(null);
        setTxt({});
      }
    })();
  }, [user?.role]);

  const faqData = (hp?.faq && Array.isArray(hp.faq) && hp.faq.length) ? hp.faq : [
    {
      question: "How does MusicBae work for artists?",
              answer: "Artists can upload up to 4 unreleased tracks, share their story, and receive direct tips from fans. You keep 90% of all tips with transparent fees. No intermediaries, just pure artist-fan relationships."
    },
    {
      question: "How does tipping work?",
              answer: "Fans can tip artists directly through our platform. Tips range from $1 to $1000, and artists receive 90% of each tip (10% platform fee). Tips are processed instantly and can be withdrawn once you reach $20."
    },
    {
      question: "What types of music can I upload?",
      answer: "You can upload any genre of unreleased music - from demos to finished tracks. We support all major audio formats and encourage diverse musical styles. Just make sure it's your original work."
    },
    {
      question: "How do I get paid as an artist?",
      answer: "All tips are automatically added to your balance. You can withdraw funds once you reach $20 minimum. We support multiple payment methods including bank transfer, PayPal, and cryptocurrency."
    },
    {
      question: "Is MusicBae free to use?",
              answer: "Yes! MusicBae is completely free to join and use. Artists only pay a 10% fee on tips received, and fans can browse and discover music for free. Tipping is optional but encouraged."
    },
    {
      question: "How do I discover new artists?",
      answer: "Browse our artist directory, use search filters by genre, or explore featured artists on the homepage. You can follow artists to stay updated on their new releases and support them with tips."
    },
    {
      question: "Can I upload covers or remixes?",
      answer: "We focus on original music to support independent artists. Covers and remixes require proper licensing. We recommend uploading your original compositions to avoid copyright issues."
    },
    {
      question: "What makes MusicBae different from other platforms?",
      answer: "MusicBae is specifically designed for unreleased music and direct artist-fan connections. We focus on tipping rather than streaming revenue, giving artists more control and fans a way to directly support their favorite artists."
    }
  ];

  // Feature cards (balanced 2-2 layout)
  const defaultFeatureCards = [
    {
      icon: '🎤',
      title: 'Direct Fan Connection',
      description: 'Connect directly with your fans by releasing new music. No intermediaries—just artists and their audience.',
      features: ['Upload up to 4 exclusive tracks', 'Real-time fan engagement', 'Send/receive thank‑you cards', 'Build a loyal and real fansbase that will support you to make more music for them']
    },
    {
      icon: '💰',
      title: 'Transparent Earnings',
      description: 'Artists upload their music and keep 90% of their gratuities. That is significantly higher than on any other platform ever. (Pop-Up) For example, on an album that sells for say $10, a major-label artist earns roughly $1.00 to $2.50 per album. On MusicBae, you will keep approximately $9 out of $10. ',
      features: ['Frictionless banking system', 'Instant Withdrawls']
    },
    {
      icon: '🎚️',
      title: 'Audio Quality That Stands Out',
      description: 'Streamed music often sounds thin. MusicBae delivers actual files so you hear what the artist intended—full and rich.',
      features: [ 'MP3 and WAV formats', 'Preserves dynamics and clarity', 'Ideal for DJs and audiophiles']
    },
    {
      icon: '🎵',
      title: 'For Music Lovers',
      description: 'Discover amazing unreleased music, support your favorite artists directly, and get access to music before anyone else.',
      features: ['Highest-Quarity sonic files', 'Ready for the main stage', 'Play your new music easily across multiple platforms', 'Get fresh beats here before anywhere else in the world']
    }
  ];
  const allFeatureCards = (hp?.features?.cards && Array.isArray(hp.features.cards) && hp.features.cards.length ? hp.features.cards : defaultFeatureCards);
  const splitIndex = Math.ceil(allFeatureCards.length / 2);
  const leftFeatureCards = allFeatureCards.slice(0, splitIndex);
  const rightFeatureCards = allFeatureCards.slice(splitIndex);

  // Platform Overview (2x2) content
  const overviewItems = [
    {
      icon: '🎛️',
      color: 'gradient-primary',
      title: 'Platform Overview | MusicBae',
      text: 'Fans love leaving tips, and artists really appreciate it Artists enjoy creating new music, and their fans really appreciate hearing it before anyone else. MusicBae empowers artists and connects fans in a rewarding, community‑driven way.'
    },
    {
      icon: '🎤',
      color: 'gradient-secondary',
      title: 'For Artists — Create, Share, Earn',
      bullets: [
        'List tracks for free',
        'Direct fan engagement via tips, comments, and shareable links',
        'Boost visibility: featured monthly artists, most‑tipped, and genre spotlights'
      ]
    },
    {
      icon: '💙',
      color: 'gradient-primary',
      title: 'For Fans — Support and Enjoy',
      bullets: [
        'It often takes over 40 hours to create a single 3-minute song. Plus studio costs, mastering fees, and more. Fans can now personally thank and support their favorite artists beyond just a thumbs-up.'
      ]
    },
    {
      icon: '💿',
      color: 'gradient-secondary',
      title: 'Audio Player Note',
      bullets: [
        'Higher‑quality and larger files for better fidelity',
        'Downloads may take longer—thanks for your patience',
        'A Spinning Record indicator appears during downloads'
      ]
    }
  ];

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 animated-bg opacity-10"></div>
      
      {/* Floating Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/2 left-1/2 w-24 h-24 bg-accent rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute top-1/3 right-1/4 w-16 h-16 gradient-primary rounded-full blur-2xl animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-16 px-4 section-texture bg-grid">
          <div className="max-w-7xl mx-auto">
              <div className="text-center mb-16 animate-fadeIn">
              <div className="mb-8">
                 <div className="mx-auto mb-6 overflow-hidden pt-6 md:pt-10">
                  <img src={(hp?.hero?.logoUrl)||"/logo/MusicBae.png"} alt="MusicBae" width="500" height="132" className="mx-auto" style={{maxWidth:'100%', height:'auto'}} />
                </div>
                <div className="badge badge-primary mx-auto mb-4">Music Before Anyone Else</div>
                <p className="text-xl md:text-2xl text-white/80 font-medium mb-8 max-w-3xl mx-auto leading-relaxed">
                  {txt['hero.subtitle'] || hp?.hero?.subtitle || 'Welcome to MusicBae — Music Before Anyone Else. A platform where fans directly support artists, unlock high‑quality MP3/WAV downloads, and experience new music first.'}
                </p>
                <p className="text-lg text-white/60 max-w-2xl mx-auto">
                  {txt['hero.tagline'] || hp?.hero?.tagline || 'Fair, sustainable, and direct. No middlemen—just artists and their audience.'}
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
                <button
                  className="btn btn-primary text-lg px-8 py-4 group"
                  onClick={handleJoinArtist}
                >
                  <span className="group-hover:scale-110 transition-transform inline-block mr-2">🎤</span>
                  {txt['hero.ctaJoin'] || 'Join as Artist'}
                </button>
                <button
                  className="btn btn-secondary text-lg px-8 py-4 group"
                  onClick={handleJoinFan}
                >
                  <span className="group-hover:scale-110 transition-transform inline-block mr-2">👥</span>
                  {txt['hero.ctaJoinFan'] || 'Join as Fan'}
                </button>
              </div>
            </div>

            {/* Stats Section */}
            <div className="stats-grid max-w-4xl mx-auto mb-20">
              {[
                { label: 'Artists', value: '500+', icon: '🎤', color: 'text-blue-400' },
                { label: 'Songs', value: '2,000+', icon: '🎵', color: 'text-purple-400' },
                { label: 'Tips Given', value: '$50K+', icon: '💰', color: 'text-green-400' },
                { label: 'Downloads', value: '10K+', icon: '⬇️', color: 'text-orange-400' }
              ].map(stat => (
                <div key={stat.label} className="stat-card card-hover">
                  <div className="stat-icon">{stat.icon}</div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
            <div className="section-divider"></div>
          </div>
        </section>

        {/* Platform Overview (2x2) */}
        <section className="py-12 px-4 section-texture bg-dots">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 overview-grid">
            {overviewItems.map((item, idx) => (
              <div key={idx} className="card card-hover p-8 card-full">
                <div className={`w-12 h-12 ${item.color} rounded-xl flex items-center justify-center mb-4`}>
                  <span className="text-xl">{item.icon}</span>
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>
                {item.text && (
                  <p className="text-white/70">{item.text}</p>
                )}
                {Array.isArray(item.bullets) && (
                  <ul className="mt-2 space-y-2 text-white/70 bullets">
                    {item.bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="mt-1 w-1.5 h-1.5 rounded-full bg-primary inline-block"></span>
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
        <div className="section-divider"></div>

        {/* How It Works Section */}
        <section className="py-16 px-4 section-texture bg-grid">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="section-title text-4xl md:text-5xl font-space mb-6">
                How MusicBae Works
              </h2>
              <p className="section-subtitle text-xl text-white/70 max-w-2xl mx-auto">
                For Fans – Discover, Support, Enjoy. For Artists – Create, Share, Earn.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              {(hp?.howItWorks && Array.isArray(hp.howItWorks) && hp.howItWorks.length ? hp.howItWorks : [
                {
                  step: '01',
                  title: 'Artists Upload',
                  description: 'Upload your latest tracks in high‑quality MP3/WAV, get a shareable link, and receive direct tips from fans',
                  icon: '🎤',
                  color: 'gradient-primary'
                },
                {
                  step: '02',
                  title: 'Fans Discover',
                  description: 'Find fresh music, follow favorites, and enjoy a deeper connection with creators as they alert you to their newest releases',
                  icon: '🔍',
                  color: 'gradient-secondary'
                },
                {
                  step: '03',
                  title: 'Direct Support',
                  description: 'Tip from $1 to unlock MP3/WAV downloads. A straight 10% service fee sustains the platform—artists keep the rest.',
                  icon: '💰',
                  color: 'gradient-primary'
                }
              ]).map((item, index) => (
                <div key={index} className="card card-hover text-center relative group">
                  <div className={`w-16 h-16 ${item.color} rounded-xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform`}>
                    <span className="text-2xl">{item.icon}</span>
                  </div>
                  <div className="absolute -top-4 -left-4 w-8 h-8 bg-primary rounded-full flex items-center justify-center text-sm font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-white/70 leading-relaxed">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <div className="section-divider"></div>

        {/* Features Section */}
        <section className="py-12 px-4 section-texture bg-dots">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="section-title text-4xl md:text-5xl font-space mb-6">
                {txt['features.title'] || hp?.features?.title || 'Why Artists Choose MusicBae'}
              </h2>
              <p className="section-subtitle text-xl text-white/70 max-w-2xl mx-auto">
                {txt['features.subtitle'] || hp?.features?.subtitle || 'Highest-quality music. Largest royality payout available. Real-time banking. Sustainablility for artists and fans alike. A new way to launch new music. '}
              </p>
            </div>
            
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                {leftFeatureCards.map((feature, index) => (
                  <div key={index} className="card card-hover p-8">
                    <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mb-6">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-white/70 mb-6 leading-relaxed">{feature.description}</p>
                    {Array.isArray(feature.features) && (
                      <ul className="space-y-3">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-white/60">
                            <span className="w-2 h-2 bg-primary rounded-full"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              <div className="space-y-8">
                {rightFeatureCards.map((feature, index) => (
                  <div key={index} className="card card-hover p-8">
                    <div className="w-16 h-16 gradient-secondary rounded-xl flex items-center justify-center mb-6">
                      <span className="text-2xl">{feature.icon}</span>
                    </div>
                    <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-white/70 mb-6 leading-relaxed">{feature.description}</p>
                    {Array.isArray(feature.features) && (
                      <ul className="space-y-3">
                        {feature.features.map((item, idx) => (
                          <li key={idx} className="flex items-center gap-3 text-white/60">
                            <span className="w-2 h-2 bg-secondary rounded-full"></span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Featured Artists Section */}
        <section className="py-16 px-4 section-texture bg-grid">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="section-title text-4xl md:text-5xl font-space mb-6">
                Featured Artists
              </h2>
              <p className="section-subtitle text-xl text-white/70 max-w-2xl mx-auto">
                Featured Artist of the Month highlights ten new and ten top‑ranking artists—based on gratuities received.
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mb-12">
              {mockDB.users.filter(u => u.role === 'artist').slice(0, 5).map(artist => (
                <div 
                  key={artist.id} 
                  className="card card-hover text-center cursor-pointer transition-all group"
                  onClick={() => goTo('artist-profile', slugify(artist.name))}
                >
                  <div className="w-20 h-20 gradient-primary rounded-full flex items-center justify-center mb-4 mx-auto overflow-hidden group-hover:scale-110 transition-transform">
                    <img 
                      src={getAvatarURL(artist.avatar)} 
                      alt={artist.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full flex items-center justify-center text-3xl" style={{display: 'none'}}>
                      🎵
                    </div>
                  </div>
                  <h3 className="font-bold text-white mb-2 group-hover:text-primary transition-colors">{artist.name}</h3>
                  <span className="text-primary text-sm">✓ Independent</span>
                  <p className="text-white/60 text-sm mt-2 line-clamp-2">{artist.bio.substring(0, 40)}...</p>
                </div>
              ))}
            </div>
            
            <div className="text-center">
              <button
                className="btn btn-outline text-lg px-8 py-4"
                onClick={handleDiscover}
              >
                View All Artists
              </button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-20 px-4 section-texture bg-dots">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="section-title text-4xl md:text-5xl font-space mb-6">
                Frequently Asked Questions
              </h2>
              <p className="section-subtitle text-xl text-white/70 max-w-2xl mx-auto">
                Key details about downloads, tipping, featured artists, and more.
              </p>
            </div>
            
            <div className="space-y-3">
              {faqData.map((faq, index) => (
                <div key={index} className="card card-hover overflow-hidden">
                  <button
                    className="faq-toggle w-full text-left p-4 flex items-center justify-between hover:bg-white/5 transition-colors"
                    onClick={() => toggleFaq(index)}
                  >
                    <h3 className="text-base font-medium text-white pr-4">{faq.question}</h3>
                    <span className={`text-lg transition-transform duration-300 ${openFaq === index ? 'rotate-45' : ''}`}>
                      {openFaq === index ? '×' : '+'}
                    </span>
                  </button>
                  <div 
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      openFaq === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-4 pb-4">
                      <p className="text-white/60 text-sm leading-relaxed">{faq.answer}</p>
                      {index === 0 && (
                        <div className="mt-3 text-white/50 text-xs">
                          Mission: Enable artists to achieve financial sustainability while fans enjoy exclusive, high‑quality content.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-4 hidden">
          <div className="max-w-4xl mx-auto text-center">
            <div className="card card-hover p-12">
              <div className="w-24 h-24 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-8">
                <span className="text-4xl">🚀</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-space mb-6">
                Ready to Start Your Journey?
              </h2>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  className="btn btn-primary text-lg px-8 py-4 group"
                  onClick={handleJoinArtist}
                >
                  <span className="group-hover:scale-110 transition-transform inline-block mr-2">🎤</span>
                  Join as Artist
                </button>
                <button
                  className="btn btn-secondary text-lg px-8 py-4 group"
                  onClick={handleJoinFan}
                >
                  <span className="group-hover:scale-110 transition-transform inline-block mr-2">👥</span>
                  Join as Fan
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Logo Section */}
        <section className="py-12 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-8">
                <img 
                  src={isDark ? "/assets/images/music-baee-with-dots.webp" : "/assets/images/music-baee-logo-with-dots.webp"} 
                  alt="MusicBae Logo" 
                  className="max-w-xs max-h-32 object-contain"
                />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

// Export component
window.HomePage = HomePage; 