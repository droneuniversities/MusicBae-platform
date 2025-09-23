const { useState } = React;

// ===== MODERN NAVIGATION COMPONENTS =====
// Navigation components are now defined in app.js to avoid conflicts

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
            <span className="text-2xl font-space font-bold gradient-primary bg-clip-text text-transparent">MusicBae</span>
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
            {/* Login Dropdown */}
            <div className="relative inline-block">
              <button 
                className="btn btn-ghost"
                onMouseEnter={(e) => {
                  const dropdown = e.target.nextElementSibling;
                  if (dropdown) dropdown.style.display = 'block';
                }}
                onMouseLeave={(e) => {
                  const dropdown = e.target.nextElementSibling;
                  if (dropdown) dropdown.style.display = 'none';
                }}
              >
                Login ▼
              </button>
              <div 
                className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50"
                style={{display: 'none'}}
                onMouseEnter={(e) => e.target.style.display = 'block'}
                onMouseLeave={(e) => e.target.style.display = 'none'}
              >
                <div className="py-2">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => goTo('login')}
                  >
                    Login as Fan
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => goTo('login-artist')}
                  >
                    Login as Artist
                  </button>
                </div>
              </div>
            </div>
            
            {/* Join Now Dropdown */}
            <div className="relative inline-block">
              <button 
                className="btn btn-primary"
                onMouseEnter={(e) => {
                  const dropdown = e.target.nextElementSibling;
                  if (dropdown) dropdown.style.display = 'block';
                }}
                onMouseLeave={(e) => {
                  const dropdown = e.target.nextElementSibling;
                  if (dropdown) dropdown.style.display = 'none';
                }}
              >
                Join Now ▼
              </button>
              <div 
                className="absolute right-0 top-full mt-1 w-48 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-50"
                style={{display: 'none'}}
                onMouseEnter={(e) => e.target.style.display = 'block'}
                onMouseLeave={(e) => e.target.style.display = 'none'}
              >
                <div className="py-2">
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => goTo('register')}
                  >
                    Sign Up as Fan
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 hover:bg-gray-700 text-white"
                    onClick={() => goTo('register-artist')}
                  >
                    Sign Up as Artist
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

function ModernMobileMenu({ goTo, menuOpen, setMenuOpen }) {
  if (!menuOpen) return null;
  return (
    <div className="fixed inset-0 z-50 backdrop">
      <div className="absolute right-0 top-0 h-full w-80 glass-dark p-6 animate-slideInRight">
        <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={() => setMenuOpen(false)}>✕</button>
        <div className="mt-12 space-y-2">
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

// Export components
window.Navigation = {
  ModernBottomNav,
  ModernTopNav,
  ModernMobileMenu
}; 