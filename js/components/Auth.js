const { useState } = React;

// ===== MODERN AUTHENTICATION COMPONENTS =====
function ModernAuthForm({ type, userType, goTo }) {
  const { setUser, showToast } = useApp();
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', bio: '', picture: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      let data;
      if (type === 'login') {
        data = await api.login({
          email: formData.email,
          password: formData.password
        });
      } else {
        data = await api.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: userType,
          bio: formData.bio,
          avatar: formData.picture
        });
      }
      
      if (data && data.user) {
        setUser(data.user);
        showToast(`${type === 'login' ? 'Welcome back' : 'Welcome to MusicBae'}! 🎵`);
        goTo('dashboard');
      } else {
        showToast('Authentication failed', 'error');
      }
    } catch (error) {
      console.error('Auth error:', error);
      showToast(error.message || 'Authentication failed', 'error');
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
              <span className="text-2xl">🎵</span>
            </div>
            <h2 className="text-3xl font-space font-bold">
              {type === 'login' ? 'Welcome Back' : 'Join MusicBae'}
            </h2>
            <p className="text-white/60 mt-2">
              {type === 'login' ? 'Sign in to your account' : `Create your ${userType} account`}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
          
          <div className="mt-6 text-center">
            <button
              className="text-white/60 hover:text-white transition-all"
              onClick={() => goTo(type === 'login' ? 'register' : 'login')}
            >
              {type === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export components
window.Auth = {
  ModernAuthForm
}; 