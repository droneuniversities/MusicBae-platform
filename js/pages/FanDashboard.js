// ===== FAN DASHBOARD COMPONENT =====
function FanDashboard({ goTo }) {
  const { user, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [showEditProfile, setShowEditProfile] = useState(false);
  
  // Dashboard data
  const [dashboardData, setDashboardData] = useState({
    stats: {
      walletBalance: 0,
      totalTips: 0,
      totalSongs: 0,
      totalArtists: 0
    },
    favoriteArtists: [],
    tipsHistory: [],
    songLibrary: [],
    walletTransactions: []
  });

  // Pagination states
  const [tipsPage, setTipsPage] = useState(1);
  const [artistsPage, setArtistsPage] = useState(1);
  const [libraryPage, setLibraryPage] = useState(0);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [hasMoreTips, setHasMoreTips] = useState(true);
  const [hasMoreArtists, setHasMoreArtists] = useState(true);
  const [hasMoreSongs, setHasMoreSongs] = useState(true);

  // ===== Boombox player state =====
  const [boomboxSong, setBoomboxSong] = useState(null); // { id, title, artist, cover, previewUrl, duration }
  const [isBoomboxPlaying, setIsBoomboxPlaying] = useState(false);
  const [boomboxProgress, setBoomboxProgress] = useState(0);
  const [boomboxDuration, setBoomboxDuration] = useState(0);
  const [boomboxVolume, setBoomboxVolume] = useState(0.8);
  const boomboxAudioRef = React.useRef(null);

  // Filters
  const [tipsStatus, setTipsStatus] = useState('');
  const [libraryGenre, setLibraryGenre] = useState('');
  const [librarySearch, setLibrarySearch] = useState('');

  // Fetch dashboard data on component mount
  useEffect(() => {
    // Instant hydration from cached user snapshot to render header quickly
    const cachedUser = api.getSavedUser?.();
    if (cachedUser) {
      setDashboardData(prev => ({ ...prev, user: cachedUser }));
    }
    
    // Only load dashboard data if user is authenticated
    if (user && user._id) {
      loadDashboardData();
    }
  }, [user]);

  // Refresh tips, wallet, and library when a new tip is sent elsewhere in the app
  useEffect(() => {
    function onTipsChanged() {
      // Refresh stats and first page of tips
      loadDashboardData();
      setActiveTab((prev) => prev); // keep tab
      if (activeTab === 'tips' || activeTab === 'overview' || activeTab === 'wallet') {
        resetTips();
        loadMoreTips(true);
        // Also refresh wallet balance and wallet transactions area
        resetWalletTx();
        loadMoreWalletTx();
      }
      // Always refresh library as tipping a song grants access (keep list while fetching)
      reloadLibrary();
    }
    window.addEventListener('tips:changed', onTipsChanged);
    return () => window.removeEventListener('tips:changed', onTipsChanged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // Lazy-load data when switching tabs or filters change
  useEffect(() => {
    if (activeTab === 'artists') {
      // Initial load for artists tab
      if (dashboardData.favoriteArtists.length === 0) {
        resetArtists();
        loadMoreArtists(true);
      }
    } else if (activeTab === 'tips') {
      resetTips();
      loadMoreTips(true);
    } else if (activeTab === 'messages') {
      // Auto-refresh messages tab to show latest reactions
      resetTips();
      loadMoreTips(true);
    } else if (activeTab === 'library') {
      resetLibrary();
      loadMoreSongs(true);
    } else if (activeTab === 'wallet') {
      resetWalletTx();
      loadMoreWalletTx();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, tipsStatus, libraryGenre, librarySearch]);

  const loadDashboardData = async () => {
    // Check if user is authenticated
    if (!user || !user._id) {
      console.warn('Cannot load dashboard data: user not authenticated');
      return;
    }
    
    // Check if API token exists
    if (!api.token) {
      console.warn('Cannot load dashboard data: no API token');
      return;
    }
    
    setIsLoading(true);
    let finished = false;
    const safetyTimeout = setTimeout(() => {
      if (!finished) setIsLoading(false);
    }, 1200);
    try {
      const [statsResponse, tipsResponse, walletResponse] = await Promise.all([
        api.getDashboardStats(),
        api.getUserTips({ page: 1, limit: 5, type: 'sent' }),
        api.getWalletTransactions({ page: 1, limit: 5 })
      ]);
      
      // Set stats
      if (statsResponse && statsResponse.stats) {
        setDashboardData(prev => ({ 
          ...prev, 
          stats: {
            walletBalance: statsResponse.stats.walletBalance || 0,
            totalTips: statsResponse.stats.totalTips || 0,
            totalTipAmount: statsResponse.stats.totalTipAmount || 0,
            libraryCount: statsResponse.stats.libraryCount || 0
          }
        }));
      } else {
        console.warn('No stats in dashboard response:', statsResponse);
        setDashboardData(prev => ({
          ...prev,
          stats: {
            walletBalance: 0,
            totalTips: 0,
            totalTipAmount: 0,
            libraryCount: 0
          }
        }));
      }
      
      // Set tips history
      if (tipsResponse && tipsResponse.tips) {
        setDashboardData(prev => ({
          ...prev,
          tipsHistory: tipsResponse.tips || []
        }));
      }
      
      // Set wallet transactions
      if (walletResponse && walletResponse.transactions) {
        setDashboardData(prev => ({
          ...prev,
          walletTransactions: walletResponse.transactions || []
        }));
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      showToast('Failed to load dashboard data', 'error');
      // Set default values on error
      setDashboardData(prev => ({
        ...prev,
        stats: {
          walletBalance: 0,
          totalTips: 0,
          totalTipAmount: 0,
          libraryCount: 0
        },
        tipsHistory: [],
        walletTransactions: []
      }));
    } finally {
      finished = true;
      clearTimeout(safetyTimeout);
      setIsLoading(false);
    }
  };

  const resetTips = () => {
    setTipsPage(0);
    setHasMoreTips(true);
    setDashboardData(prev => ({ ...prev, tipsHistory: [] }));
  };

  const loadMoreTips = async (firstPage = false) => {
    try {
      if (!hasMoreTips && !firstPage) return;
      const nextPage = firstPage ? 1 : (tipsPage + 1);
      const response = await api.getUserTips({ page: nextPage, limit: 10, type: 'sent' });
      console.log('Tips history response:', response.tips?.map(t => ({ id: t.id, message: t.message, amount: t.amount })));
      setDashboardData(prev => ({
        ...prev,
        tipsHistory: firstPage ? (response.tips || []) : [...prev.tipsHistory, ...(response.tips || [])]
      }));
      setTipsPage(nextPage);
      setHasMoreTips(response.pagination?.page < response.pagination?.pages);
    } catch (error) {
      console.error('Error loading more tips:', error);
      showToast('Failed to load more tips', 'error');
    }
  };

  const resetArtists = () => {
    setArtistsPage(0);
    setHasMoreArtists(true);
    setDashboardData(prev => ({ ...prev, favoriteArtists: [] }));
  };

  const loadMoreArtists = async (firstPage = false) => {
    try {
      if (!hasMoreArtists && !firstPage) return;
      const nextPage = firstPage ? 1 : (artistsPage + 1);
      const response = await api.getFavoriteArtists({ page: nextPage, limit: 12 });
      setDashboardData(prev => ({
        ...prev,
        favoriteArtists: firstPage ? response.favoriteArtists : [...prev.favoriteArtists, ...response.favoriteArtists]
      }));
      setArtistsPage(nextPage);
      setHasMoreArtists(response.pagination.page < response.pagination.pages);
    } catch (error) {
      console.error('Error loading more artists:', error);
      showToast('Failed to load more artists', 'error');
    }
  };

  const resetLibrary = () => {
    setLibraryPage(0);
    setHasMoreSongs(true);
    setDashboardData(prev => ({ ...prev, songLibrary: [] }));
  };

  const reloadLibrary = async () => {
    setLibraryLoading(true);
    try {
      await loadMoreSongs(true);
    } finally {
      setLibraryLoading(false);
    }
  };

  // Wallet transactions
  const [walletTxPage, setWalletTxPage] = useState(1);
  const [hasMoreWalletTx, setHasMoreWalletTx] = useState(true);
  const resetWalletTx = () => {
    setWalletTxPage(0);
    setHasMoreWalletTx(true);
    setDashboardData(prev => ({ ...prev, walletTransactions: [] }));
  };
  const loadMoreWalletTx = async () => {
    try {
      if (!hasMoreWalletTx) return;
      const response = await api.getWalletTransactions({ page: walletTxPage + 1, limit: 10 });
      setDashboardData(prev => ({
        ...prev,
        walletTransactions: [...prev.walletTransactions, ...(response.transactions || [])]
      }));
      setWalletTxPage(walletTxPage + 1);
      setHasMoreWalletTx(response.pagination?.page < response.pagination?.pages);
    } catch (error) {
      console.error('Error loading wallet transactions:', error);
    }
  };

  const loadMoreSongs = async (firstPage = false) => {
    try {
      if (!hasMoreSongs && !firstPage) return;
      const nextPage = firstPage ? 1 : (libraryPage + 1);
      const response = await api.getSongLibrary({ page: nextPage, limit: 12, genre: libraryGenre || undefined, search: librarySearch || undefined });
      setDashboardData(prev => ({
        ...prev,
        songLibrary: firstPage ? response.songLibrary : [...prev.songLibrary, ...response.songLibrary]
      }));
      setLibraryPage(nextPage);
      setHasMoreSongs(response.pagination.page < response.pagination.pages);
    } catch (error) {
      console.error('Error loading more songs:', error);
      showToast('Failed to load more songs', 'error');
    }
  };

  // ===== Boombox logic =====
  useEffect(() => {
    if (!boomboxAudioRef.current) {
      boomboxAudioRef.current = new Audio();
    }
    const audio = boomboxAudioRef.current;
    // Hard-disable any implicit autoplay/looping
    audio.autoplay = false;
    audio.loop = false;
    const onTime = () => {
      try {
        setBoomboxProgress(audio.currentTime || 0);
        setBoomboxDuration(audio.duration || 0);
      } catch(_) {}
    };
    const onEnded = () => {
      // Stop completely; do not advance or replay
      try {
        audio.pause();
        audio.currentTime = 0;
        // Clear the source to avoid browsers attempting any implicit continuation
        audio.removeAttribute('src');
        audio.load();
      } catch(_) {}
      setIsBoomboxPlaying(false);
    };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('ended', onEnded);
    audio.volume = boomboxVolume;
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  useEffect(() => {
    if (boomboxAudioRef.current) boomboxAudioRef.current.volume = boomboxVolume;
  }, [boomboxVolume]);

  const normalizeFileUrl = (p) => {
    if (!p) return '';
    return p.startsWith('http') ? p : api.getFileURL(p);
  };

  const loadSongToBoombox = async (songId, fallbackMeta = {}) => {
    try {
      const res = await api.getSong(songId);
      const s = res?.song || {};
      const previewRaw = s.previewSong || s.previewUrl || '';
      const previewUrl = normalizeFileUrl(previewRaw);
      const cover = s.cover ? normalizeFileUrl(s.cover) : (fallbackMeta.cover || '');
      const meta = {
        id: songId,
        title: s.title || fallbackMeta.title || 'Unknown Title',
        artist: (s.artist && (s.artist.name || s.artist)) || fallbackMeta.artist || 'Unknown Artist',
        cover,
        previewUrl,
        duration: s.duration || 0
      };
      setBoomboxSong(meta);
      if (boomboxAudioRef.current) {
        const audio = boomboxAudioRef.current;
        // Explicitly stop any current playback and reset state before loading new source
        try { audio.pause(); } catch(_) {}
        try { audio.currentTime = 0; } catch(_) {}
        // Set the new source and play only this track
        audio.src = previewUrl;
        const p = audio.play();
        if (p && typeof p.catch === 'function') {
          p.catch(()=>{});
        }
        setIsBoomboxPlaying(true);
        setBoomboxProgress(0);
      }
      // Count play
      try { await api.incrementSongPlays(songId); } catch(_) {}
    } catch (e) {
      console.error('Boombox load error', e);
      showToast('Unable to play this song', 'error');
    }
  };

  const handleBoomboxDrop = async (e) => {
    e.preventDefault();
    try {
      const raw = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      const obj = raw ? JSON.parse(raw) : null;
      const songId = obj?.id || obj || null;
      if (!songId) return;
      await loadSongToBoombox(songId, obj || {});
    } catch (_) {}
  };

  const handleDragOver = (e) => { e.preventDefault(); };

  const toggleBoombox = async () => {
    const audio = boomboxAudioRef.current;
    if (!audio || !boomboxSong) return;
    if (isBoomboxPlaying) {
      audio.pause();
      setIsBoomboxPlaying(false);
    } else {
      await audio.play();
      setIsBoomboxPlaying(true);
    }
  };

  const seekBoombox = (val) => {
    const audio = boomboxAudioRef.current;
    try { audio.currentTime = Number(val) || 0; setBoomboxProgress(audio.currentTime); } catch(_) {}
  };

  const handleTopup = async (amount) => {
    try {
      // Ask for payment method
      const method = await selectPaymentMethod();
      if (!method) return;
      const res = await api.topupWallet(amount, method);
      if (res && (res.simulated || res.requiresSetup)) {
        showToast('Payment provider not fully configured. Transaction pending; no funds credited.', 'error');
      } else {
        showToast(`Top-up initiated with ${method}!`);
      }
      // Do not mutate wallet balance here; wait for webhook to credit funds.
      // Refresh recent transactions list so user sees the pending record.
      resetWalletTx();
      loadMoreWalletTx();
    } catch (error) {
      console.error('Top-up error:', error);
      showToast(error.message || 'Failed to initiate top-up', 'error');
    }
  };

  const handleProfileUpdate = (updatedUser) => {
    // Update the user context
    if (window.updateUser) {
      window.updateUser(updatedUser);
    }
    showToast('Profile updated successfully!', 'success');
  };

  const handlePlaySong = async (songId) => {
    try {
      await api.incrementSongPlays(songId);
      showToast('Song started playing!', 'success');
    } catch (error) {
      console.error('Error playing song:', error);
      showToast('Failed to play song', 'error');
    }
  };

  const handleArtistClick = (artist) => {
    const slug = typeof slugify === 'function' ? slugify(artist.name) : artist.name;
    goTo('artist-profile', slug);
  };

  const handleUnfollow = async (artist) => {
    try {
      if (!api.isAuthenticated?.()) {
        showToast('Please log in to manage follows', 'error');
        return;
      }
      const isValidObjectId = (v) => typeof v === 'string' && /^[a-f\d]{24}$/i.test(v);
      let artistId = artist.id;
      if (!isValidObjectId(artistId)) {
        const res = await api.searchUsers({ q: artist.name, role: 'artist', limit: 1 });
        artistId = res.users && res.users[0]?._id;
      }
      if (!artistId) return;
      // Optimistic remove locally
      setDashboardData(prev => ({
        ...prev,
        favoriteArtists: prev.favoriteArtists.filter(a => a.id !== artist.id),
        stats: { ...prev.stats, totalArtists: Math.max(0, prev.stats.totalArtists - 1) }
      }));
      try {
        await api.unfollowArtist(artistId);
        // Refresh profile snapshot in background
        const me = await api.getProfile();
        if (me && me.user) window.updateUser?.(me.user);
      } catch (err) {
        // Revert on failure
        setDashboardData(prev => ({
          ...prev,
          favoriteArtists: [artist, ...prev.favoriteArtists],
          stats: { ...prev.stats, totalArtists: prev.stats.totalArtists + 1 }
        }));
        throw err;
      }
      showToast(`Unfollowed ${artist.name}`);
    } catch (err) {
      console.error('Unfollow error:', err);
      showToast('Failed to unfollow', 'error');
    }
  };

  // Show loading if user is not authenticated yet
  if (!user || !user._id) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 animated-bg opacity-10"></div>
        <div className="relative z-10 pt-20 pb-24 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-white/70">Loading your dashboard...</p>
              <p className="text-white/40 text-sm mt-2">Please wait while we authenticate you</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (isLoading) {
    return (
      <main className="min-h-screen relative overflow-hidden">
        <div className="absolute inset-0 animated-bg opacity-10"></div>
        <div className="relative z-10 pt-20 pb-24 px-4 max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="spinner mx-auto mb-4"></div>
              <p className="text-white/60">Loading dashboard data...</p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 animated-bg opacity-10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10 pt-20 pb-24 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
                <span className="text-3xl">👤</span>
              </div>
              <div>
                <h1 className="text-4xl font-space text-white">Fan Dashboard</h1>
                <p className="text-white/60">Welcome back, {user?.name || 'Fan'}!</p>
              </div>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="btn btn-outline"
            >
              ✏️ Edit Profile
            </button>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div 
              className="card text-center cursor-pointer hover:scale-105 hover:bg-white/10 hover:shadow-lg transition-all duration-200 group"
              onClick={() => setActiveTab('wallet')}
              title="Click to view Wallet details"
            >
              <div className="text-3xl mb-2">💳</div>
              <div className="text-2xl text-white mb-1" style={{fontWeight:600}}>
                {formatCurrency(dashboardData.stats?.walletBalance)}
              </div>
              <div className="text-white/60 flex items-center justify-center gap-1">
                Wallet Balance
                <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">→</span>
              </div>
            </div>
            <div 
              className="card text-center cursor-pointer hover:scale-105 hover:bg-white/10 hover:shadow-lg transition-all duration-200 group"
              onClick={() => setActiveTab('tips')}
              title="Click to view Tips History"
            >
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl text-white mb-1" style={{fontWeight:600}}>
                {formatCurrency(dashboardData.stats?.totalTipAmount)}
              </div>
              <div className="text-white/60 flex items-center justify-center gap-1">
                Total Tips Given
                <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">→</span>
              </div>
            </div>
            <div 
              className="card text-center cursor-pointer hover:scale-105 hover:bg-white/10 hover:shadow-lg transition-all duration-200 group"
              onClick={() => setActiveTab('artists')}
              title="Click to view Artists You Follow"
            >
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl text-white mb-1" style={{fontWeight:600}}>
                {formatNumber(dashboardData.stats?.totalArtists || 0)}
              </div>
              <div className="text-white/60 flex items-center justify-center gap-1">
                Artists You Follow
                <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">→</span>
              </div>
            </div>
            <div 
              className="card text-center cursor-pointer hover:scale-105 hover:bg-white/10 hover:shadow-lg transition-all duration-200 group"
              onClick={() => setActiveTab('library')}
              title="Click to view Song Library"
            >
              <div className="text-3xl mb-2">🎵</div>
              <div className="text-2xl text-white mb-1" style={{fontWeight:600}}>
                {formatNumber(dashboardData.stats?.libraryCount || 0)}
              </div>
              <div className="text-white/60 flex items-center justify-center gap-1">
                Songs in Library
                <span className="text-xs text-white/40 group-hover:text-white/60 transition-colors">→</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="mb-8">
          <div className="flex border-b border-white/10 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'wallet', label: 'Wallet', icon: '💳' },
              { key: 'tips', label: 'Tips History', icon: '💰' },
              { key: 'messages', label: 'Messages', icon: '💬' },
              { key: 'artists', label: 'Artists You Follow', icon: '👥' },
              { key: 'library', label: 'Song Library', icon: '🎵' }
            ].map(tab => (
              <button
                key={tab.key}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 transition-all ${
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
        </section>

        {/* Tab Content */}
        <section>
          {activeTab === 'wallet' && (
            <div className="space-y-8">
              {/* Wallet Overview */}
              <div className="card">
                <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Wallet Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/80">Current Balance</span>
                      <span className="text-2xl font-bold text-white">
                        {formatCurrency(dashboardData.stats.walletBalance)}
                      </span>
                    </div>
                    <TopupWidget onTopup={handleTopup} />
                  </div>
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg text-white mb-4" style={{fontWeight:600}}>Quick Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/60">Total Tips Given</span>
                        <span className="text-white font-medium">
                          {formatCurrency(dashboardData.stats.totalTips)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Average Tip</span>
                        <span className="text-white font-medium">
                          {dashboardData.tipsHistory.length > 0 
                            ? formatCurrency(dashboardData.stats.totalTips / dashboardData.tipsHistory.length)
                            : '$0.00'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Artists Supported</span>
                        <span className="text-white font-medium">{dashboardData.stats.totalArtists}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

          {/* Recent Transactions (Wallet Top-ups only) */}
              <div className="card">
                <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Recent Transactions</h3>
            {dashboardData.walletTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💳</div>
                    <h3 className="text-xl text-white mb-2" style={{fontWeight:600}}>No transactions yet</h3>
                <p className="text-white/60">Your wallet top-ups will show here.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                {dashboardData.walletTransactions.slice(0, 5).map(tx => (
                  <div key={tx.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                      <span className="text-xl">💳</span>
                        </div>
                        <div className="flex-1">
                      <div className="text-white font-medium">Wallet Top-up ({tx.method})</div>
                      <div className="text-white/60 text-sm">{new Date(tx.date).toLocaleDateString()}</div>
                        </div>
                        <div className="text-right">
                      <div className="text-white font-medium">+{formatCurrency(tx.amount)}</div>
                      <div className={`text-xs mt-1 ${tx.status === 'completed' ? 'text-green-400' : 'text-yellow-400'}`}>{tx.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Recent Activity */}
              <div className="card">
                <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Recent Activity</h3>
                <div className="space-y-4">
                  {dashboardData.tipsHistory.slice(0, 3).map(tip => (
                    <div key={tip.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Tipped {tip.artist}</div>
                        <div className="text-white/60 text-sm">
                          {tip.song} • {formatCurrency(tip.amount)}
                        </div>
                      </div>
                      <div className="text-white/40 text-sm">
                        {new Date(tip.date).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                  {dashboardData.tipsHistory.length === 0 && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">📊</div>
                      <h3 className="text-xl text-white mb-2" style={{fontWeight:600}}>No recent activity</h3>
                      <p className="text-white/60">Start exploring and tipping artists to see activity here!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <button
                    className="btn btn-primary text-lg py-4"
                    onClick={() => goTo('artists')}
                  >
                    🎤 Discover New Artists
                  </button>
                  <button
                    className="btn btn-outline text-lg py-4"
                    onClick={() => setShowEditProfile(true)}
                  >
                    ✏️ Edit Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="card">
              <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Tips History</h3>
              <div className="flex items-center gap-3 mb-4">
                <select className="input" value={tipsStatus} onChange={(e) => setTipsStatus(e.target.value)}>
                  <option value="">All statuses</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
                <button className="btn btn-ghost" onClick={() => { resetTips(); loadMoreTips(true); }}>Refresh</button>
              </div>
              {dashboardData.tipsHistory.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl text-white mb-2" style={{fontWeight:600}}>No tips yet</h3>
                  <p className="text-white/60">Start supporting artists to see your tips here!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {dashboardData.tipsHistory.map(tip => (
                    <div key={tip.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{tip.artist}</div>
                        <div className="text-white/60 text-sm">{tip.song}</div>
                        {tip.message && (
                          <div className="text-white/40 text-sm mt-1">"{tip.message}"</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-white" style={{fontWeight:600}}>{formatCurrency(tip.amount)}</div>
                        <div className="text-white/40 text-sm">
                          {new Date(tip.date).toLocaleDateString()}
                        </div>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs ${
                        tip.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                      }`}>
                        {tip.status}
                      </div>
                    </div>
                  ))}
                  
                   {hasMoreTips && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMoreTips}
                        className="btn btn-outline"
                      >
                        Load More Tips
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="card">
              <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Messages Sent</h3>
              <div className="flex items-center gap-3 mb-4">
                <button className="btn btn-ghost" onClick={() => { resetTips(); loadMoreTips(true); }}>Refresh</button>
              </div>
              {dashboardData.tipsHistory.filter(tip => tip.message && tip.message.trim()).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl text-white mb-2" style={{fontWeight:600}}>No messages sent yet</h3>
                  <p className="text-white/60">Send messages with your tips to see them here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dashboardData.tipsHistory
                    .filter(tip => tip.message && tip.message.trim())
                    .map(tip => (
                    <div key={tip.id} className="flex flex-col message-animate">
                      {/* Message Header */}
                      <div className="flex items-center gap-3 mb-2 px-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm text-white">🎤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">{tip.artist}</span>
                            <span className="text-primary font-bold text-sm">{formatCurrency(tip.amount)}</span>
                          </div>
                          {tip.song && (
                            <div className="text-white/60 text-xs">For: {tip.song}</div>
                          )}
                        </div>
                        <div className="text-white/40 text-xs">
                          {new Date(tip.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {/* Message Bubble */}
                      <div className="flex justify-end">
                        <div className="max-w-[80%] bg-gradient-to-r from-green-500/20 to-blue-600/20 border border-green-500/30 rounded-2xl rounded-tr-md px-4 py-3 relative message-bubble">
                          <div className="text-white text-sm leading-relaxed">
                            {tip.message}
                          </div>
                          
                          {/* Message Status & Reaction */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-green-400 text-xs">✓</span>
                              <span className="text-green-400 text-xs">✓</span>
                            </div>
                            {tip.reaction && (
                              <div className="flex items-center gap-1">
                                <span className="text-2xl reaction-animate">{tip.reaction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Tip Status */}
                      <div className="flex justify-end mt-1 px-2">
                        <div className={`px-2 py-1 rounded-full text-xs ${
                          tip.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tip.status}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'artists' && (
            <div className="card">
              <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Artists You Follow</h3>
              <div className="flex items-center justify-between mb-4">
                <div className="text-white/60 text-sm">Total: {formatNumber(dashboardData.stats.totalArtists)}</div>
                <button className="btn btn-ghost" onClick={() => { resetArtists(); loadMoreArtists(true); }}>Refresh</button>
              </div>
              {dashboardData.favoriteArtists.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-xl text-white mb-2" style={{fontWeight:600}}>No favorite artists yet</h3>
                  <p className="text-white/60">Follow artists to see them here!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {dashboardData.favoriteArtists.map(artist => (
                    <div 
                      key={artist.id} 
                      className="card p-6 hover:scale-105 transition-all cursor-pointer" 
                      onClick={() => handleArtistClick(artist)}
                    >
                      <div className="w-16 h-16 rounded-xl overflow-hidden mx-auto mb-4 bg-white/5 flex items-center justify-center">
                        <img 
                          src={getAvatarURL(artist.avatar)} 
                          alt={artist.name}
                          className="w-full h-full object-cover"
                          loading="lazy"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-full h-full flex items-center justify-center text-2xl" style={{display: 'none'}}>
                          🎤
                        </div>
                      </div>
                        <h4 className="text-xl text-white text-center mb-2" style={{fontWeight:600}}>{artist.name}</h4>
                      {artist.bio && (
                        <p className="text-white/60 text-sm text-center mb-4 line-clamp-2">{artist.bio}</p>
                      )}
                      <div className="grid grid-cols-2 gap-4 text-center text-sm">
                        <div>
                          <div className="text-white font-medium">{formatNumber(artist.followers)}</div>
                          <div className="text-white/60">Followers</div>
                        </div>
                        <div>
                          <div className="text-white font-medium">{artist.songs}</div>
                          <div className="text-white/60">Songs</div>
                        </div>
                      </div>
                      <div className="text-center mt-3">
                        <button className="btn btn-ghost text-sm" onClick={(e) => { e.stopPropagation(); handleUnfollow(artist); }}>
                          Unfollow
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  {hasMoreArtists && (
                    <div className="col-span-full text-center pt-4">
                      <button
                        onClick={() => loadMoreArtists(false)}
                        className="btn btn-outline"
                      >
                        Load More Artists
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'library' && (
            <div className="card">
              <h3 className="text-2xl text-white mb-6" style={{fontWeight:600}}>Song Library</h3>

              {/* Boombox player */}
              <div
                className={`boombox ${isBoomboxPlaying ? 'playing' : ''} mb-6`}
                onDragOver={handleDragOver}
                onDrop={handleBoomboxDrop}
              >
                <div className="boombox-left">
                  <div className="vinyl">
                    {boomboxSong?.cover ? (
                      <img src={boomboxSong.cover} className="vinyl-label" />
                    ) : (
                      <div className="vinyl-label-fallback"></div>
                    )}
                  </div>
                </div>
                <div className="boombox-right">
                  <div className="track-meta">
                    <div className="title">{boomboxSong?.title || 'Drag a song here to play'}</div>
                    {boomboxSong?.artist && (
                      <div className="artist">{boomboxSong.artist}</div>
                    )}
                  </div>
                  <div className="boombox-controls">
                    <div className="time">{formatDuration(Math.floor(boomboxProgress||0))}</div>
                    <input
                      className="progress"
                      type="range"
                      min="0"
                      max={Math.max(1, Math.floor(boomboxDuration||0))}
                      value={Math.floor(boomboxProgress||0)}
                      onChange={(e)=>seekBoombox(e.target.value)}
                    />
                    <div className="time">{formatDuration(Math.floor(boomboxDuration||0))}</div>
                    <button className="btn btn-primary" onClick={toggleBoombox} disabled={!boomboxSong}>
                      {isBoomboxPlaying ? '⏸ Pause' : '▶️ Play'}
                    </button>
                    <input
                      className="volume"
                      type="range"
                      min="0" max="1" step="0.01"
                      value={boomboxVolume}
                      onChange={(e)=>setBoomboxVolume(parseFloat(e.target.value))}
                      title="Volume"
                    />
                  </div>
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-3 mb-4">
                <input className="input" placeholder="Search title or genre" value={librarySearch} onChange={(e) => setLibrarySearch(e.target.value)} />
                <input className="input" placeholder="Filter by genre" value={libraryGenre} onChange={(e) => setLibraryGenre(e.target.value)} />
                <div className="flex gap-2">
                  <button className="btn btn-primary w-full" onClick={() => { reloadLibrary(); }}>Apply</button>
                  <button className="btn btn-ghost" onClick={() => { setLibraryGenre(''); setLibrarySearch(''); reloadLibrary(); }}>Clear</button>
                </div>
              </div>
              {dashboardData.songLibrary.length === 0 && !libraryLoading ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">🎵</div>
                  <h3 className="text-xl text-white mb-2" style={{fontWeight:600}}>No songs in library</h3>
                  <p className="text-white/60">Follow artists to add their songs to your library!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {libraryLoading && (
                    <div className="text-center text-white/60">Loading…</div>
                  )}
                  {dashboardData.songLibrary.map(song => (
                    <div
                      key={song.id}
                      className="flex items-center gap-4 p-4 bg-white/5 rounded-lg"
                      draggable
                      onDragStart={(e)=>{
                        const payload = JSON.stringify({ id: song.id, title: song.title, artist: song.artist, cover: (song.cover && (String(song.cover).startsWith('http')||String(song.cover).startsWith('/uploads')) ? (String(song.cover).startsWith('http') ? song.cover : api.getFileURL(song.cover)) : '') });
                        e.dataTransfer.setData('application/json', payload);
                      }}
                    >
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                        {song.cover && (String(song.cover).startsWith('http') || String(song.cover).startsWith('/uploads')) ? (
                          <img 
                            src={String(song.cover).startsWith('http') ? song.cover : api.getFileURL(song.cover)} 
                            alt={song.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-xl">🎵</span>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">{song.title}</div>
                        <div className="text-white/60 text-sm">{song.artist} • {song.genre}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-white">{formatDuration(song.duration)}</div>
                        <div className="text-white/60">{formatNumber(song.plays)} plays</div>
                      </div>
                      <button 
                        className="btn btn-primary text-sm"
                        onClick={() => loadSongToBoombox(song.id, { title: song.title, artist: song.artist, cover: (song.cover && (String(song.cover).startsWith('http')||String(song.cover).startsWith('/uploads')) ? (String(song.cover).startsWith('http') ? song.cover : api.getFileURL(song.cover)) : '') })}
                      >
                        ▶️ Play
                      </button>
                    </div>
                  ))}
                  
                  {hasMoreSongs && (
                    <div className="text-center pt-4">
                      <button
                        onClick={loadMoreSongs}
                        className="btn btn-outline"
                      >
                        Load More Songs
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Edit Profile Modal */}
      {showEditProfile && (
        <EditProfile
          onClose={() => setShowEditProfile(false)}
          onSave={handleProfileUpdate}
        />
      )}
      <PaymentMethodModal />
    </main>
  );
}

// Export component
window.FanDashboard = FanDashboard; 

// Lightweight payment method selector (modal)
function selectPaymentMethod() {
  return new Promise((resolve) => {
    const evtName = 'payment:select';
    function listener(e) {
      window.removeEventListener(evtName, listener);
      resolve(e.detail && e.detail.method);
    }
    window.addEventListener(evtName, listener, { once: true });
    window.dispatchEvent(new CustomEvent('payment:open'));
  });
}

function PaymentMethodModal() {
  const [open, setOpen] = React.useState(false);
  React.useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener('payment:open', onOpen);
    return () => window.removeEventListener('payment:open', onOpen);
  }, []);
  if (!open) return null;
  const choose = (method) => {
    setOpen(false);
    window.dispatchEvent(new CustomEvent('payment:select', { detail: { method } }));
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="card p-6 w-96">
        <h3 className="text-xl text-white mb-3" style={{fontWeight:600}}>Select Payment Method</h3>
        <p className="text-white/60 mb-4">Choose a provider to add funds to your wallet.</p>
        <div className="space-y-3">
          <button className="btn btn-primary w-full" onClick={() => choose('stripe')}>Stripe</button>
          <button className="btn btn-outline w-full" onClick={() => choose('paypal')}>PayPal</button>
          <button className="btn btn-outline w-full" onClick={() => choose('venmo')}>Venmo</button>
          <button className="btn btn-ghost w-full" onClick={() => choose(null)}>Cancel</button>
        </div>
        <div className="text-white/40 text-xs mt-4">
          Note: Payments are simulated in development.
        </div>
      </div>
    </div>
  );
}

function TopupWidget({ onTopup }) {
  const [amount, setAmount] = React.useState(25);
  const quick = [10, 25, 50, 100];
  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {quick.map(v => (
          <button key={v} className={`btn ${amount===v ? 'btn-primary' : 'btn-outline'}`} onClick={() => setAmount(v)}>
            ${v}
          </button>
        ))}
      </div>
      <div className="flex gap-2 items-center">
        <input className="input flex-1" type="number" min="1" step="1" value={amount} onChange={(e)=> setAmount(Math.max(1, parseInt(e.target.value||'0',10)))} placeholder="Custom amount" />
        <button className="btn btn-primary" onClick={() => onTopup(amount)}>Add Top-up</button>
      </div>
      <div className="text-white/40 text-xs">Funds are credited after payment confirmation.</div>
    </div>
  );
}