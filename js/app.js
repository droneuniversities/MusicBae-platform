const { useState, useEffect } = React;

// AppContext and useApp are now defined in context.js

// ===== NAVIGATION COMPONENTS =====
const NAV_ITEMS = [
  { key: 'artists', label: 'Artists', icon: '🎤' }
];

const NAV_EXTRA = [
  { key: 'services', label: 'Audio Services', icon: '🎵' },
  { key: 'about', label: 'About', icon: 'ℹ️' },
  { key: 'contact', label: 'Contact', icon: '✉️' }
];

function ModernBottomNav({ goTo, currentPage, setMenuOpen }) {
  const { theme, setTheme } = window.useApp();
  const isDark = theme === 'dark';
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 nav-glass border-t border-white/10 md:hidden">
      <div className="flex justify-between px-2 py-2">
        {NAV_ITEMS.map(item => (
          <button
            key={item.key}
            className={`flex-1 flex flex-col items-center py-2 transition-all ${currentPage === item.key ? 'text-primary' : 'text-white/60'}`}
            onClick={() => goTo(item.key)}
            aria-label={item.label}
          >
            <span className="text-2xl mb-1">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
            {currentPage === item.key && (
              <div className="w-1 h-1 bg-primary rounded-full mt-1"></div>
            )}
          </button>
        ))}
        <button
          className="flex-1 flex flex-col items-center py-2 text-white/60"
          onClick={() => setMenuOpen(true)}
          aria-label="More"
        >
          <span className="text-2xl mb-1">☰</span>
          <span className="text-xs font-medium">Menu</span>
        </button>
        <button
          className="flex-1 flex flex-col items-center py-2"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label={`Toggle theme: currently ${isDark ? 'dark' : 'light'}`}
        >
          <span className="text-2xl mb-1">{isDark ? '🌙' : '☀️'}</span>
          <span className="text-xs font-medium">Theme</span>
        </button>
      </div>
    </nav>
  );
}

function ModernTopNav({ goTo, currentPage, user, setUser }) {
  const { theme, setTheme } = window.useApp();
  const isDark = theme === 'dark';
  function toggleTheme() { setTheme(isDark ? 'light' : 'dark'); }
  return (
    <nav className="hidden md:flex w-full fixed top-0 left-0 z-40 nav-glass px-8 py-4 items-center justify-between">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => goTo('home')}
            className="flex items-center gap-3 hover:scale-105 transition-transform cursor-pointer"
            title="Go to Homepage"
          >
            <img 
              src="/logo/MusicBae.png" 
              alt="MusicBae" 
              className="h-8 w-auto hover:scale-105 transition-transform"
            />
          </button>
        </div>
        {NAV_ITEMS.concat(NAV_EXTRA).map(item => (
          <button
            key={item.key}
            className={`nav-item ${currentPage === item.key ? 'active' : ''}`}
            onClick={() => goTo(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <button
          className="btn btn-ghost"
          onClick={toggleTheme}
          aria-label={`Toggle theme: currently ${isDark ? 'dark' : 'light'}`}
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span className="mr-2" role="img" aria-hidden="true">{isDark ? '🌙' : '☀️'}</span>
          <span className="font-medium">{isDark ? 'Dark' : 'Light'}</span>
        </button>
        {user ? (
          <div className="flex items-center gap-3">
            <button 
              className={`btn btn-ghost ${currentPage === 'dashboard' ? 'text-primary' : ''}`}
              onClick={() => goTo('dashboard')}
            >
              📊 Dashboard
            </button>
            <div className="w-8 h-8 gradient-primary rounded-full flex items-center justify-center">
              <span className="text-sm">{user.picture}</span>
            </div>
            <span className="font-medium">{user.name}</span>
            <button 
              className="btn btn-ghost"
              onClick={() => setUser(null)}
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="flex gap-3">
            <button 
              className="btn btn-ghost"
              onClick={() => goTo('login')}
            >
              Login
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => goTo('register')}
            >
              Join Now
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}

function ModernMobileMenu({ goTo, menuOpen, setMenuOpen, user }) {
  if (!menuOpen) return null;
  return (
    <div className="fixed inset-0 z-50 backdrop">
      <div className="absolute right-0 top-0 h-full w-80 glass-dark p-6 animate-slideInRight">
        <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>✕</button>
        <div className="mt-12 space-y-2">
          {user && (
            <button
              className="w-full text-left p-4 rounded-lg hover:bg-white/10 transition-all flex items-center gap-3"
              onClick={() => { goTo('dashboard'); setMenuOpen(false); }}
            >
              <span className="text-xl">📊</span>
              <span className="font-medium">Dashboard</span>
            </button>
          )}
          {NAV_EXTRA.map(item => (
            <button
              key={item.key}
              className="w-full text-left p-4 rounded-lg hover:bg-white/10 transition-all flex items-center gap-3"
              onClick={() => { goTo(item.key); setMenuOpen(false); }}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ===== MOCK DATABASE =====
const mockDB = {
  users: [
    {
      id: 1,
      name: 'Luna Echo',
      email: 'luna@musicbae.com',
      role: 'artist',
      avatar: 'assets/images/music-baee-logo-with-dots.webp',
      bio: 'Alternative indie artist pushing boundaries with ethereal vocals and experimental soundscapes.',
      followers: 12450,
      totalTips: 2840,
      songs: [
        {
          id: 1,
          title: 'Midnight Whispers',
          duration: 237,
          genre: 'Alternative',
          tips: 45,
          plays: 1200,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 2,
          title: 'Ocean Dreams',
          duration: 198,
          genre: 'Indie',
          tips: 32,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 3,
          title: 'Starlight Serenade',
          duration: 245,
          genre: 'Alternative',
          tips: 28,
          plays: 756,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 2,
      name: 'EDM Pulse',
      email: 'pulse@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Electronic dance music producer creating high-energy beats that make crowds move.',
      followers: 8920,
      totalTips: 1560,
      songs: [
        {
          id: 4,
          title: 'Neon Nights',
          duration: 184,
          genre: 'EDM',
          tips: 67,
          plays: 2100,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 5,
          title: 'Digital Dreams',
          duration: 203,
          genre: 'Electronic',
          tips: 43,
          plays: 1450,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 6,
          title: 'Bass Drop',
          duration: 167,
          genre: 'EDM',
          tips: 89,
          plays: 3200,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 3,
      name: 'Jazz Flow',
      email: 'jazz@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Smooth jazz saxophonist bringing soulful melodies to life with every note.',
      followers: 5670,
      totalTips: 920,
      songs: [
        {
          id: 7,
          title: 'Smooth Operator',
          duration: 312,
          genre: 'Jazz',
          tips: 23,
          plays: 678,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 8,
          title: 'Midnight Jazz',
          duration: 289,
          genre: 'Jazz',
          tips: 18,
          plays: 445,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 4,
      name: 'Rock Rebel',
      email: 'rock@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: 'Hard rock guitarist shredding through power chords and epic solos.',
      followers: 15680,
      totalTips: 3420,
      songs: [
        {
          id: 9,
          title: 'Thunder Road',
          duration: 267,
          genre: 'Rock',
          tips: 76,
          plays: 1890,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 10,
          title: 'Electric Storm',
          duration: 234,
          genre: 'Rock',
          tips: 54,
          plays: 1340,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 11,
          title: 'Guitar Hero',
          duration: 298,
          genre: 'Rock',
          tips: 92,
          plays: 2560,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 5,
      name: 'Hip Hop Soul',
      email: 'hiphop@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      bio: 'Hip hop artist with soulful beats and powerful lyrics that tell real stories.',
      followers: 20340,
      totalTips: 4560,
      songs: [
        {
          id: 12,
          title: 'Street Dreams',
          duration: 198,
          genre: 'Hip Hop',
          tips: 123,
          plays: 3450,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 13,
          title: 'Soul Flow',
          duration: 223,
          genre: 'Hip Hop',
          tips: 87,
          plays: 2340,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 6,
      name: 'Classical Harmony',
      email: 'classical@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Classical pianist performing timeless masterpieces with modern interpretation.',
      followers: 7890,
      totalTips: 1280,
      songs: [
        {
          id: 14,
          title: 'Moonlight Sonata',
          duration: 456,
          genre: 'Classical',
          tips: 34,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 15,
          title: 'Symphony No. 5',
          duration: 523,
          genre: 'Classical',
          tips: 28,
          plays: 567,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 7,
      name: 'Country Roads',
      email: 'country@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      bio: 'Country singer-songwriter telling stories of love, loss, and life on the road.',
      followers: 11230,
      totalTips: 2340,
      songs: [
        {
          id: 16,
          title: 'Dirt Road Home',
          duration: 245,
          genre: 'Country',
          tips: 45,
          plays: 1230,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 17,
          title: 'Whiskey and Rain',
          duration: 198,
          genre: 'Country',
          tips: 32,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 8,
      name: 'Pop Sensation',
      email: 'pop@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Pop artist creating catchy melodies and infectious hooks that get stuck in your head.',
      followers: 28900,
      totalTips: 6780,
      songs: [
        {
          id: 18,
          title: 'Summer Vibes',
          duration: 187,
          genre: 'Pop',
          tips: 156,
          plays: 4560,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 19,
          title: 'Dance All Night',
          duration: 203,
          genre: 'Pop',
          tips: 134,
          plays: 3890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 20,
          title: 'Heartbeat',
          duration: 176,
          genre: 'Pop',
          tips: 98,
          plays: 2340,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 9,
      name: 'Hip Hop Soul',
      email: 'rnb@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: 'R&B artist with smooth vocals and soulful melodies that touch the heart.',
      followers: 15670,
      totalTips: 3120,
      songs: [
        {
          id: 21,
          title: 'Smooth Love',
          duration: 234,
          genre: 'Pop',
          tips: 67,
          plays: 1890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        },
        {
          id: 22,
          title: 'Midnight Groove',
          duration: 267,
          genre: 'R&B',
          tips: 54,
          plays: 1450,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 10,
      name: 'Metal Core',
      email: 'metal@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Heavy metal band delivering powerful riffs and intense energy.',
      followers: 9870,
      totalTips: 1890,
      songs: [
        {
          id: 23,
          title: 'Thunder Strike',
          duration: 298,
          genre: 'Metal',
          tips: 43,
          plays: 1230,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&w=300&h=300&fit=crop'
        },
        {
          id: 24,
          title: 'Dark Storm',
          duration: 312,
          genre: 'Metal',
          tips: 38,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 11,
      name: 'Folk Tales',
      email: 'folk@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Folk musician sharing stories through acoustic melodies and heartfelt lyrics.',
      followers: 6540,
      totalTips: 980,
      songs: [
        {
          id: 25,
          title: 'Mountain Song',
          duration: 223,
          genre: 'Folk',
          tips: 23,
          plays: 567,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 26,
          title: 'River Flow',
          duration: 198,
          genre: 'Folk',
          tips: 18,
          plays: 445,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 12,
      name: 'Blues Master',
      email: 'blues@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      bio: 'Blues guitarist with soulful licks and stories of life\'s ups and downs.',
      followers: 8230,
      totalTips: 1450,
      songs: [
        {
          id: 27,
          title: 'Blues Highway',
          duration: 289,
          genre: 'Blues',
          tips: 34,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 28,
          title: 'Soul Cry',
          duration: 267,
          genre: 'Blues',
          tips: 28,
          plays: 678,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 13,
      name: 'Reggae Vibes',
      email: 'reggae@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Reggae artist spreading positive vibes and island rhythms.',
      followers: 7450,
      totalTips: 1120,
      songs: [
        {
          id: 29,
          title: 'Island Breeze',
          duration: 234,
          genre: 'Reggae',
          tips: 26,
          plays: 567,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 30,
          title: 'Positive Energy',
          duration: 198,
          genre: 'Reggae',
          tips: 22,
          plays: 445,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 14,
      name: 'Punk Rock',
      email: 'punk@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: 'Punk rock band with high energy and rebellious spirit.',
      followers: 12340,
      totalTips: 2340,
      songs: [
        {
          id: 31,
          title: 'Rebel Yell',
          duration: 187,
          genre: 'Punk',
          tips: 56,
          plays: 1450,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 32,
          title: 'Anarchy Now',
          duration: 156,
          genre: 'Punk',
          tips: 43,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 15,
      name: 'Ambient Dreams',
      email: 'ambient@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Ambient music producer creating atmospheric soundscapes for relaxation.',
      followers: 5670,
      totalTips: 890,
      songs: [
        {
          id: 33,
          title: 'Ocean Waves',
          duration: 456,
          genre: 'Ambient',
          tips: 18,
          plays: 345,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 34,
          title: 'Forest Echo',
          duration: 523,
          genre: 'Ambient',
          tips: 15,
          plays: 234,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 16,
      name: 'Latin Groove',
      email: 'latin@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Latin music artist bringing salsa, bachata, and reggaeton rhythms.',
      followers: 9870,
      totalTips: 1670,
      songs: [
        {
          id: 35,
          title: 'Salsa Caliente',
          duration: 234,
          genre: 'Latin',
          tips: 45,
          plays: 1230,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 36,
          title: 'Bachata Nights',
          duration: 198,
          genre: 'Latin',
          tips: 32,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 17,
      name: 'Gospel Soul',
      email: 'gospel@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
      bio: 'Gospel singer with powerful vocals and uplifting spiritual messages.',
      followers: 11230,
      totalTips: 2340,
      songs: [
        {
          id: 37,
          title: 'Amazing Grace',
          duration: 289,
          genre: 'Gospel',
          tips: 67,
          plays: 1450,
          cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop'
        },
        {
          id: 38,
          title: 'Higher Ground',
          duration: 267,
          genre: 'Gospel',
          tips: 54,
          plays: 890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 18,
      name: 'Electronic Dreams',
      email: 'electronic@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'Electronic music producer creating futuristic sounds and innovative beats.',
      followers: 15670,
      totalTips: 2890,
      songs: [
        {
          id: 39,
          title: 'Digital Future',
          duration: 198,
          genre: 'Electronic',
          tips: 78,
          plays: 2340,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 40,
          title: 'Neon Lights',
          duration: 223,
          genre: 'Electronic',
          tips: 65,
          plays: 1890,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 19,
      name: 'Indie Folk',
      email: 'indie@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      bio: 'Indie folk artist with acoustic melodies and introspective lyrics.',
      followers: 8230,
      totalTips: 1340,
      songs: [
        {
          id: 41,
          title: 'Autumn Leaves',
          duration: 245,
          genre: 'Indie',
          tips: 34,
          plays: 890,
          cover: 'https://images.images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 42,
          title: 'Campfire Stories',
          duration: 198,
          genre: 'Indie',
          tips: 28,
          plays: 567,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    },
    {
      id: 20,
      name: 'World Music',
      email: 'world@musicbae.com',
      role: 'artist',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'World music artist blending traditional sounds with modern production.',
      followers: 6780,
      totalTips: 980,
      songs: [
        {
          id: 43,
          title: 'Desert Wind',
          duration: 312,
          genre: 'World',
          tips: 23,
          plays: 456,
          cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop'
        },
        {
          id: 44,
          title: 'Mountain Echo',
          duration: 289,
          genre: 'World',
          tips: 19,
          plays: 345,
          cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop'
        }
      ]
    }
  ],
  featuredArtists: [1, 2, 3, 4, 5] // IDs of featured artists
};

// Make mockDB globally available
window.mockDB = mockDB;

// ===== UTILITY FUNCTIONS =====
const formatCurrency = (amount) => `$${amount.toFixed(2)}`;
const formatDuration = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatNumber = (num) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

// ===== TIP MODAL COMPONENT =====
function TipModal({ goTo }) {
  const { 
    showTipModal, setShowTipModal, tipAmount, setTipAmount, tipTarget, tipType,
    setTipTarget,
    showToast, user, playMicroSound, launchConfetti
  } = useApp();
  
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wallet');
  const [showTopupModal, setShowTopupModal] = useState(false);
  const [topupAmount, setTopupAmount] = useState(10);
  const [tipMessage, setTipMessage] = useState('');
  
  // Get wallet balance when modal opens
  useEffect(() => {
    if (showTipModal && user) {
      getWalletBalance();
      setTipMessage(''); // Reset message when modal opens
    }
  }, [showTipModal, user]);
  
  const getWalletBalance = async () => {
    try {
      const response = await api.getWalletBalance();
      setWalletBalance(response.walletBalance);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
    }
  };
  
  if (!showTipModal || !tipTarget) return null;
  
  // Check if user is logged in
  if (!user) {
    return (
      <div className="fixed inset-0 z-50 backdrop">
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <div className="glass-dark rounded-2xl p-6 md:p-8 max-w-md w-full animate-slideInUp">
            <div className="text-center mb-6">
              <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-2xl font-space font-bold text-white mb-2">
                Login Required
              </h2>
              <p className="text-white/60">
                You need to be logged in to tip artists and support their music.
              </p>
            </div>
            
            <div className="space-y-3">
              <button
                className="btn btn-primary w-full text-lg py-3"
                onClick={() => {
                  setShowTipModal(false);
                  localStorage.setItem('loginRedirect', 'tip');
                  localStorage.setItem('tipTarget', JSON.stringify(tipTarget));
                  localStorage.setItem('tipType', tipType);
                  goTo('login');
                }}
              >
                👤 Login as Fan
              </button>
              <button
                className="btn btn-secondary w-full text-lg py-3"
                onClick={() => {
                  setShowTipModal(false);
                  localStorage.setItem('loginRedirect', 'tip');
                  localStorage.setItem('tipTarget', JSON.stringify(tipTarget));
                  localStorage.setItem('tipType', tipType);
                  goTo('register');
                }}
              >
                ✨ Create Account
              </button>
              <button
                className="btn btn-ghost w-full"
                onClick={() => setShowTipModal(false)}
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  const handleTip = async () => {
    if (paymentMethod === 'wallet' && (walletBalance || 0) < tipAmount) {
      setShowTopupModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      const isValidObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
      let artistIdCandidate = tipType === 'artist' ? tipTarget?.id : tipTarget?.artist?.id;
      let resolvedArtistId = artistIdCandidate;

      // If we don't have a valid Mongo ObjectId, resolve by name via search endpoint
      if (!isValidObjectId(resolvedArtistId)) {
        const artistName = tipType === 'artist' ? tipTarget?.name : tipTarget?.artist?.name;
        if (artistName) {
          try {
            const search = await api.searchUsers({ q: artistName, role: 'artist', limit: 1 });
            if (search && Array.isArray(search.users) && search.users[0]?._id) {
              resolvedArtistId = search.users[0]._id;
            }
          } catch (_) {
            // Ignore search failure; will fallback to error from API call
          }
        }
      }

// (Removed nested duplicate SiteFooter definition to avoid shadowing)

      const songIdCandidate = tipType === 'song' ? (tipTarget?.id || tipTarget?._id) : null;
      const tipData = {
        artistId: resolvedArtistId,
        artistName: (tipType === 'artist' ? tipTarget?.name : tipTarget?.artist?.name) || undefined,
        songId: (tipType === 'song' && isValidObjectId(songIdCandidate)) ? songIdCandidate : null,
        amount: tipAmount,
        message: tipMessage
      };
      
      console.log('Sending tip with data:', tipData);
      
      if (paymentMethod === 'wallet') {
        await api.tipFromWallet(tipData);
        await getWalletBalance(); // Refresh balance
        showToast(`Tipped $${tipAmount} to ${tipType === 'artist' ? tipTarget.name : tipTarget.artist.name}! 💰`);
        // Microinteraction for successful tip
        playMicroSound('tip');
        // Enhanced confetti celebration (tsparticles with fallback)
        if (typeof window !== 'undefined' && typeof window.launchTipConfettiCelebration === 'function') {
          window.launchTipConfettiCelebration();
        } else if (typeof launchTipConfettiCelebration === 'function') {
          launchTipConfettiCelebration();
        } else {
          // Final fallback to a stronger canvas-confetti celebration (2x bursts)
          launchConfetti({ particleCount: 280, spread: 90, origin: { x: 1, y: 0.9 } });
          launchConfetti({ particleCount: 280, spread: 90, origin: { x: 0, y: 0.9 } });
          setTimeout(() => {
            launchConfetti({
              particleCount: 200,
              spread: 70,
              angle: 90,
              startVelocity: 55,
              origin: { x: 0.5, y: 0.98 }
            });
          }, 250);
        }
        try {
          window.dispatchEvent(new CustomEvent('tips:changed', { detail: { amount: tipAmount, tipType } }));
        } catch (_) {}
      } else {
        // Handle direct payment (Stripe/PayPal)
        const response = await api.topupWallet(tipAmount, paymentMethod);
        showToast(`Payment initiated! Redirecting to ${paymentMethod}...`);
        // TODO: Handle payment redirect
      }
      
      // Reset and close modal
      setShowTipModal(false);
      setTipAmount(5);
      setTipTarget(null);
      setPaymentMethod('wallet');
      setTipMessage('');
    } catch (error) {
      console.error('Tip error:', error);
      showToast(error.message || 'Failed to send tip', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancel = () => {
    setShowTipModal(false);
    setTipAmount(5);
    setTipTarget(null);
    setPaymentMethod('wallet');
    setTipMessage('');
  };
  
  const handleManualInput = (e) => {
    const value = parseFloat(e.target.value) || 0;
    setTipAmount(Math.max(1, Math.min(1000, value))); // Limit between $1-$1000
  };
  
  const handleTopup = async () => {
    setIsLoading(true);
    try {
      const r = await api.topupWallet(topupAmount, 'stripe');
      if (r && (r.simulated || r.requiresSetup)) {
        showToast('Payment provider not configured. Transaction pending; no funds credited.', 'error');
      } else {
        showToast(`Top-up initiated! Redirecting to payment...`);
      }
      setShowTopupModal(false);
      // TODO: Handle payment redirect
    } catch (error) {
      console.error('Top-up error:', error);
      showToast(error.message || 'Failed to initiate top-up', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="fixed inset-0 z-50 backdrop">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="glass-dark rounded-2xl p-6 md:p-8 max-w-md w-full animate-slideInUp max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">💰</span>
            </div>
            <h2 className="text-2xl font-space font-bold text-white mb-2">
              {(() => {
                const artistName = tipType === 'artist'
                  ? (tipTarget?.name || tipTarget?.artist?.name || 'Artist')
                  : (tipTarget?.artist?.name || tipTarget?.artistName || 'Artist');
                return `Tip ${artistName}`;
              })()}
            </h2>
            {tipType === 'song' && (tipTarget?.title || tipTarget?.song?.title) && (
              <div className="text-white/50 text-sm mb-1">for {tipTarget?.title || tipTarget?.song?.title}</div>
            )}
            <p className="text-white/60">
              Show your support with a tip! Artists receive 90% of all tips.
            </p>
          </div>
          
          {/* Wallet Balance */}
          <div className="bg-white/5 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-white/80">Wallet Balance:</span>
              <span className="text-xl font-bold text-white">${(walletBalance || 0).toFixed(2)}</span>
            </div>
            {(walletBalance || 0) < tipAmount && paymentMethod === 'wallet' && (
              <div className="mt-2 text-sm text-red-400">
                Insufficient balance. Please top up your wallet.
              </div>
            )}
          </div>
          
          {/* Tip Amount Display */}
          <div className="text-center mb-6">
            <div className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
              ${tipAmount}
            </div>
          </div>
          
          {/* Slider */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-white/60 mb-2">
              <span>$1</span>
              <span>$1000</span>
            </div>
            <input
              type="range"
              min="1"
              max="1000"
              value={tipAmount}
              onChange={(e) => setTipAmount(parseInt(e.target.value))}
              className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-xs text-white/40 mt-1">
              <span>$5</span>
              <span>$25</span>
              <span>$50</span>
              <span>$100</span>
              <span>$500</span>
            </div>
          </div>
          
          {/* Quick Amount Buttons */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-6">
            {[5, 10, 25, 50, 100, 500].map(amount => (
              <button
                key={amount}
                className={`py-2 px-2 md:px-3 rounded-lg text-xs md:text-sm font-medium transition-all ${
                  tipAmount === amount
                    ? 'bg-primary text-white'
                    : 'bg-white/10 text-white/80 hover:bg-white/20'
                }`}
                onClick={() => setTipAmount(amount)}
              >
                ${amount}
              </button>
            ))}
          </div>
          
          {/* Manual Input */}
          <div className="mb-6">
            <label className="block text-white/90 mb-2 font-medium text-sm">
              Custom Amount
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">$</span>
              <input
                type="number"
                min="1"
                max="1000"
                step="0.01"
                value={tipAmount}
                onChange={handleManualInput}
                className="input w-full pl-8"
                placeholder="Enter amount"
              />
            </div>
          </div>
          
          {/* Message Field */}
          <div className="mb-6">
            <label className="block text-white/90 mb-2 font-medium text-sm">
              Message (Optional)
            </label>
            <textarea
              rows="3"
              className="input w-full resize-none"
              placeholder="Add an optional message to the artist..."
              value={tipMessage}
              onChange={(e) => setTipMessage(e.target.value)}
              maxLength="200"
            />
            <div className="text-right text-white/40 text-xs mt-1">
              {tipMessage.length}/200
            </div>
          </div>
          
          {/* Payment Method Selection */}
          <div className="mb-6">
            <label className="block text-white/90 mb-3 font-medium">Payment Method</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-all">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="wallet"
                  checked={paymentMethod === 'wallet'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary"
                />
                <span className="text-white">💳 Wallet Balance</span>
                <span className="text-white/60 text-sm ml-auto">${walletBalance.toFixed(2)}</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-all">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="stripe"
                  checked={paymentMethod === 'stripe'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary"
                />
                <span className="text-white">💳 Credit/Debit Card</span>
                <span className="text-white/60 text-sm ml-auto">Stripe</span>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-white/5 transition-all">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="text-primary"
                />
                <span className="text-white">📱 PayPal</span>
                <span className="text-white/60 text-sm ml-auto">PayPal</span>
              </label>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <button
              className="btn btn-ghost flex-1"
              onClick={handleCancel}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-primary flex-1"
              onClick={handleTip}
              disabled={isLoading || (paymentMethod === 'wallet' && walletBalance < tipAmount)}
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-2"></div>
                  Processing...
                </span>
              ) : (
                `Send Tip $${tipAmount}`
              )}
            </button>
          </div>
        </div>
      </div>
      
      {/* Top-up Modal */}
      {showTopupModal && (
        <div className="fixed inset-0 z-60 backdrop">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="glass-dark rounded-2xl p-6 md:p-8 max-w-md w-full animate-slideInUp">
              <div className="text-center mb-6">
                <div className="w-16 h-16 gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">💳</span>
                </div>
                <h2 className="text-2xl font-space font-bold text-white mb-2">
                  Top Up Wallet
                </h2>
                <p className="text-white/60">
                  Add funds to your wallet to tip artists
                </p>
              </div>
              
              <div className="mb-6">
                <label className="block text-white/90 mb-2 font-medium">Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60">$</span>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    step="0.01"
                    value={topupAmount}
                    onChange={(e) => setTopupAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                    className="input w-full pl-8"
                    placeholder="Enter amount"
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  className="btn btn-ghost flex-1"
                  onClick={() => setShowTopupModal(false)}
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  className="btn btn-primary flex-1"
                  onClick={handleTopup}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <div className="spinner mr-2"></div>
                      Processing...
                    </span>
                  ) : (
                    `Top Up $${topupAmount}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== PLAYER MODAL COMPONENT (Howler.js) =====
function PlayerModal() {
  const { currentSong, isPlaying, setIsPlaying, audioProgress, setAudioProgress, showPlayerModal, setShowPlayerModal } = useApp();
  const audioRef = React.useRef(null); // kept for fallback UI progress bar
  const howlerRef = React.useRef(null);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [totalDurationSec, setTotalDurationSec] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    const saved = parseFloat(localStorage.getItem('player:volume') || '0.85');
    return Number.isFinite(saved) ? Math.min(1, Math.max(0, saved)) : 0.85;
  });
  const progressBarRef = React.useRef(null);
  const isDraggingRef = React.useRef(false);
  
  useEffect(() => {
    if (!showPlayerModal || !currentSong?.previewUrl) return;
    try {
      // Stop and unload any previous sound
      try { howlerRef.current?.stop(); howlerRef.current?.unload?.(); } catch(_) {}
      // Create Howler sound
      const sound = new Howl({
        src: [currentSong.previewUrl],
        html5: true,
        preload: true,
        volume,
        onplay: () => { setIsPlaying(true); setIsLoading(false); },
        onpause: () => setIsPlaying(false),
        onend: () => { setIsPlaying(false); setAudioProgress(0); setCurrentTimeSec(0); },
        onload: () => { try { setTotalDurationSec(sound.duration() || 0); setIsLoading(false); } catch(_) { setIsLoading(false); } },
        onloaderror: () => { setIsPlaying(false); setIsLoading(false); },
        onplayerror: (id, err) => {
          try {
            sound.once('unlock', () => sound.play());
          } catch(_) {}
          // Fallback to native audio element
          try {
            if (audioRef.current) {
              audioRef.current.src = currentSong.previewUrl;
              audioRef.current.play().catch(()=>{});
            }
          } catch(_) {}
        }
      });
      howlerRef.current = sound;
      // Start playback immediately when ready
      setTimeout(() => {
        try {
          const p = sound.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              try { audioRef.current && (audioRef.current.src = currentSong.previewUrl) && audioRef.current.play(); } catch(_) {}
            });
          }
        } catch(_) {
          try { audioRef.current && (audioRef.current.src = currentSong.previewUrl) && audioRef.current.play(); } catch(_) {}
        }
      }, 0);
      // Progress updater
      const iv = setInterval(() => {
        try {
          const dur = sound.duration() || totalDurationSec || (currentSong.duration || 0);
          const cur = Number(sound.seek() || 0);
          const pct = dur ? (cur / dur) * 100 : 0;
          setAudioProgress(pct);
          setCurrentTimeSec(cur);
          if (!totalDurationSec && dur) setTotalDurationSec(dur);
        } catch(_) {}
      }, 200);
      const handleKeys = (e) => {
        if (e.key === 'Escape') setShowPlayerModal(false);
        if (e.code === 'Space') { e.preventDefault(); handlePlayPause(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); handleSeek(-5); }
        if (e.key === 'ArrowRight') { e.preventDefault(); handleSeek(5); }
        if (e.key.toLowerCase() === 'm') { e.preventDefault(); toggleMute(); }
      };
      window.addEventListener('keydown', handleKeys);
      return () => {
        window.removeEventListener('keydown', handleKeys);
        clearInterval(iv);
        try { sound.stop(); sound.unload?.(); } catch(_) {}
        setCurrentTimeSec(0);
        setTotalDurationSec(0);
      };
    } catch(_) { /* ignore */ }
  }, [showPlayerModal, currentSong?.previewUrl, setShowPlayerModal]);

  // Persist volume and push to active sound
  useEffect(() => {
    try { localStorage.setItem('player:volume', String(volume)); } catch(_) {}
    try { howlerRef.current?.volume?.(isMuted ? 0 : volume); } catch(_) {}
  }, [volume, isMuted]);

  if (!showPlayerModal || !currentSong) return null;

  const handlePlayPause = () => {
    const sound = howlerRef.current; if (!sound) return;
    if (isPlaying) { try { sound.pause(); } catch(_) {} setIsPlaying(false); }
    else { try { sound.play(); } catch(_) {} setIsPlaying(true); }
  };

  const handleSeek = (deltaSeconds) => {
    const sound = howlerRef.current;
    if (sound) {
      try {
        const dur = totalDurationSec || sound.duration() || 0;
        const next = Math.max(0, Math.min(dur, Number(sound.seek() || 0) + deltaSeconds));
        sound.seek(next);
        setCurrentTimeSec(next);
        setAudioProgress(dur ? (next / dur) * 100 : 0);
        return;
      } catch(_) {}
    }
    const audio = audioRef.current; if (!audio) return;
    audio.currentTime = Math.max(0, Math.min((audio.duration || 0), audio.currentTime + deltaSeconds));
  };

  const handleProgressClick = (e) => {
    const bar = progressBarRef.current; if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const dur = totalDurationSec || howlerRef.current?.duration?.() || 0;
    const target = dur * ratio;
    try { howlerRef.current?.seek?.(target); } catch(_) {}
    setCurrentTimeSec(target);
    setAudioProgress(dur ? ratio * 100 : 0);
  };

  const getClientX = (evt) => {
    if (typeof evt.clientX === 'number') return evt.clientX;
    if (evt.touches && evt.touches[0]) return evt.touches[0].clientX;
    return 0;
  };

  const scrubToEvent = (evt) => {
    const bar = progressBarRef.current; if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const x = getClientX(evt);
    const ratio = Math.min(1, Math.max(0, (x - rect.left) / rect.width));
    const dur = totalDurationSec || howlerRef.current?.duration?.() || 0;
    const target = dur * ratio;
    try { howlerRef.current?.seek?.(target); } catch(_) {}
    setCurrentTimeSec(target);
    setAudioProgress(dur ? ratio * 100 : 0);
  };

  const handleScrubStart = (evt) => {
    isDraggingRef.current = true;
    scrubToEvent(evt);
    window.addEventListener('mousemove', handleScrubMove);
    window.addEventListener('mouseup', handleScrubEnd);
    window.addEventListener('touchmove', handleScrubMove, { passive: false });
    window.addEventListener('touchend', handleScrubEnd);
  };

  const handleScrubMove = (evt) => {
    if (!isDraggingRef.current) return;
    evt.preventDefault?.();
    scrubToEvent(evt);
  };

  const handleScrubEnd = () => {
    isDraggingRef.current = false;
    window.removeEventListener('mousemove', handleScrubMove);
    window.removeEventListener('mouseup', handleScrubEnd);
    window.removeEventListener('touchmove', handleScrubMove);
    window.removeEventListener('touchend', handleScrubEnd);
  };

  const toggleMute = () => {
    setIsMuted((m) => !m);
  };

  const handleClose = () => {
    setShowPlayerModal(false);
    try { howlerRef.current?.stop(); howlerRef.current?.unload?.(); } catch(_) {}
    setIsPlaying(false);
    setAudioProgress(0);
  };

  return (
    <div className="fixed inset-0 z-50 backdrop">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose}></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="glass-dark rounded-2xl p-8 max-w-md w-full animate-slideInUp relative max-h-[90vh] overflow-y-auto">
          <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={handleClose}>✕</button>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 gradient-primary rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={currentSong.cover} 
                alt={currentSong.title}
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
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-2xl truncate">{currentSong.title}</h3>
              <p className="text-white/60 text-sm truncate">{currentSong.genre}</p>
            </div>
          </div>
          {/* Controls row: play/pause, skip, and inline volume */}
          <div className="flex items-center gap-3 mb-3">
            <button
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all text-2xl"
              onClick={handlePlayPause}
            >
              {isPlaying ? '⏸️' : '▶️'}
            </button>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={()=>handleSeek(-10)} title="Back 10s">⏪</button>
            <button className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={()=>handleSeek(10)} title="Forward 10s">⏩</button>
            <div className="flex items-center gap-2 ml-auto w-40 md:w-64">
              <button className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={toggleMute} title="Mute/Unmute">{isMuted ? '🔇' : '🔊'}</button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e)=> setVolume(parseFloat(e.target.value))}
                className="w-full accent-primary"
              />
            </div>
          </div>
          {/* Full-width progress bar */}
          <div className="select-none mb-1">
            <div
              ref={progressBarRef}
              className="w-full bg-white/10 rounded-full h-2 cursor-pointer relative"
              onClick={handleProgressClick}
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
            >
              <div
                className="bg-primary h-2 rounded-full transition-all duration-100"
                style={{ width: `${audioProgress}%` }}
              ></div>
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow"
                style={{ left: `calc(${audioProgress}% - 6px)` }}
              ></div>
            </div>
            <div className="text-white/60 text-xs mt-1">
              {formatDuration(Math.floor(currentTimeSec))} / {formatDuration(Math.floor(totalDurationSec || currentSong.duration || 0))}
            </div>
          </div>
          
          {isLoading && (
            <div className="text-white/50 text-xs mb-2">Buffering…</div>
          )}
          <div className="rounded-xl overflow-hidden text-white/50 text-sm">
            {currentSong.previewUrl ? 'Playing preview' : 'No preview available'}
            <audio ref={audioRef} style={{ display: 'none' }} preload="metadata"></audio>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SHARE MODAL COMPONENT =====
function ShareModal({ artist, showShareModal, setShowShareModal }) {
  const { showToast } = useApp();

  useEffect(() => {
    if (!showShareModal) return;
    const handleEsc = (e) => {
      if (e.key === 'Escape') setShowShareModal(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [showShareModal, setShowShareModal]);

  if (!showShareModal || !artist) return null;

  const shareUrl = `${window.location.origin}/artist/${slugify(artist.name)}`;
  const shareText = `Check out ${artist.name} on MusicBae! ${artist.bio}`;

  const shareOptions = [
    {
      name: 'Copy Link',
      icon: '📋',
      action: async () => {
        try {
          await navigator.clipboard.writeText(shareUrl);
          showToast('Link copied to clipboard! 📋');
          setShowShareModal(false);
        } catch (error) {
          showToast('Failed to copy link', 'error');
        }
      }
    },
    {
      name: 'Twitter',
      icon: '🐦',
      action: () => {
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank');
        setShowShareModal(false);
      }
    },
    {
      name: 'Facebook',
      icon: '📘',
      action: () => {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        window.open(url, '_blank');
        setShowShareModal(false);
      }
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      action: () => {
        const url = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
        window.open(url, '_blank');
        setShowShareModal(false);
      }
    },
    {
      name: 'Email',
      icon: '📧',
      action: () => {
        const subject = encodeURIComponent(`${artist.name} on MusicBae`);
        const body = encodeURIComponent(`${shareText}\n\n${shareUrl}`);
        const url = `mailto:?subject=${subject}&body=${body}`;
        window.open(url);
        setShowShareModal(false);
      }
    }
  ];

  return (
    <div className="fixed inset-0 z-50 backdrop">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowShareModal(false)}></div>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="glass-dark rounded-2xl p-8 max-w-md w-full animate-slideInUp">
          <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={() => setShowShareModal(false)}>✕</button>
          
          <div className="text-center mb-6">
            <div className="text-4xl mb-4">📤</div>
            <h3 className="text-2xl font-bold text-white mb-2">Share {artist.name}</h3>
            <p className="text-white/60">Choose how you'd like to share this artist</p>
          </div>

          <div className="space-y-3">
            {shareOptions.map(option => (
              <button
                key={option.name}
                className="w-full flex items-center gap-4 p-4 rounded-lg hover:bg-white/10 transition-all text-left"
                onClick={option.action}
              >
                <span className="text-2xl">{option.icon}</span>
                <span className="text-white font-medium">{option.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Navigation components are now defined at the top of the file

// Duplicate function removed - defined at top of file

// Orphaned JSX fragments removed

// Duplicate function removed - defined at top of file

// ===== SITE FOOTER (Top-level) =====
function SiteFooter({ goTo, isMobile, setMenuOpen }) {
  const linkClass = "text-white/70 hover:text-white transition-colors";
  const sectionTitle = "text-white font-semibold mb-3";
  const year = new Date().getFullYear();

  const footerLinks = [
    { label: 'Terms & Conditions', key: 'terms' },
    { label: 'Privacy Policy', key: 'privacy' },
    { label: 'Refund Policy', key: 'refunds' },
    { label: 'Report Copyright Infringement', key: 'dmca' },
    { label: 'Careers', key: 'careers' }
  ];

  if (isMobile) {
    return (
      <footer className="mt-12 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-white/60 text-sm">© {year} MusicBae — All rights reserved</div>
            <button className="btn btn-ghost" onClick={()=> setMenuOpen(true)}>Menu</button>
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className="mt-20 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <div className="text-2xl font-space font-bold text-white mb-2">MusicBae</div>
          <p className="text-white/60">Unreleased music, direct support, real connection.</p>
        </div>
        <div>
          <div className={sectionTitle}>Explore</div>
          <ul className="space-y-2">
            <li><button className={linkClass} onClick={()=>goTo('home')}>Home</button></li>
            <li><button className={linkClass} onClick={()=>goTo('artists')}>Artists</button></li>
            <li><button className={linkClass} onClick={()=>goTo('about')}>About</button></li>
            <li><button className={linkClass} onClick={()=>goTo('contact')}>Contact</button></li>
          </ul>
        </div>
        <div>
          <div className={sectionTitle}>Legal</div>
          <ul className="space-y-2">
            {footerLinks.slice(0,3).map(l => (
              <li key={l.key}><button className={linkClass} onClick={()=>goTo(l.key)}>{l.label}</button></li>
            ))}
          </ul>
        </div>
        <div>
          <div className={sectionTitle}>More</div>
          <ul className="space-y-2">
            {footerLinks.slice(3).map(l => (
              <li key={l.key}><button className={linkClass} onClick={()=>goTo(l.key)}>{l.label}</button></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-white/60">
          <div>© {year} MusicBae — All rights reserved</div>
          <div className="flex items-center gap-4">
            <span>Built with ❤️ for artists</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ===== MODERN LANDING PAGE =====
function ModernLandingPage() {
  const { setCurrentPage, showToast } = useApp();
  
  const handleJoin = () => {
    setCurrentPage('register');
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
              onClick={() => setCurrentPage('register-fan')}
            >
              Join as Fan
            </button>
          </div>
          
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: 'Artists', value: '500+', icon: '🎤' },
              { label: 'Songs', value: '2,000+', icon: '🎵' }
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
                    <span className="text-3xl">{artist.picture || '🎵'}</span>
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

// ===== MODERN ARTISTS DISCOVERY PAGE =====
function ModernArtistsPage({ goTo }) {
  const { showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popular');

  // Get all artists
  const allArtists = mockDB.users.filter(user => user.role === 'artist');
  
  // Filter and sort artists
  const filteredArtists = allArtists
    .filter(artist => {
      const matchesSearch = artist.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           artist.bio.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGenre = selectedGenre === 'all' || artist.genres?.includes(selectedGenre);
      return matchesSearch && matchesGenre;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return b.followers - a.followers;
        case 'newest':
          return new Date(b.id) - new Date(a.id);
        case 'tips':
          return b.totalTips - a.totalTips;
        default:
          return 0;
      }
    });

  // Get unique genres
  const genres = ['all', ...new Set(allArtists.flatMap(artist => artist.genres || []))];

  const handleArtistClick = (artist) => {
    // Store the selected artist in localStorage for the profile page
    localStorage.setItem('selectedArtist', JSON.stringify(artist));
    goTo('artist-profile', slugify(artist.name));
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 animated-bg opacity-10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10 pt-20 pb-24 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <section className="text-center mb-12">
          <h1 className="text-5xl md:text-7xl font-space font-bold mb-6">
            <span className="gradient-primary bg-clip-text text-transparent">Discover</span>
            <span className="text-white"> Artists</span>
          </h1>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Find your next favorite artist and support their unreleased music
          </p>
          
          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Search Bar */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search artists by name or bio..."
                className="input w-full pl-12 pr-4 text-lg"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-xl">🔍</span>
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-4 justify-center">
              {/* Genre Filter */}
              <div className="flex items-center gap-2">
                <span className="text-white/60">Genre:</span>
                <select
                  className="input bg-transparent border-white/20"
                  value={selectedGenre}
                  onChange={(e) => setSelectedGenre(e.target.value)}
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre} className="bg-dark">
                      {genre === 'all' ? 'All Genres' : genre}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sort Filter */}
              <div className="flex items-center gap-2">
                <span className="text-white/60">Sort by:</span>
                <select
                  className="input bg-transparent border-white/20"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="popular" className="bg-dark">Most Popular</option>
                  <option value="newest" className="bg-dark">Newest</option>
                  <option value="tips" className="bg-dark">Most Tips</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Artists Grid */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold text-white">
              {filteredArtists.length} Artist{filteredArtists.length !== 1 ? 's' : ''} Found
            </h2>
            <div className="text-white/60">
              Showing {filteredArtists.length} of {allArtists.length} artists
            </div>
          </div>
          
          {filteredArtists.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-2xl font-bold text-white mb-2">No artists found</h3>
              <p className="text-white/60">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredArtists.map(artist => (
                <div
                  key={artist.id}
                  className="card cursor-pointer hover:scale-105 transition-all group"
                  onClick={() => handleArtistClick(artist)}
                >
                  {/* Artist Image */}
                  <div className="w-full aspect-square gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <span className="text-4xl">{artist.picture || '🎵'}</span>
                  </div>
                  
                  {/* Artist Info */}
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <h3 className="text-xl font-bold text-white">{artist.name}</h3>
                      {artist.verified && (
                        <span className="text-primary text-sm">✓</span>
                      )}
                    </div>
                    
                    <p className="text-white/60 text-sm mb-4 line-clamp-2">
                      {artist.bio}
                    </p>
                    
                    {/* Genres */}
                    <div className="flex flex-wrap gap-1 justify-center mb-4">
                      {artist.genres?.slice(0, 2).map(genre => (
                        <span
                          key={genre}
                          className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/80"
                        >
                          {genre}
                        </span>
                      ))}
                      {artist.genres?.length > 2 && (
                        <span className="px-2 py-1 bg-white/10 rounded-full text-xs text-white/60">
                          +{artist.genres.length - 2}
                        </span>
                      )}
                    </div>
                    
                    {/* Stats */}
                    <div className="grid grid-cols-1 text-center">
                      <div>
                        <div className="text-lg font-bold text-white">{mockDB.songs.filter(song => song.artistId === artist.id).length}</div>
                        <div className="text-xs text-white/60">Songs</div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        className="flex-1 btn btn-primary text-sm py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Following ${artist.name}! 🎵`);
                        }}
                      >
                        Follow
                      </button>
                      <button
                        className="flex-1 btn btn-outline text-sm py-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          showToast(`Viewing ${artist.name}'s music! 🎵`);
                        }}
                      >
                        Music
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="text-center mt-20">
          <div className="card max-w-2xl mx-auto">
            <h2 className="text-3xl font-space font-bold mb-4">Are You an Artist?</h2>
            <p className="text-white/70 mb-6">Join thousands of artists already earning from their unreleased music</p>
            <button
              className="btn btn-primary text-lg px-8 py-4"
              onClick={() => goTo('register')}
            >
              Start Creating Now
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}

// ===== MODERN ARTIST PROFILE PAGE =====
function ModernArtistProfilePage({ artistSlug, goTo }) {
  const { showToast, setCurrentSong, setIsPlaying, setAudioProgress, setShowPlayerModal, setShowTipModal, setTipTarget, setTipType, setTipAmount } = useApp();
  const [activeTab, setActiveTab] = useState('music');
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [artist, setArtist] = useState(null);
  const [artistSongs, setArtistSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      setLoadError('');
      try {
        // Try direct fetch by slug/id
        const data = await api.getArtist(artistSlug);
        if (isMounted) {
          setArtist(data.artist || null);
          setArtistSongs(data.songs || []);
          if (data.artist && typeof data.artist.isFollowing === 'boolean') {
            setIsFollowing(!!data.artist.isFollowing);
          }
        }
      } catch (e) {
        // Fallback: search by slug words
        try {
          const q = decodeURIComponent(artistSlug.replace(/-/g, ' '));
          const res = await api.searchUsers({ q, role: 'artist', limit: 1 });
          const first = res.users && res.users[0];
          if (first && first._id) {
            const d2 = await api.getArtist(first._id);
            if (isMounted) {
              setArtist(d2.artist || null);
              setArtistSongs(d2.songs || []);
              if (d2.artist && typeof d2.artist.isFollowing === 'boolean') {
                setIsFollowing(!!d2.artist.isFollowing);
              }
            }
          } else {
            throw new Error('Artist not found');
          }
        } catch (err) {
          if (isMounted) setLoadError('Artist not found');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => { isMounted = false; };
  }, [artistSlug]);

  // Handle scrolling to specific song when URL has hash
  useEffect(() => {
    if (!loading && artistSongs.length > 0) {
      const hash = window.location.hash;
      if (hash && hash.startsWith('#song-')) {
        // Wait a bit for the DOM to be fully rendered
        setTimeout(() => {
          const songElement = document.querySelector(hash);
          if (songElement) {
            songElement.scrollIntoView({ 
              behavior: 'smooth', 
              block: 'center' 
            });
            // Add a subtle highlight effect
            songElement.style.transition = 'all 0.3s ease';
            songElement.style.transform = 'scale(1.02)';
            songElement.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.5)';
            setTimeout(() => {
              songElement.style.transform = 'scale(1)';
              songElement.style.boxShadow = '';
            }, 2000);
          }
        }, 500);
      }
    }
  }, [loading, artistSongs]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="spinner"></div>
      </div>
    );
  }

  if (loadError || !artist) {
    return <div className="min-h-screen flex items-center justify-center text-white text-2xl">{loadError || 'Artist not found'}</div>;
  }

  const handleFollow = async () => {
    // Require auth for follow/unfollow
    if (!api.isAuthenticated?.()) {
      showToast('Please log in to follow artists', 'error');
      return;
    }
    if (isFollowPending) return;
    setIsFollowPending(true);
    const wasFollowing = isFollowing;
    try {
      const isValidObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
      let artistId = artist._id || artist.id;
      if (!isValidObjectId(artistId)) {
        // Resolve id by name
        const res = await api.searchUsers({ q: artist.name, role: 'artist', limit: 1 });
        artistId = res.users && res.users[0]?._id;
      }
      if (!artistId) throw new Error('Unable to resolve artist');

      // Optimistic UI update
      const next = !wasFollowing;
      setIsFollowing(next);
      if (typeof artist.followers === 'number') {
        artist.followers = Math.max(0, Number(artist.followers) + (next ? 1 : -1));
      }
      if (next) {
        showToast(`Following ${artist.name}! 👥`);
      } else {
        showToast(`Unfollowed ${artist.name} 👋`);
      }

      // Server call
      const resp = next ? await api.followArtist(artistId) : await api.unfollowArtist(artistId);
      if (resp && typeof resp.isFollowing === 'boolean') {
        setIsFollowing(resp.isFollowing);
      }

      // Refresh user snapshot in background so other pages stay in sync
      try {
        const me = await api.getProfile();
        if (me && me.user) {
          window.updateUser?.(me.user);
        }
      } catch (_) {}
    } catch (e) {
      // Revert optimistic update
      setIsFollowing(wasFollowing);
      if (typeof artist.followers === 'number') {
        artist.followers = Math.max(0, Number(artist.followers) + (wasFollowing ? 0 : 0) + (wasFollowing ? 0 : 0));
        // Correct follower count revert
        artist.followers = Math.max(0, Number(artist.followers) + (wasFollowing ? 0 : 0));
      }
      console.error('Follow toggle error:', e);
      showToast('Unable to update follow status', 'error');
    } finally {
      setIsFollowPending(false);
    }
  };

  const handleTip = () => {
    setShowPlayerModal(false); // Close player modal if open
    setTipTarget(artist);
    setTipType('artist');
    setTipAmount(5); // Default $5
    setShowTipModal(true);
  };

  const handleShare = () => {
    setShowPlayerModal(false); // Close player modal if open
    setShowShareModal(true);
  };

  const handlePlaySong = (song) => {
    try {
      if (!song || !song.title) {
        console.error('Invalid song data:', song);
        showToast('Error: Invalid song data', 'error');
        return;
      }
      // Normalize cover and pick preview source
      const cover = song.cover?.startsWith('http') ? song.cover : (song.cover ? api.getFileURL(song.cover) : '');
      const previewRaw = song.previewSong || song.previewUrl || '';
      const preview = previewRaw.startsWith('http') ? previewRaw : (previewRaw ? api.getFileURL(previewRaw) : '');
      const playableSong = { ...song, cover, previewUrl: preview };

      setShowTipModal(false); // Close tip modal if open
      setCurrentSong(playableSong);
      setIsPlaying(false);
      setAudioProgress(0);
      setShowPlayerModal(true);
      showToast(`Now playing: ${song.title} by ${artist.name}! 🎵`);
    } catch (error) {
      console.error('Error playing song:', error);
      showToast('Error playing song', 'error');
    }
  };

  const handleTipSong = (song) => {
    setShowPlayerModal(false); // Close player modal if open
    // Add artist reference to song for the modal
    const songWithArtist = { ...song, artist: artist };
    setTipTarget(songWithArtist);
    setTipType('song');
    setTipAmount(5); // Default $5
    setShowTipModal(true);
  };

  const handleShareSong = (song) => {
    try {
      // Create a unique ID for the song using song ID and title
      const songId = `song-${song.id || song._id || song.title.toLowerCase().replace(/\s+/g, '-')}`;
      
      // Create the shareable URL with song anchor
      const currentUrl = window.location.href.split('#')[0]; // Remove any existing hash
      const songUrl = `${currentUrl}#${songId}`;
      
      // Copy to clipboard
      navigator.clipboard.writeText(songUrl).then(() => {
        showToast(`Link to "${song.title}" copied to clipboard! 📤`, 'success');
      }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = songUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showToast(`Link to "${song.title}" copied to clipboard! 📤`, 'success');
      });
    } catch (error) {
      console.error('Error sharing song:', error);
      showToast('Error sharing song', 'error');
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 animated-bg opacity-10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-12 px-4">
          <div className="max-w-6xl mx-auto">
            {/* Back Button */}
            <button
              onClick={() => goTo('artists')}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-all mb-8"
            >
              <span className="text-xl">←</span>
              <span>Back to Artists</span>
            </button>

            {/* Artist Header */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 items-center">
              {/* Artist Image */}
              <div className="md:col-span-1">
                <div className="w-48 h-48 gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 overflow-hidden">
                  <img 
                    src={getAvatarURL(artist.avatar)} 
                    alt={artist.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                  <div className="w-full h-full flex items-center justify-center text-6xl" style={{display: 'none'}}>
                    🎵
                  </div>
                </div>
              </div>

              {/* Artist Info */}
              <div className="md:col-span-2">
                <div className="flex items-center gap-3 mb-2 md:mb-4">
                  <h1 className="text-3xl sm:text-4xl md:text-6xl font-space font-bold text-white leading-tight">
                    {artist.name}
                  </h1>
                  <span className="text-primary text-xl md:text-2xl">✓</span>
                </div>
                <p className="text-base sm:text-lg md:text-xl text-white/70 mb-4 md:mb-6 max-w-2xl">
                  {artist.bio}
                </p>

                {/* Genres - extract from songs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {Array.from(new Set(artistSongs.map(song => song.genre))).map(genre => (
                    <span
                      key={genre}
                      className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80"
                    >
                      {genre}
                    </span>
                  ))}
                </div>

                {/* Stats removed: no song count */}

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-3 md:gap-4">
                  <button
                    className={`btn ${isFollowing ? 'btn-outline' : 'btn-primary'} text-sm md:text-lg px-5 md:px-8 py-2 md:py-3 ${isFollowPending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    onClick={handleFollow}
                    disabled={isFollowPending}
                  >
                    {isFollowing ? 'Unfollow' : 'Follow'}
                  </button>
                  <button
                    className="btn btn-secondary text-sm md:text-lg px-5 md:px-8 py-2 md:py-3"
                    onClick={handleTip}
                  >
                    Tip Artist
                  </button>
                  <button
                    className="btn btn-ghost text-sm md:text-lg px-5 md:px-8 py-2 md:py-3"
                    onClick={handleShare}
                  >
                    Share
                  </button>
                </div>

                {/* Social & Streaming Links - Hidden from public view to keep users on MusicBae */}
              </div>
            </div>
          </div>
        </section>

        {/* Tabs Section */}
        <section className="px-4 pb-12">
          <div className="max-w-6xl mx-auto">
            {/* Tab Navigation */}
            <div className="flex flex-wrap border-b border-white/10 mb-6 md:mb-8 gap-2">
              {[
                { key: 'music', label: 'Music', icon: '🎵' },
                { key: 'about', label: 'About', icon: 'ℹ️' },
                { key: 'stats', label: 'Stats', icon: '📊' }
              ].map(tab => (
                <button
                  key={tab.key}
                   className={`flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b-2 transition-all text-sm md:text-base ${
                    activeTab === tab.key
                      ? 'border-primary text-primary'
                      : 'border-transparent text-white/60 hover:text-white'
                  }`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  <span>{tab.icon}</span>
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
              {activeTab === 'music' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Latest Releases</h2>
                  {artistSongs.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🎵</div>
                      <h3 className="text-xl font-bold text-white mb-2">No songs yet</h3>
                      <p className="text-white/60">This artist hasn't uploaded any songs yet.</p>
                    </div>
                  ) : (
                    <div className="grid gap-4">
                      {artistSongs.map(song => (
                        <div 
                          key={song.id} 
                          id={`song-${song.id || song._id || song.title.toLowerCase().replace(/\s+/g, '-')}`}
                          className="card p-4 md:p-6"
                        >
                          <div className="flex md:flex-row flex-col md:items-center gap-3 md:gap-4">
                            {/* Song Cover */}
                            <div className="w-full aspect-square md:w-16 md:h-16 gradient-primary rounded-lg flex items-center justify-center overflow-hidden">
                              <img 
                                src={song.cover} 
                                alt={song.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                              <div className="w-full h-full flex items-center justify-center text-2xl" style={{display: 'none'}}>
                                🎵
                              </div>
                            </div>

                            {/* Song Info */}
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg md:text-xl font-bold text-white mt-2 md:mt-0 mb-1 truncate">{song.title}</h3>
                              {/* On mobile show short description or genre */}
                              <p className="md:hidden text-white/70 text-sm mb-2">
                                {(() => {
                                  const raw = (song.description || song.genre || '');
                                  const words = String(raw).split(/\s+/).slice(0, 10).join(' ');
                                  return words + (raw && raw.split(/\s+/).length > 10 ? '…' : '');
                                })()}
                              </p>
                              {/* Desktop meta line */}
                              <div className="hidden md:flex items-center gap-2 md:gap-4 text-xs md:text-sm text-white/60">
                                <span>{formatDuration(song.duration)}</span>
                                <span>•</span>
                                <span>{song.genre}</span>
                                <span>•</span>
                                <span>{formatNumber(song.plays)} plays</span>
                              </div>

                              {/* Mobile action buttons under text */}
                              <div className="grid grid-cols-3 gap-2 mt-2 md:hidden">
                                <button className="btn btn-primary text-sm" onClick={() => handlePlaySong(song)}>▶️ Play</button>
                                <button className="btn btn-outline text-sm" onClick={() => handleTipSong(song)}>💰 Tip</button>
                                <button className="btn btn-ghost text-sm hover:bg-white/20 transition-all" onClick={() => handleShareSong(song)} title={`Share "${song.title}"`}>📤 Share</button>
                              </div>
                            </div>

                            {/* Desktop action buttons on the right */}
                            <div className="hidden md:flex gap-2">
                              <button
                                className="btn btn-primary text-sm md:text-base"
                                onClick={() => handlePlaySong(song)}
                              >
                                ▶️ Play
                              </button>
                              <button
                                className="btn btn-outline text-sm md:text-base"
                                onClick={() => handleTipSong(song)}
                              >
                                💰 Tip
                              </button>
                              <button
                                className="btn btn-ghost text-sm md:text-base hover:bg-white/20 transition-all"
                                onClick={() => handleShareSong(song)}
                                title={`Share "${song.title}"`}
                              >
                                📤 Share
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'about' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">About {artist.name}</h2>
                  <div className="card p-8">
                    <p className="text-white/80 text-lg leading-relaxed mb-6">
                      {artist.bio}
                    </p>
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4">Genres</h3>
                        <div className="flex flex-wrap gap-2">
                          {Array.from(new Set(artistSongs.map(song => song.genre))).map(genre => (
                            <span
                              key={genre}
                              className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80"
                            >
                              {genre}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-4">Contact</h3>
                        <p className="text-white/60">Email: {artist.email}</p>
                        <p className="text-white/60">Status: Independent Artist</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'stats' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6">Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="card text-center">
                      <div className="text-3xl mb-2">🎯</div>
                      <div className="text-2xl font-bold text-white mb-1">{formatNumber(artistSongs.reduce((total, song) => total + song.plays, 0))}</div>
                      <div className="text-white/60">Total Plays</div>
                    </div>
                    <div className="card text-center">
                      <div className="text-3xl mb-2">⭐</div>
                      <div className="text-2xl font-bold text-white mb-1">Independent</div>
                      <div className="text-white/60">Artist Status</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      
      {/* Modals */}
      <ShareModal 
        artist={artist} 
        showShareModal={showShareModal} 
        setShowShareModal={setShowShareModal} 
      />
    </main>
  );
}

// ===== MODERN AUTHENTICATION =====
function ModernAuthForm({ type, userType, goTo }) {
  const { setUser, setCurrentPage, showToast, playMicroSound, launchConfetti } = useApp();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', bio: '', picture: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      let data;
      if (type === 'login') {
        data = await api.login({
          email: formData.email,
          password: formData.password,
          role: userType
        });
      } else {
        data = await api.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          bio: formData.bio,
          picture: formData.picture,
          role: userType
        });
      }
      if (!data || !data.token) {
        throw new Error('Invalid credentials or registration failed');
      }
      setUser(data.user || data);
      showToast(`${type === 'login' ? 'Welcome back' : 'Welcome to MusicBae'}! 🎵`);
      // Microinteractions
      playMicroSound(type === 'login' ? 'login' : 'signup');
      if (type !== 'login') launchConfetti();
      // Check for tip modal redirect
      const loginRedirect = localStorage.getItem('loginRedirect');
      if (loginRedirect === 'tip') {
        localStorage.removeItem('loginRedirect');
        const tipTarget = localStorage.getItem('tipTarget');
        const tipType = localStorage.getItem('tipType');
        if (tipTarget && tipType) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent('openTipModalAfterAuth', {
              detail: {
                tipTarget: JSON.parse(tipTarget),
                tipType: tipType
              }
            }));
            localStorage.removeItem('tipTarget');
            localStorage.removeItem('tipType');
          }, 100);
        }
        goTo('home');
      } else {
        goTo('dashboard');
      }
    } catch (error) {
      setError(error.message || 'Login/registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      {/* Background Elements */}
      <div className="absolute inset-0 animated-bg opacity-10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="w-full max-w-md relative z-10">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">{userType === 'artist' ? '🎤' : '👤'}</span>
            </div>
            <h2 className="text-3xl font-space font-bold">
              {type === 'login' ? 'Welcome Back' : 'Join MusicBae'}
            </h2>
            <p className="text-white/60 mt-2">
              {type === 'login' ? 'Sign in to your account' : `Create your ${userType} account`}
            </p>
            <div className="mt-4">
              <span className={`px-3 py-1 rounded-full text-sm ${
                userType === 'artist' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-blue-500/20 text-blue-400'
              }`}>
                {userType === 'artist' ? '🎤 Artist' : '👤 Fan'}
              </span>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 text-red-400 rounded p-3 text-center font-medium">
                {error}
              </div>
            )}
            
            {type === 'register' && (
              <div>
                <label className="block text-white/90 mb-2 font-medium">Name</label>
                <input
                  type="text"
                  required
                  className="input w-full"
                  placeholder="Your name"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                />
              </div>
            )}
            
            <div>
              <label className="block text-white/90 mb-2 font-medium">Email</label>
              <input
                type="email"
                required
                className="input w-full"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
              />
            </div>
            
            <div>
              <label className="block text-white/90 mb-2 font-medium">Password</label>
              <input
                type="password"
                required
                className="input w-full"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
              />
            </div>
            
            {type === 'register' && userType === 'artist' && (
              <>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Profile Picture</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="🎧 (emoji or URL)"
                    value={formData.picture}
                    onChange={(e) => setFormData({...formData, picture: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Bio</label>
                  <textarea
                    className="input w-full resize-none"
                    rows="3"
                    placeholder="Tell us about your music..."
                    value={formData.bio}
                    onChange={(e) => setFormData({...formData, bio: e.target.value})}
                  />
                </div>
              </>
            )}
            
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full text-lg py-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  {type === 'login' ? 'Signing in...' : 'Creating account...'}
                </span>
              ) : (
                type === 'login' ? 'Sign In' : 'Create Account'
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <button
              className="text-white/60 hover:text-white transition-all block"
              onClick={() => {
                if (type === 'login') {
                  // If currently on login page, go to register
                  goTo(userType === 'artist' ? 'register-artist' : 'register');
                } else {
                  // If currently on register page, go to login
                  goTo(userType === 'artist' ? 'login-artist' : 'login');
                }
              }}
            >
              {type === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
            <button
              className="text-white/40 hover:text-white/60 transition-all text-sm"
              onClick={() => {
                const newUserType = userType === 'artist' ? 'fan' : 'artist';
                const newType = type === 'login' ? 'login' : 'register';
                const newRoute = newType === 'login' ? 
                  (newUserType === 'artist' ? 'login-artist' : 'login') :
                  (newUserType === 'artist' ? 'register-artist' : 'register');
                goTo(newRoute);
              }}
            >
              Switch to {userType === 'artist' ? 'Fan' : 'Artist'} {type === 'login' ? 'Login' : 'Registration'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SUPER ADMIN DASHBOARD PAGE =====
function SuperAdminDashboard({ goTo }) {
  const { user, showToast } = useApp();
  const [tab, setTab] = React.useState('overview');
  const [users, setUsers] = React.useState([]);
  const [userRoleFilter, setUserRoleFilter] = React.useState('');
  const [userQuery, setUserQuery] = React.useState('');
  const [stats, setStats] = React.useState(null);
  const [songs, setSongs] = React.useState({ list: [], pagination: null, q: '' });
  const [tips, setTips] = React.useState({ list: [], pagination: null, status: '' });
  const [withdrawals, setWithdrawals] = React.useState({ list: [], pagination: null, status: '', method: '' });
  const [loading, setLoading] = React.useState(true);
  const [selectedUser, setSelectedUser] = React.useState(null);
  const [editWallet, setEditWallet] = React.useState(null);
  const [walletAmount, setWalletAmount] = React.useState(0);
  const [homeDraft, setHomeDraft] = React.useState(null);
  const [isSavingHome, setIsSavingHome] = React.useState(false);
  const [homeTexts, setHomeTexts] = React.useState(null);
  const [isSavingTexts, setIsSavingTexts] = React.useState(false);
  const [editModal, setEditModal] = React.useState({ open: false, key: '', label: '', type: 'text', value: '' });
  const [isSavingEdit, setIsSavingEdit] = React.useState(false);
  const [confirmModal, setConfirmModal] = React.useState({ open: false, title: '', description: '', onConfirm: null });
  const [payments, setPayments] = React.useState(null);

  function sanitizePaymentsBeforeSave(p) {
    const out = { stripe:{}, paypal:{}, venmo:{}, wise:{} };
    if (p?.stripe) {
      out.stripe.enabled = !!p.stripe.enabled;
      if (typeof p.stripe.publishableKey === 'string') out.stripe.publishableKey = p.stripe.publishableKey.trim();
      if (typeof p.stripe.secretKey === 'string') out.stripe.secretKey = p.stripe.secretKey.trim();
      if (typeof p.stripe.webhookSecret === 'string') out.stripe.webhookSecret = p.stripe.webhookSecret.trim();
    }
    if (p?.paypal) {
      out.paypal.enabled = !!p.paypal.enabled;
      out.paypal.mode = (p.paypal.mode === 'live' ? 'live' : 'sandbox');
      if (typeof p.paypal.clientId === 'string') out.paypal.clientId = p.paypal.clientId.trim();
      if (typeof p.paypal.clientSecret === 'string') out.paypal.clientSecret = p.paypal.clientSecret.trim();
    }
    if (p?.venmo) { out.venmo.enabled = !!p.venmo.enabled; }
    if (p?.wise) { out.wise.enabled = !!p.wise.enabled; }
    return out;
  }

  React.useEffect(() => {
    if (user?.role === 'superadmin') {
      fetchUsers();
      fetchStats();
      fetchSongs();
      fetchTips();
      fetchWithdrawals();
      fetchSummary();
    }
  }, [user]);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.request('/users/superadmin/all', { headers: api.getHeaders() });
      setUsers(Array.isArray(res) ? res : []);
    } catch (e) {
      showToast('Failed to fetch users', 'error');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStats() {
    try {
      const res = await api.request('/superadmin/stats', { headers: api.getHeaders() });
      setStats(res || {});
    } catch (e) {
      showToast('Failed to fetch stats', 'error');
      setStats({});
    }
  }

  const [summary, setSummary] = React.useState(null);
  async function fetchSummary() {
    try { 
      const res = await api.request('/superadmin/summary', { headers: api.getHeaders() }); 
      setSummary(res || {}); 
    } catch(_) {
      setSummary({});
    }
  }

  async function fetchSongs(page=1) {
    try {
      const res = await api.request(`/songs/superadmin/all?page=${page}&limit=25&search=${encodeURIComponent(songs.q || '')}`, { headers: api.getHeaders() });
      setSongs(prev => ({ ...prev, list: res.songs || [], pagination: res.pagination || {} }));
    } catch (e) {
      showToast('Failed to fetch songs', 'error');
      setSongs(prev => ({ ...prev, list: [], pagination: {} }));
    }
  }

  async function fetchTips(page=1) {
    try {
      const res = await api.getUserTips({ page, limit: 25, type: 'sent' });
      setTips(prev => ({ ...prev, list: res.tips || [], pagination: res.pagination || {} }));
    } catch (e) {
      showToast('Failed to fetch tips', 'error');
      setTips(prev => ({ ...prev, list: [], pagination: {} }));
    }
  }

  async function fetchWithdrawals(page=1) {
    try {
      const res = await api.getWalletTransactions({ page, limit: 25 });
      setWithdrawals(prev => ({ ...prev, list: res.transactions || [], pagination: res.pagination || {} }));
    } catch (e) {
      showToast('Failed to fetch withdrawals', 'error');
      setWithdrawals(prev => ({ ...prev, list: [], pagination: {} }));
    }
  }

  async function handleDeleteUser(id) {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.request(`/users/superadmin/user/${id}`, { method: 'DELETE', headers: api.getHeaders() });
      showToast('User deleted');
      fetchUsers();
    } catch (e) {
      showToast('Failed to delete user', 'error');
    }
  }

  async function handleUpdateWallet(id) {
    try {
      await api.saSetWallet(id, walletAmount);
      showToast('Wallet updated');
      setEditWallet(null);
      fetchUsers();
    } catch (e) {
      showToast('Failed to update wallet', 'error');
    }
  }

  if (!user || user.role !== 'superadmin') {
    return <div className="pt-20 pb-24 px-4 text-center"><h1 className="text-4xl font-space font-bold mb-8">Access Denied</h1><p className="text-white/70 mb-6">Super Admins only</p></div>;
  }

  return (
    <div className="pt-20 pb-24 px-4 max-w-7xl mx-auto">
      <h1 className="text-4xl font-space font-bold mb-8">Super Admin Dashboard</h1>
      <div className="mb-8 flex gap-2 flex-wrap">
        <button className={`btn ${tab==='overview'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('overview')}>Overview</button>
        <button className={`btn ${tab==='users'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('users')}>Users</button>
        <button className={`btn ${tab==='songs'?'btn-primary':'btn-ghost'}`} onClick={()=>{setTab('songs'); fetchSongs(1);}}>Songs</button>
        <button className={`btn ${tab==='tips'?'btn-primary':'btn-ghost'}`} onClick={()=>{setTab('tips'); fetchTips(1);}}>Tips</button>
        <button className={`btn ${tab==='security'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('security')}>Security</button>
        <button className={`btn ${tab==='withdrawals'?'btn-primary':'btn-ghost'}`} onClick={()=>{setTab('withdrawals'); fetchWithdrawals(1);}}>Withdrawals</button>
        <button className={`btn ${tab==='maintenance'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('maintenance')}>Maintenance</button>
        <button className={`btn ${tab==='stats'?'btn-primary':'btn-ghost'}`} onClick={()=>setTab('stats')}>Site Stats</button>
        <button className={`btn ${tab==='homepage'?'btn-primary':'btn-ghost'}`} onClick={async()=>{
          setTab('homepage');
          try {
            const [res, txt] = await Promise.allSettled([api.saGetHomepage(), api.saGetHomepageTexts()]);
            setHomeDraft(res.status==='fulfilled' ? (res.value.homepage||{}) : {});
            setHomeTexts(txt.status==='fulfilled' ? (txt.value.texts||{}) : {});
          } catch(_) { setHomeDraft({}); setHomeTexts({}); }
        }}>Homepage</button>
        <button className={`btn ${tab==='payments'?'btn-primary':'btn-ghost'}`} onClick={async()=>{
          setTab('payments');
          try { const cfg = await api.saGetPaymentsConfig(); setPayments(cfg); } catch(_) { setPayments(null); }
        }}>Payments</button>
      </div>

      {tab==='overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {[
              { label: 'Users', value: formatNumber(summary?.metrics?.totalUsers ?? 0), icon: '👥' },
              { label: 'Artists', value: formatNumber(summary?.metrics?.artistCount ?? 0), icon: '🎤' },
              { label: 'Fans', value: formatNumber(summary?.metrics?.fanCount ?? 0), icon: '🎧' },
              { label: 'Songs', value: formatNumber(summary?.metrics?.songsCount ?? 0), icon: '🎵' },
              { label: 'Tips (gross)', value: formatCurrency(summary?.metrics?.tipsGrossUsd||0), icon: '💸' },
              { label: 'Pending withdrawals', value: formatNumber(summary?.metrics?.withdrawalsPendingCount ?? 0), icon: '⏳' }
            ].map((m,i)=> (
              <div key={i} className="card p-4">
                <div className="text-white/60 text-sm mb-1">{m.label}</div>
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold text-white">{m.value}</div>
                  <div className="text-2xl">{m.icon}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-bold">Latest users</h3><span className="text-white/50 text-sm">{formatNumber(summary?.metrics?.onlineUsers||0)} online users</span></div>
              <div className="divide-y divide-white/5">
                {(summary?.latestUsers||[]).map(u => (
                  <div key={u.id} className="py-2 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{u.name}</div>
                      <div className="text-white/50 text-sm">{u.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${u.isActive?'bg-green-500/20 text-green-400':'bg-white/10 text-white/60'}`}>{u.isActive?'Active':'Disabled'}</span>
                      <span className="px-2 py-0.5 rounded text-xs bg-white/10 text-white/60">{u.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3"><h3 className="text-lg font-bold">Latest payments</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead><tr className="border-b border-white/10"><th>User</th><th>Detail</th><th>Amount</th><th>Type</th><th>Date</th></tr></thead>
                  <tbody>
                    {(summary?.latestPayments||[]).map(p => (
                      <tr key={p.id} className="border-b border-white/5">
                        <td>{p.user}</td>
                        <td>{p.detail}</td>
                        <td>{formatCurrency(p.amount||0)}</td>
                        <td className="uppercase text-white/60 text-sm">{p.type}</td>
                        <td className="text-white/50 text-sm">{new Date(p.createdAt).toLocaleString?.()||''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      {tab==='payments' && (
        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Payment Gateways</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="card p-4">
              <h3 className="font-bold mb-3">Stripe</h3>
              <label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={!!payments?.stripe?.enabled} onChange={e=>setPayments(p=>({...p, stripe:{...(p?.stripe||{}), enabled:e.target.checked}}))} /> Enable Stripe</label>
              <input className="input mb-2" placeholder="Publishable Key" value={payments?.stripe?.publishableKey||''} onChange={e=>setPayments(p=>({...p, stripe:{...(p?.stripe||{}), publishableKey:e.target.value}}))} />
              <input className="input mb-2" placeholder="Secret Key" type="password" value={payments?.stripe?.secretKey||''} onChange={e=>setPayments(p=>({...p, stripe:{...(p?.stripe||{}), secretKey:e.target.value}}))} />
              <input className="input" placeholder="Webhook Secret" type="password" value={payments?.stripe?.webhookSecret||''} onChange={e=>setPayments(p=>({...p, stripe:{...(p?.stripe||{}), webhookSecret:e.target.value}}))} />
            </div>
            <div className="card p-4">
              <h3 className="font-bold mb-3">PayPal</h3>
              <label className="flex items-center gap-2 mb-3"><input type="checkbox" checked={!!payments?.paypal?.enabled} onChange={e=>setPayments(p=>({...p, paypal:{...(p?.paypal||{}), enabled:e.target.checked}}))} /> Enable PayPal</label>
              <select className="input mb-2" value={payments?.paypal?.mode||'sandbox'} onChange={e=>setPayments(p=>({...p, paypal:{...(p?.paypal||{}), mode:e.target.value}}))}>
                <option value="sandbox">Sandbox</option>
                <option value="live">Live</option>
              </select>
              <input className="input mb-2" placeholder="Client ID" value={payments?.paypal?.clientId||''} onChange={e=>setPayments(p=>({...p, paypal:{...(p?.paypal||{}), clientId:e.target.value}}))} />
              <input className="input" placeholder="Client Secret" type="password" value={payments?.paypal?.clientSecret||''} onChange={e=>setPayments(p=>({...p, paypal:{...(p?.paypal||{}), clientSecret:e.target.value}}))} />
            </div>
            <div className="card p-4">
              <h3 className="font-bold mb-3">Venmo</h3>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!payments?.venmo?.enabled} onChange={e=>setPayments(p=>({...p, venmo:{ enabled:e.target.checked }}))} /> Enable Venmo (manual capture)</label>
            </div>
            <div className="card p-4">
              <h3 className="font-bold mb-3">Wise</h3>
              <label className="flex items-center gap-2"><input type="checkbox" checked={!!payments?.wise?.enabled} onChange={e=>setPayments(p=>({...p, wise:{ enabled:e.target.checked }}))} /> Enable Wise (manual capture)</label>
            </div>
          </div>
          <div>
            <button className="btn btn-primary" onClick={async()=>{
              try { await api.saSavePaymentsConfig(sanitizePaymentsBeforeSave(payments)); showToast('Payment configuration saved'); } catch(_) { showToast('Failed to save','error'); }
            }}>Save Configuration</button>
          </div>
        </div>
      )}
      {tab==='users' && (
        <div>
          <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
            <h2 className="text-2xl font-bold">Users</h2>
            <div className="flex items-center gap-2">
              <input className="input" placeholder="Search name or email" value={userQuery} onChange={e=>setUserQuery(e.target.value)} />
              <select className="input" value={userRoleFilter} onChange={e=>setUserRoleFilter(e.target.value)}>
                <option value="">All roles</option>
                <option value="artist">Artists</option>
                <option value="fan">Fans</option>
                <option value="admin">Admins</option>
                <option value="superadmin">Superadmins</option>
              </select>
              <button className="btn btn-outline" onClick={()=>{ setUserQuery(''); setUserRoleFilter(''); fetchUsers(); }}>Reset</button>
            </div>
          </div>

          {/* Role quick filters with counts */}
          {(() => { const counts = users.reduce((acc,u)=>{ acc[u.role]=(acc[u.role]||0)+1; return acc; },{}); return (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              {['artist','fan','admin','superadmin'].map(r => (
                <button key={r} className={`btn btn-xs ${userRoleFilter===r?'btn-primary':'btn-ghost'}`} onClick={()=>setUserRoleFilter(r)}>
                  {r.charAt(0).toUpperCase()+r.slice(1)} ({counts[r]||0})
                </button>
              ))}
              <button className={`btn btn-xs ${userRoleFilter===''?'btn-primary':'btn-ghost'}`} onClick={()=>setUserRoleFilter('')}>All ({users.length})</button>
            </div>
          ); })()}

          {loading ? <div className="spinner"></div> : (
            <table className="w-full text-left mb-8">
              <thead>
                <tr className="border-b border-white/10">
                  <th>Name</th><th>Email</th><th>Role</th><th>Wallet</th><th>Status</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users
                  .filter(u => !userRoleFilter || u.role === userRoleFilter)
                  .filter(u => {
                    if (!userQuery.trim()) return true;
                    const q = userQuery.trim().toLowerCase();
                    return String(u.name||'').toLowerCase().includes(q) || String(u.email||'').toLowerCase().includes(q);
                  })
                  .map(u => (
                  <tr key={u._id} className="border-b border-white/5">
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select className="input text-sm" defaultValue={u.role} onChange={async (e)=>{ try { await api.saUpdateUser(u._id, { role: e.target.value }); showToast('Role updated'); fetchUsers(); } catch(_) { showToast('Failed to update role','error'); e.target.value = u.role; } }}>
                        {['artist','fan','admin','superadmin'].map(r => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td>
                      {editWallet===u._id ? (
                        <span>
                          <input type="number" value={walletAmount} onChange={e=>setWalletAmount(Number(e.target.value))} className="input w-24" />
                          <button className="btn btn-primary ml-2" onClick={()=>handleUpdateWallet(u._id)}>Save</button>
                          <button className="btn btn-ghost ml-2" onClick={()=>setEditWallet(null)}>Cancel</button>
                        </span>
                      ) : (
                        <span>${u.walletBalance?.toFixed(2) || '0.00'} <button className="btn btn-ghost btn-xs ml-2" onClick={()=>{setEditWallet(u._id);setWalletAmount(u.walletBalance||0);}}>Edit</button></span>
                      )}
                    </td>
                    <td>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" defaultChecked={u.isActive} onChange={async (e)=>{ try { await api.saSetUserStatus(u._id, e.target.checked); showToast('Status updated'); } catch(_) { showToast('Failed to update status','error'); e.target.checked = !e.target.checked; } }} />
                        <span className="text-white/60 text-sm">{u.isActive ? 'Active' : 'Inactive'}</span>
                      </label>
                    </td>
                    <td>
                      <button className="btn btn-outline btn-xs" onClick={()=>setSelectedUser(u)}>View</button>
                      {u.role !== 'superadmin' && (
                        <button className="btn btn-danger btn-xs ml-2" onClick={()=>handleDeleteUser(u._id)}>Delete</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {selectedUser && (
            <div className="fixed inset-0 z-50 backdrop">
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setSelectedUser(null)}></div>
              <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="glass-dark rounded-2xl p-8 max-w-lg w-full animate-slideInUp">
                  <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={()=>setSelectedUser(null)}>✕</button>
                  <h3 className="text-2xl font-bold mb-4">User Details</h3>
                  <div className="mb-2"><b>Name:</b> {selectedUser.name}</div>
                  <div className="mb-2"><b>Email:</b> {selectedUser.email}</div>
                  <div className="mb-2"><b>Role:</b> {selectedUser.role}</div>
                  <div className="mb-2"><b>Wallet:</b> ${selectedUser.walletBalance?.toFixed(2) || '0.00'}</div>
                  <div className="mb-2"><b>Status:</b> {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
                  <div className="mb-2"><b>Bio:</b> {selectedUser.bio}</div>
                  <div className="mb-2"><b>Created:</b> {new Date(selectedUser.createdAt).toLocaleString()}</div>
                  <div className="mb-2"><b>Last Login:</b> {selectedUser.lastLogin ? new Date(selectedUser.lastLogin).toLocaleString() : 'N/A'}</div>
                  <div className="mt-4 grid md:grid-cols-2 gap-2">
                    <button className="btn btn-outline" onClick={()=>setEditModal({ open: true, key: 'name', label: 'Edit Name', type: 'text', value: selectedUser.name||'' })}>Edit Name</button>
                    <button className="btn btn-outline" onClick={()=>setEditModal({ open: true, key: 'email', label: 'Edit Email', type: 'email', value: selectedUser.email||'' })}>Edit Email</button>
                    <button className="btn btn-outline" onClick={()=>setEditModal({ open: true, key: 'bio', label: 'Edit Bio', type: 'textarea', value: selectedUser.bio||'' })}>Edit Bio</button>
                    <button className="btn btn-outline" onClick={()=>setEditModal({ open: true, key: 'avatar', label: 'Edit Avatar URL', type: 'url', value: selectedUser.avatar||'' })}>Edit Avatar</button>
                    <button className="btn btn-outline" onClick={()=>setEditModal({ open: true, key: 'location', label: 'Edit Location', type: 'text', value: selectedUser.location||'' })}>Edit Location</button>
                    <button className="btn btn-outline" onClick={()=>setEditModal({ open: true, key: 'website', label: 'Edit Website', type: 'url', value: selectedUser.website||'' })}>Edit Website</button>
                    <button className="btn btn-warning" onClick={()=>setEditModal({ open: true, key: 'password', label: 'Reset Password', type: 'password', value: '' })}>Reset Password</button>
                    <button className="btn btn-warning" onClick={()=>setConfirmModal({ open: true, title: 'Clear Sessions', description: 'Force logout on all devices for this user?', onConfirm: async ()=>{ try { await api.saClearUserSessions(selectedUser._id); showToast('Sessions cleared'); } catch(_) { showToast('Failed','error'); } } })}>Clear Sessions</button>
                  </div>
                  <button className="btn btn-ghost mt-4" onClick={()=>setSelectedUser(null)}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Generic Edit Modal */}
      {editModal.open && (
        <div className="fixed inset-0 z-50 backdrop">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setEditModal(prev=>({ ...prev, open:false }))}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="glass-dark rounded-2xl p-6 w-full max-w-md animate-slideInUp">
              <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={()=>setEditModal(prev=>({ ...prev, open:false }))}>✕</button>
              <h3 className="text-xl font-bold mb-4">{editModal.label}</h3>
              {editModal.type === 'textarea' ? (
                <textarea className="input w-full h-32" value={editModal.value} onChange={(e)=>setEditModal(prev=>({ ...prev, value: e.target.value }))}></textarea>
              ) : (
                <input className="input w-full" type={editModal.type==='password'?'password': (editModal.type||'text')} value={editModal.value} onChange={(e)=>setEditModal(prev=>({ ...prev, value: e.target.value }))} />
              )}
              <div className="flex gap-2 mt-4">
                <button className="btn btn-primary" disabled={isSavingEdit} onClick={async ()=>{
                  try {
                    setIsSavingEdit(true);
                    const key = editModal.key;
                    const val = editModal.value?.trim?.() ?? '';
                    if (key === 'email' && val && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) { showToast('Invalid email','error'); setIsSavingEdit(false); return; }
                    if ((key === 'avatar' || key === 'website') && val && !/^https?:\/\//.test(val)) { showToast('URL must start with http(s)://','error'); setIsSavingEdit(false); return; }
                    if (key === 'password') {
                      if (!val || val.length < 12) { showToast('Password must be at least 12 characters','error'); setIsSavingEdit(false); return; }
                      await api.saResetUserPassword(selectedUser._id, val);
                      showToast('Password reset');
                    } else {
                      const payload = { [key]: val };
                      const updated = await api.saUpdateUser(selectedUser._id, payload);
                      setSelectedUser(updated);
                      fetchUsers();
                      showToast('Saved');
                    }
                    setEditModal(prev=>({ ...prev, open:false }));
                  } catch (e) {
                    showToast('Save failed','error');
                  } finally {
                    setIsSavingEdit(false);
                  }
                }}>Save</button>
                <button className="btn btn-ghost" onClick={()=>setEditModal(prev=>({ ...prev, open:false }))}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal */}
      {confirmModal.open && (
        <div className="fixed inset-0 z-50 backdrop">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setConfirmModal({ open:false, title:'', description:'', onConfirm:null })}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="glass-dark rounded-2xl p-6 w-full max-w-sm animate-slideInUp">
              <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={()=>setConfirmModal({ open:false, title:'', description:'', onConfirm:null })}>✕</button>
              <h3 className="text-xl font-bold mb-2">{confirmModal.title}</h3>
              <p className="text-white/70 mb-4">{confirmModal.description}</p>
              <div className="flex gap-2">
                <button className="btn btn-warning" onClick={async()=>{ try { await confirmModal.onConfirm?.(); } finally { setConfirmModal({ open:false, title:'', description:'', onConfirm:null }); } }}>Confirm</button>
                <button className="btn btn-ghost" onClick={()=>setConfirmModal({ open:false, title:'', description:'', onConfirm:null })}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab==='songs' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <input className="input" placeholder="Search songs" value={songs.q} onChange={e=>setSongs(prev=>({ ...prev, q: e.target.value }))} />
            <button className="btn btn-outline" onClick={()=>fetchSongs(1)}>Search</button>
            <button className="btn btn-ghost" onClick={()=>{setSongs({ list: [], pagination: null, q: '' }); fetchSongs(1);}}>Clear</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="border-b border-white/10"><th>Title</th><th>Artist</th><th>Genre</th><th>Plays</th><th>Tips</th><th>Public</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {songs.list.map(s => (
                  <tr key={s._id} className="border-b border-white/5">
                    <td>{s.title}</td>
                    <td>{s.artist?.name}</td>
                    <td>{s.genre}</td>
                    <td>{s.plays}</td>
                    <td>{s.tips} (${s.totalTipAmount?.toFixed?.(2) || '0.00'})</td>
                    <td>
                      <label className="inline-flex items-center gap-2">
                        <input type="checkbox" checked={!!s.isPublic} onChange={async (e)=>{ try { await api.saSetSongVisibility(s._id, e.target.checked); fetchSongs(songs.pagination?.page||1); } catch(_) { showToast('Failed to update visibility','error'); } }} />
                        <span className="text-white/60 text-sm">{s.isPublic ? 'Public' : 'Hidden'}</span>
                      </label>
                    </td>
                    <td>
                      <button className="btn btn-danger btn-xs" onClick={async ()=>{ if (!confirm('Delete song?')) return; try { await api.saDeleteSong(s._id); fetchSongs(songs.pagination?.page||1); showToast('Song deleted'); } catch(_) { showToast('Delete failed','error'); } }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {songs.pagination && (
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost" disabled={(songs.pagination.page||1)<=1} onClick={()=>fetchSongs((songs.pagination.page||1)-1)}>Prev</button>
              <div className="text-white/60 text-sm">Page {songs.pagination.page} of {songs.pagination.pages}</div>
              <button className="btn btn-ghost" disabled={(songs.pagination.page||1)>=(songs.pagination.pages||1)} onClick={()=>fetchSongs((songs.pagination.page||1)+1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab==='tips' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <select className="input" value={tips.status} onChange={(e)=>setTips(prev=>({ ...prev, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <button className="btn btn-outline" onClick={()=>fetchTips(1)}>Filter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="border-b border-white/10"><th>Date</th><th>Fan</th><th>Artist</th><th>Song</th><th>Amount</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {tips.list.map(t => (
                  <tr key={t._id} className="border-b border-white/5">
                    <td>{new Date(t.createdAt).toLocaleString?.() || ''}</td>
                    <td>{t.fan?.name || 'Anonymous'}</td>
                    <td>{t.artist?.name || ''}</td>
                    <td>{t.song?.title || ''}</td>
                    <td>${(t.amount||0).toFixed?.(2)}</td>
                    <td>{t.status}</td>
                    <td>
                      <select className="input text-sm" defaultValue={t.status} onChange={async (e)=>{ try { await api.saUpdateTipStatus(t._id, e.target.value); fetchTips(tips.pagination?.page||1); showToast('Tip updated'); } catch(_) { showToast('Update failed','error'); } }}>
                        {['completed','pending','failed','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {tips.pagination && (
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost" disabled={(tips.pagination.page||1)<=1} onClick={()=>fetchTips((tips.pagination.page||1)-1)}>Prev</button>
              <div className="text-white/60 text-sm">Page {tips.pagination.page} of {tips.pagination.pages}</div>
              <button className="btn btn-ghost" disabled={(tips.pagination.page||1)>=(tips.pagination.pages||1)} onClick={()=>fetchTips((tips.pagination.page||1)+1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab==='withdrawals' && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <select className="input" value={withdrawals.status} onChange={(e)=>setWithdrawals(prev=>({ ...prev, status: e.target.value }))}>
              <option value="">All statuses</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
            <select className="input" value={withdrawals.method} onChange={(e)=>setWithdrawals(prev=>({ ...prev, method: e.target.value }))}>
              <option value="">All methods</option>
              {['paypal','wise','venmo','cashapp','bank'].map(m => <option key={m} value={m}>{m}</option>)}
            </select>
            <button className="btn btn-outline" onClick={()=>fetchWithdrawals(1)}>Filter</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left mb-4">
              <thead>
                <tr className="border-b border-white/10"><th>Date</th><th>Artist</th><th>Amount</th><th>Method</th><th>Status</th><th>Proof</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {withdrawals.list.map(w => (
                  <tr key={w.id} className="border-b border-white/5">
                    <td>{new Date(w.createdAt).toLocaleString?.() || ''}</td>
                    <td>{w.user?.name} <span className="text-white/40 text-xs">({w.user?.email})</span></td>
                    <td>${(w.amount||0).toFixed?.(2)}</td>
                    <td>{w.method}</td>
                    <td>
                      <select className="input text-sm" defaultValue={w.status} onChange={async (e)=>{ try { await api.saUpdateWithdrawal(w.id, { status: e.target.value }); fetchWithdrawals(withdrawals.pagination?.page||1); showToast('Withdrawal updated'); } catch(_) { showToast('Update failed','error'); } }}>
                        {['pending','processing','completed','failed','refunded'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      {w.proofUrl ? <a href={w.proofUrl} target="_blank" className="text-primary underline">View</a> : <span className="text-white/40">—</span>}
                    </td>
                    <td>
                      <button className="btn btn-outline btn-xs" onClick={async ()=>{
                        const url = prompt('Enter proof URL (receipt, transaction, etc.)', w.proofUrl||'');
                        if (url===null) return;
                        try { await api.saUpdateWithdrawal(w.id, { proofUrl: url }); fetchWithdrawals(withdrawals.pagination?.page||1); showToast('Proof saved'); } catch(_) { showToast('Save failed','error'); }
                      }}>Attach Proof</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {withdrawals.pagination && (
            <div className="flex items-center gap-2">
              <button className="btn btn-ghost" disabled={(withdrawals.pagination.page||1)<=1} onClick={()=>fetchWithdrawals((withdrawals.pagination.page||1)-1)}>Prev</button>
              <div className="text-white/60 text-sm">Page {withdrawals.pagination.page} of {withdrawals.pagination.pages}</div>
              <button className="btn btn-ghost" disabled={(withdrawals.pagination.page||1)>=(withdrawals.pagination.pages||1)} onClick={()=>fetchWithdrawals((withdrawals.pagination.page||1)+1)}>Next</button>
            </div>
          )}
        </div>
      )}

      {tab==='security' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-white mb-3">Security Status</h3>
            <button className="btn btn-outline mb-3" onClick={async()=>{
              try {
                const res = await fetch('/api/security/status');
                const json = await res.json();
                const pre = document.getElementById('secStatus');
                if (pre) pre.textContent = JSON.stringify(json, null, 2);
              } catch(_) {}
            }}>Refresh</button>
            <pre id="secStatus" className="text-white/70 text-sm overflow-auto bg-white/5 p-3 rounded">{`{"loading": true}`}</pre>
            <div className="mt-3 flex gap-2">
              <a href="/api/security/status" target="_blank" className="btn btn-ghost">Open /security/status</a>
              <a href="/api/security/report" target="_blank" className="btn btn-ghost">Open /security/report</a>
            </div>
          </div>
        </div>
      )}

      {tab==='maintenance' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-white mb-3">Bulk Ensure Artists</h3>
            <p className="text-white/60 mb-3">Create artists by name (comma-separated). Optionally create a sample song for each.</p>
            <div className="flex gap-2 flex-wrap">
              <input id="ensureNames" className="input flex-1" placeholder="e.g., Luna Echo, EDM Pulse, Jazz Flow" />
              <label className="inline-flex items-center gap-2 text-white/70"><input type="checkbox" id="ensureSample" /> Create sample song</label>
              <button className="btn btn-primary" onClick={async ()=>{
                const names = (document.getElementById('ensureNames').value||'').split(',').map(s=>s.trim()).filter(Boolean);
                const createSampleSong = !!document.getElementById('ensureSample').checked;
                if (names.length===0) return showToast('Enter at least one name','error');
                try { await api.saEnsureArtists(names, createSampleSong); showToast('Ensure complete'); } catch(_) { showToast('Failed','error'); }
              }}>Run</button>
            </div>
          </div>
        </div>
      )}
      {tab==='homepage' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-xl font-bold text-white mb-3">Homepage Content</h3>
            {!homeDraft ? (
              <div className="text-white/60">Loading…</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-white/80 mb-2">Hero Logo URL</label>
                  <input className="input w-full" value={homeDraft.hero?.logoUrl||''} onChange={(e)=>setHomeDraft(prev=>({ ...(prev||{}), hero: { ...(prev?.hero||{}), logoUrl: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Hero Subtitle</label>
                  <textarea className="input w-full" rows="2" value={homeDraft.hero?.subtitle||''} onChange={(e)=>setHomeDraft(prev=>({ ...(prev||{}), hero: { ...(prev?.hero||{}), subtitle: e.target.value } }))}></textarea>
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Hero Tagline</label>
                  <input className="input w-full" value={homeDraft.hero?.tagline||''} onChange={(e)=>setHomeDraft(prev=>({ ...(prev||{}), hero: { ...(prev?.hero||{}), tagline: e.target.value } }))} />
                </div>

                <div>
                  <label className="block text-white/80 mb-2">How It Works (JSON array)</label>
                  <textarea className="input w-full font-mono text-sm" rows="6" value={JSON.stringify(homeDraft.howItWorks||[], null, 2)} onChange={(e)=>{
                    try { const v = JSON.parse(e.target.value||'[]'); setHomeDraft(prev=>({ ...(prev||{}), howItWorks: Array.isArray(v)?v:[] })); } catch(_) {}
                  }}></textarea>
                </div>

                <div>
                  <label className="block text-white/80 mb-2">Features Title</label>
                  <input className="input w-full" value={homeDraft.features?.title||''} onChange={(e)=>setHomeDraft(prev=>({ ...(prev||{}), features: { ...(prev?.features||{}), title: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Features Subtitle</label>
                  <input className="input w-full" value={homeDraft.features?.subtitle||''} onChange={(e)=>setHomeDraft(prev=>({ ...(prev||{}), features: { ...(prev?.features||{}), subtitle: e.target.value } }))} />
                </div>
                <div>
                  <label className="block text-white/80 mb-2">Feature Cards (JSON array)</label>
                  <textarea className="input w-full font-mono text-sm" rows="8" value={JSON.stringify(homeDraft.features?.cards||[], null, 2)} onChange={(e)=>{
                    try { const v = JSON.parse(e.target.value||'[]'); setHomeDraft(prev=>({ ...(prev||{}), features: { ...(prev?.features||{}), cards: Array.isArray(v)?v:[] } })); } catch(_) {}
                  }}></textarea>
                </div>

                <div className="flex gap-2">
                  <button className="btn btn-primary" disabled={isSavingHome} onClick={async()=>{ try { setIsSavingHome(true); await api.saUpdateHomepage(homeDraft); showToast('Homepage saved'); } catch(_) { showToast('Save failed','error'); } finally { setIsSavingHome(false); } }}>Save</button>
                  <button className="btn btn-ghost" onClick={async()=>{ try { const res = await api.saGetHomepage(); setHomeDraft(res.homepage||{}); showToast('Reloaded'); } catch(_) {} }}>Reload</button>
                </div>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="text-xl font-bold text-white mb-3">Homepage Texts (key → value)</h3>
            {!homeTexts ? (
              <div className="text-white/60">Loading…</div>
            ) : (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <button className="btn btn-outline btn-xs" onClick={()=>setHomeTexts(prev=>({ ...(prev||{}), _new_key_: '' }))}>Add Row</button>
                  <small className="text-white/50">Use any keys, then reference them in the homepage. Examples: hero.title, hero.ctaJoin, stats.artists.label</small>
                </div>
                <div className="max-h-96 overflow-auto border border-white/10 rounded">
                  {Object.keys(homeTexts).sort().map((k)=> (
                    <div key={k} className="grid grid-cols-1 md:grid-cols-2 gap-2 p-2 border-b border-white/5">
                      <input className="input" value={k} onChange={(e)=>{
                        const nv = e.target.value; setHomeTexts(prev=>{ const obj={...prev}; delete obj[k]; obj[nv]=prev[k]; return obj; });
                      }} />
                      <textarea className="input" rows="2" value={homeTexts[k]} onChange={(e)=>setHomeTexts(prev=>({ ...prev, [k]: e.target.value }))}></textarea>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-3">
                  <button className="btn btn-primary" disabled={isSavingTexts} onClick={async()=>{ try { setIsSavingTexts(true); await api.saUpdateHomepageTexts(homeTexts); showToast('Texts saved'); } catch(_) { showToast('Save failed','error'); } finally { setIsSavingTexts(false); } }}>Save Texts</button>
                  <button className="btn btn-ghost" onClick={async()=>{ try { const res = await api.saGetHomepageTexts(); setHomeTexts(res.texts||{}); showToast('Reloaded'); } catch(_) {} }}>Reload</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      {tab==='stats' && stats && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Site Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-6 mb-6">
            <div className="card text-center"><div className="text-3xl mb-2">👥</div><div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.userCount||0)}</div><div className="text-white/60 text-sm">Total Users</div></div>
            <div className="card text-center"><div className="text-3xl mb-2">🎤</div><div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.artistCount||0)}</div><div className="text-white/60 text-sm">Artists</div></div>
            <div className="card text-center"><div className="text-3xl mb-2">👤</div><div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.fanCount||0)}</div><div className="text-white/60 text-sm">Fans</div></div>
            <div className="card text-center"><div className="text-3xl mb-2">🛡️</div><div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.adminCount||0)}</div><div className="text-white/60 text-sm">Admins</div></div>
            <div className="card text-center"><div className="text-3xl mb-2">👑</div><div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.superadminCount||0)}</div><div className="text-white/60 text-sm">Superadmins</div></div>
            <div className="card text-center"><div className="text-3xl mb-2">💰</div><div className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.totalWallet||0)}</div><div className="text-white/60 text-sm">Total Wallet</div></div>
          </div>
          <div className="card p-4">
            <h3 className="text-lg font-bold text-white mb-2">Trends (7d)</h3>
            <div className="text-white/60 text-sm">Use the Tips tab and Songs list to monitor live activity. For richer charts, we can add a mini chart library.</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== HIDDEN ADMIN LOGIN PAGE =====
function AdminLoginForm({ goTo }) {
  const { setUser, showToast } = useApp();
  const [formData, setFormData] = React.useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.login({ email: formData.email, password: formData.password });
      if (!data || !data.token) throw new Error('Invalid credentials');
      if (data.user.role !== 'admin' && data.user.role !== 'superadmin') {
        throw new Error('Admin access only');
      }
      setUser(data.user);
      showToast('Welcome, admin!');
      goTo(data.user.role === 'superadmin' ? 'superadmin' : 'dashboard');
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 relative">
      <div className="w-full max-w-md relative z-10">
        <div className="card p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🛡️</span>
            </div>
            <h2 className="text-3xl font-space font-bold">Admin Login</h2>
            <p className="text-white/60 mt-2">Sign in as admin or superadmin</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-500/20 text-red-400 rounded p-3 text-center font-medium">{error}</div>
            )}
            <div>
              <label className="block text-white/90 mb-2 font-medium">Email</label>
              <input
                type="email"
                required
                className="input w-full"
                placeholder="admin@email.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-white/90 mb-2 font-medium">Password</label>
              <input
                type="password"
                required
                className="input w-full"
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="btn btn-primary w-full text-lg py-4"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <div className="spinner mr-3"></div>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ===== MAIN APP COMPONENT =====
function App() {
  const [user, setUser] = useState(null);
  // Persist auth: instant hydrate user from localStorage, then verify token in background
  useEffect(() => {
    // Instant: use cached snapshot for zero-jank UI
    const cached = window.api?.getSavedUser?.();
    if (cached && !user) setUser(cached);

    // Background: verify token and refresh user
    (async () => {
      try {
        if (window.api?.token) {
          const res = await window.api.getProfile();
          if (res && res.user) {
            setUser(res.user);
            window.api.setSavedUser(res.user);
          }
        }
      } catch (e) {
        // Invalid/expired token; clear it silently
        try { window.api.setToken(null); window.api.setSavedUser(null); } catch {}
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Expose a global updater so child components can update the live user snapshot (e.g., avatar preview)
  React.useEffect(() => {
    window.updateUser = function(updated) {
      try {
        const next = typeof updated === 'function' ? updated(user) : updated;
        setUser(next);
        if (next) window.api?.setSavedUser?.(next);
      } catch {}
    };
    return () => { try { delete window.updateUser; } catch {} };
  }, [user]);

  const [currentPage, setCurrentPage] = useState('home');
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [theme, setTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch (e) { return 'dark'; }
  });
  const [showTipModal, setShowTipModal] = useState(false);
  const [tipAmount, setTipAmount] = useState(5);
  const [tipTarget, setTipTarget] = useState(null);
  const [tipType, setTipType] = useState('artist');
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [route, setRoute] = React.useState({ page: 'home', artistSlug: null });

  // Responsive hook
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Toast system
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Microinteraction: lightweight sound effects (WebAudio) and confetti
  const audioCtxRef = React.useRef(null);
  function ensureAudioContext() {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume?.();
    }
    return audioCtxRef.current;
  }
  function playTone(frequency, durationMs, type = 'sine', gainValue = 0.04) {
    const ctx = ensureAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = frequency;
    gain.gain.value = 0;
    osc.connect(gain).connect(ctx.destination);
    const now = ctx.currentTime;
    // Quick attack/decay envelope
    gain.gain.linearRampToValueAtTime(gainValue, now + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
    osc.start(now);
    osc.stop(now + durationMs / 1000 + 0.02);
  }
  function playMicroSound(kind) {
    // Short melodic cues that fit the app's vibe
    if (kind === 'login') {
      // Rising two-note arpeggio
      playTone(440, 120, 'triangle'); // A4
      setTimeout(() => playTone(660, 150, 'triangle'), 110); // E5
    } else if (kind === 'signup') {
      // Triumphant three-note
      playTone(392, 140, 'sine'); // G4
      setTimeout(() => playTone(523.25, 150, 'sine'), 120); // C5
      setTimeout(() => playTone(659.25, 180, 'sine'), 260); // E5
    } else if (kind === 'tip') {
      // Sparkly cash-like arpeggio
      playTone(880, 120, 'square');
      setTimeout(() => playTone(740, 120, 'square'), 90);
      setTimeout(() => playTone(988, 160, 'square'), 180);
    }
  }
  async function loadConfetti() {
    if (window.confetti) return;
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://unpkg.com/canvas-confetti';
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  async function launchConfetti(opts = {}) {
    try {
      await loadConfetti();
      const colors = opts.colors || ['#6366f1', '#ec4899', '#f59e0b', '#10b981'];
      window.confetti?.({
        particleCount: opts.particleCount || 90,
        spread: opts.spread || 70,
        startVelocity: opts.startVelocity || 35,
        scalar: opts.scalar || 0.9,
        ticks: opts.ticks || 200,
        origin: opts.origin || { y: 0.6 },
        colors
      });
    } catch (e) {
      // Fail silently if blocked by CSP or offline
    }
  }

  // Load tsparticles confetti bundle lazily
  async function loadTsParticlesConfetti() {
    if (window.__tsConfettiLoaded) return;
    // If a global confetti already exists, we still try to load tsparticles; last one wins
    await new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@tsparticles/confetti@3.0.3/tsparticles.confetti.bundle.min.js';
      s.async = true;
      s.onload = () => { window.__tsConfettiLoaded = true; resolve(); };
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  // Prefer tsparticles side-burst celebration; fallback to canvas-confetti
  async function launchTipConfettiCelebration() {
    try {
      await loadTsParticlesConfetti();
      if (typeof window.confetti === 'function') {
        // Stronger celebration: two waves from both sides
        window.confetti({ particleCount: 600, spread: 90, origin: { x: 1, y: 0.9 } });
        window.confetti({ particleCount: 600, spread: 90, origin: { x: 0, y: 0.9 } });
        setTimeout(() => {
          window.confetti({
            particleCount: 400,
            spread: 70,
            angle: 90,
            startVelocity: 55,
            origin: { x: 0.5, y: 0.98 }
          });
        }, 250);
        return;
      }
    } catch (_) {
      // ignore and fallback
    }
    // Fallback to stronger canvas-confetti (mirrored bursts + second wave)
    launchConfetti({ particleCount: 280, spread: 90, origin: { x: 1, y: 0.9 } });
    launchConfetti({ particleCount: 280, spread: 90, origin: { x: 0, y: 0.9 } });
    setTimeout(() => {
      launchConfetti({
        particleCount: 200,
        spread: 70,
        angle: 90,
        startVelocity: 55,
        origin: { x: 0.5, y: 0.98 }
      });
    }, 250);
  }

  // Expose celebration function globally for any scope resolution issues
  try { window.launchTipConfettiCelebration = launchTipConfettiCelebration; } catch (_) {}

// Simple static policy page renderer (content can be moved to CMS later)
function StaticPolicyPage({ title, bodyKey }) {
  const defaultCopy = {
    terms: `Welcome to MusicBae. By accessing or using our services you agree to the following terms...`,
    privacy: `We respect your privacy. This policy explains what information we collect and how we use it...`,
    refunds: `Tips are gifts to artists and are generally non‑refundable. In certain exceptional cases, please contact support...`,
    dmca: `If you believe content on MusicBae infringes your copyright, submit a detailed report including URLs, your contact info, and a good‑faith statement...`,
    careers: `We're building the future of creator support. Interested in joining? Send your portfolio and resume to careers@musicbae.com.`
  };
  const copy = defaultCopy[bodyKey] || '';
  return (
    <div className="pt-20 pb-24 px-4 max-w-4xl mx-auto">
      <h1 className="text-4xl font-space font-bold mb-6">{title}</h1>
      <div className="card p-6 leading-relaxed text-white/80 whitespace-pre-line">{copy}</div>
    </div>
  );
}

  // Routing logic (History API, clean URLs)
  React.useEffect(() => {
    function parseLocation() {
      const pathname = window.location.pathname.replace(/^\/+/, '');
      console.log('Current path:', pathname); // Debug log

      if (!pathname || pathname === '') {
        setRoute({ page: 'home', artistSlug: null });
        return;
      }

      if (pathname.startsWith('artists')) {
        setRoute({ page: 'artists', artistSlug: null });
        return;
      }

      if (pathname.startsWith('artist/')) {
        const parts = pathname.split('/');
        const slug = parts[1] || null;
        setRoute({ page: 'artist-profile', artistSlug: slug });
        return;
      }

      if (pathname.startsWith('about')) {
        setRoute({ page: 'about', artistSlug: null });
        return;
      }

      // Footer pages
      if (pathname.startsWith('terms')) { setRoute({ page: 'terms', artistSlug: null }); return; }
      if (pathname.startsWith('privacy')) { setRoute({ page: 'privacy', artistSlug: null }); return; }
      if (pathname.startsWith('refunds')) { setRoute({ page: 'refunds', artistSlug: null }); return; }
      if (pathname.startsWith('dmca')) { setRoute({ page: 'dmca', artistSlug: null }); return; }
      if (pathname.startsWith('careers')) { setRoute({ page: 'careers', artistSlug: null }); return; }

      if (pathname.startsWith('contact')) {
        setRoute({ page: 'contact', artistSlug: null });
        return;
      }

      if (pathname.startsWith('services')) {
        setRoute({ page: 'services', artistSlug: null });
        return;
      }

      if (pathname.startsWith('dashboard')) {
        // If no token, redirect to login
        if (!api.isAuthenticated?.()) {
          window.history.replaceState(null, '', '/login');
          setRoute({ page: 'login', artistSlug: null });
        } else {
          setRoute({ page: 'dashboard', artistSlug: null });
        }
        return;
      }

      if (pathname.startsWith('login-artist')) {
        setRoute({ page: 'login-artist', artistSlug: null });
        return;
      }

      if (pathname.startsWith('login')) {
        setRoute({ page: 'login', artistSlug: null });
        return;
      }

      if (pathname.startsWith('register-artist')) {
        setRoute({ page: 'register-artist', artistSlug: null });
        return;
      }

      if (pathname.startsWith('register')) {
        setRoute({ page: 'register', artistSlug: null });
        return;
      }

      if (pathname.startsWith('error-log')) {
        setRoute({ page: 'error-log', artistSlug: null });
        return;
      }

      if (pathname.startsWith('admin-login')) {
        setRoute({ page: 'admin-login', artistSlug: null });
        return;
      }

      setRoute({ page: 'home', artistSlug: null });
    }

    window.addEventListener('popstate', parseLocation, { passive: true });
    // Parse immediately to avoid waiting an extra frame on dashboard refresh
    parseLocation();
    return () => window.removeEventListener('popstate', parseLocation);
  }, []);

  // Navigation helpers
  function goTo(page, artistSlug) {
    console.log('Navigating to:', page, artistSlug); // Debug log
    
    if (page === 'artists') {
      window.history.pushState(null, '', '/artists');
      setRoute({ page: 'artists', artistSlug: null });
    } else if (page === 'artist-profile' && artistSlug) {
      window.history.pushState(null, '', `/artist/${artistSlug}`);
      setRoute({ page: 'artist-profile', artistSlug });
    } else if (page === 'about') {
      window.history.pushState(null, '', '/about');
      setRoute({ page: 'about', artistSlug: null });
    } else if (['terms','privacy','refunds','dmca','careers'].includes(page)) {
      window.history.pushState(null, '', `/${page}`);
      setRoute({ page, artistSlug: null });
    } else if (page === 'contact') {
      window.history.pushState(null, '', '/contact');
      setRoute({ page: 'contact', artistSlug: null });
    } else if (page === 'services') {
      window.history.pushState(null, '', '/services');
      setRoute({ page: 'services', artistSlug: null });
    } else if (page === 'dashboard') {
      window.history.pushState(null, '', '/dashboard');
      setRoute({ page: 'dashboard', artistSlug: null });
    } else if (page === 'login-artist') {
      window.history.pushState(null, '', '/login-artist');
      setRoute({ page: 'login-artist', artistSlug: null });
    } else if (page === 'login') {
      window.history.pushState(null, '', '/login');
      setRoute({ page: 'login', artistSlug: null });
    } else if (page === 'register-artist') {
      window.history.pushState(null, '', '/register-artist');
      setRoute({ page: 'register-artist', artistSlug: null });
    } else if (page === 'register') {
      window.history.pushState(null, '', '/register');
      setRoute({ page: 'register', artistSlug: null });
    } else if (page === 'error-log') {
      window.history.pushState(null, '', '/error-log');
      setRoute({ page: 'error-log', artistSlug: null });
    } else if (page === 'admin-login') {
      window.history.pushState(null, '', '/admin-login');
      setRoute({ page: 'admin-login', artistSlug: null });
    } else {
      window.history.pushState(null, '', '/');
      setRoute({ page: 'home', artistSlug: null });
    }
    
    // Close mobile menu if open
    setMenuOpen(false);
    
    // Scroll to top when navigating to new pages
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Render logic
  function renderPage() {
    console.log('Rendering page:', route.page); // Debug log
    console.log('AboutPage available:', typeof window.AboutPage); // Debug log
    console.log('ContactPage available:', typeof window.ContactPage); // Debug log
    
    switch (route.page) {
      case 'home':
        return <HomePage goTo={goTo} />;
      case 'artists':
        return <ArtistsPage goTo={goTo} />;
      case 'artist-profile': {
        return <ModernArtistProfilePage artistSlug={route.artistSlug} goTo={goTo} />;
      }
      case 'error-log':
        return <ErrorLogPage goTo={goTo} />;
      case 'about':
        if (typeof window.AboutPage === 'function') {
          return <AboutPage goTo={goTo} />;
        } else {
          console.error('AboutPage component not found');
          return <div className="pt-20 pb-24 px-4 text-center">
            <h1 className="text-4xl font-space font-bold mb-8">About MusicBae</h1>
            <p className="text-white/70 mb-6">Component loading...</p>
          </div>;
        }
      case 'contact':
        if (typeof window.ContactPage === 'function') {
          return <ContactPage goTo={goTo} />;
        } else {
          console.error('ContactPage component not found');
          return <div className="pt-20 pb-24 px-4 text-center">
            <h1 className="text-4xl font-space font-bold mb-8">Contact Us</h1>
            <p className="text-white/70 mb-6">Component loading...</p>
          </div>;
        }
      case 'services':
        if (typeof window.ServicesPage === 'function') {
          return <ServicesPage goTo={goTo} />;
        } else {
          console.error('ServicesPage component not found');
          return <div className="pt-20 pb-24 px-4 text-center">
            <h1 className="text-4xl font-space font-bold mb-8">Production Services</h1>
            <p className="text-white/70 mb-6">Component loading...</p>
          </div>;
        }
      case 'dashboard':
        if (!user) {
          // Graceful loading while hydrating/validating token
          return <div className="pt-20 pb-24 px-4 text-center">
            <div className="spinner mx-auto mb-6"></div>
            <p className="text-white/70">Loading your dashboard...</p>
          </div>;
        }
        return user.role === 'superadmin' ? <SuperAdminDashboard goTo={goTo} /> : user.role === 'artist' ? <ArtistDashboard goTo={goTo} /> : <FanDashboard goTo={goTo} />;
      case 'login':
        return <ModernAuthForm type="login" userType="fan" goTo={goTo} />;
      case 'login-artist':
        return <ModernAuthForm type="login" userType="artist" goTo={goTo} />;
      case 'register':
        return <ModernAuthForm type="register" userType="fan" goTo={goTo} />;
      case 'register-artist':
        return <ModernAuthForm type="register" userType="artist" goTo={goTo} />;
      case 'superadmin':
        return <SuperAdminDashboard goTo={goTo} />;
      case 'admin-login':
        return <AdminLoginForm goTo={goTo} />;
      case 'terms':
        return <StaticPolicyPage title="Terms & Conditions" bodyKey="terms" />;
      case 'privacy':
        return <StaticPolicyPage title="Privacy Policy" bodyKey="privacy" />;
      case 'refunds':
        return <StaticPolicyPage title="Refund Policy" bodyKey="refunds" />;
      case 'dmca':
        return <StaticPolicyPage title="Report Copyright Infringement" bodyKey="dmca" />;
      case 'careers':
        return <StaticPolicyPage title="Careers" bodyKey="careers" />;
      default:
        return <HomePage goTo={goTo} />;
    }
  }

  const contextValue = {
    user, setUser, currentPage: route.page, setCurrentPage, isMobile, menuOpen, setMenuOpen,
    toast, showToast, currentSong, setCurrentSong, isPlaying, setIsPlaying,
    audioProgress, setAudioProgress, theme, setTheme,
    showTipModal, setShowTipModal, tipAmount, setTipAmount, tipTarget, setTipTarget, tipType, setTipType,
    showPlayerModal, setShowPlayerModal,
    playMicroSound, launchConfetti
  };

  // Apply theme class to <html> and persist
  useEffect(() => {
    try { localStorage.setItem('theme', theme); } catch {}
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Listen for openTipModalAfterAuth event
  useEffect(() => {
    function handleOpenTipModalAfterAuth(e) {
      if (e.detail && e.detail.tipTarget && e.detail.tipType) {
        setTipTarget(e.detail.tipTarget);
        setTipType(e.detail.tipType);
        setShowTipModal(true);
      }
    }
    window.addEventListener('openTipModalAfterAuth', handleOpenTipModalAfterAuth);
    return () => window.removeEventListener('openTipModalAfterAuth', handleOpenTipModalAfterAuth);
  }, []);
  
  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [route.page, route.artistSlug]);

  return (
    <AppContext.Provider value={contextValue}>
      <div className="relative min-h-screen">
        {/* Navigation */}
        {isMobile ? (
          <ModernBottomNav goTo={goTo} currentPage={route.page} setMenuOpen={setMenuOpen} user={user} />
        ) : (
          <ModernTopNav goTo={goTo} currentPage={route.page} user={user} setUser={setUser} />
        )}
        <ModernMobileMenu goTo={goTo} menuOpen={menuOpen} setMenuOpen={setMenuOpen} user={user} />
        <div className={`app-content ${isMobile ? 'pb-32' : ''}`}>
          {renderPage()}
        </div>
        <SiteFooter goTo={goTo} isMobile={isMobile} setMenuOpen={setMenuOpen} />
        {/* Toasts, Modals, etc. */}
        <PlayerModal />
        <TipModal goTo={goTo} />
        {toast && (
          <div className="toast">
            <div className="text-white font-medium">{toast.message}</div>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}

// ===== GLOBAL ERROR HANDLER =====
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  // Prevent the default browser error handling
  event.preventDefault();
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  // Prevent the default browser error handling
  event.preventDefault();
});

// ===== RENDER APP =====
function mountApp() {
  const rootEl = document.getElementById('root');
  if (!rootEl) {
    // Retry once on the next frame if root isn't ready yet
    return requestAnimationFrame(mountApp);
  }
  ReactDOM.createRoot(rootEl).render(
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  );
}

// Mount as soon as DOM is interactive to avoid blank screen
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => requestAnimationFrame(mountApp), { once: true });
} else {
  requestAnimationFrame(mountApp);
}