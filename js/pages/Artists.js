// ===== ARTISTS PAGE COMPONENT =====
function ArtistsPage({ goTo }) {
  const { showToast } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('all');
  const [sortBy, setSortBy] = useState('popular');
  const genreRef = React.useRef(null);
  const sortRef = React.useRef(null);
  const [genreExpanded, setGenreExpanded] = useState(false);
  const [sortExpanded, setSortExpanded] = useState(false);
  const [genreTop, setGenreTop] = useState(0);
  const [sortTop, setSortTop] = useState(0);
  const [artists, setArtists] = useState([]);
  const [totalArtists, setTotalArtists] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [pendingMap, setPendingMap] = useState({});
  const [currentPage, setCurrentPage] = useState(1);

  const isMobile = () => {
    try { return window.innerWidth <= 640; } catch (_) { return false; }
  };

  const expandSelect = (ref, setExpanded, setTop) => {
    if (!isMobile() || !ref?.current) return;
    const rect = ref.current.getBoundingClientRect();
    setTop(Math.round(rect.top + window.scrollY));
    setExpanded(true);
  };

  const collapseSelect = (setExpanded) => setExpanded(false);

  // Load artists from API when filters change
  useEffect(() => {
    let cancelled = false;
    let retryCount = 0;
    const maxRetries = 2;
    let loadingTimeout;
    
    async function load() {
      console.log('Loading artists with filters:', { searchTerm, selectedGenre, sortBy }); // Debug log
      setLoading(true); 
      setError('');
      
      // Set a maximum loading time to prevent infinite loading
      loadingTimeout = setTimeout(() => {
        if (!cancelled) {
          console.log('Loading timeout reached'); // Debug log
          setLoading(false);
          setError('Loading timeout. Please refresh the page.');
        }
      }, 15000); // 15 second max loading time
      
      try {
        const mapSort = (val) => {
          switch (val) {
            case 'popular': return { sortBy: 'followers', sortOrder: 'desc' };
            case 'newest': return { sortBy: 'latest', sortOrder: 'desc' };
            case 'tips': return { sortBy: 'tips', sortOrder: 'desc' };
            default: return { sortBy: 'followers', sortOrder: 'desc' };
          }
        };
        const { sortBy: sb, sortOrder } = mapSort(sortBy);
        const params = { page: 1, limit: 12, sortBy: sb, sortOrder };
        if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
        if (selectedGenre && selectedGenre !== 'all') params.genre = selectedGenre;
        
        console.log('API params:', params); // Debug log
        
        const res = await api.getArtists(params, { timeoutMs: 10000 }); // 10 second timeout for artists
        if (cancelled) return;
        
        console.log('API response:', res); // Debug log
        
        clearTimeout(loadingTimeout); // Clear timeout on success
        
        setArtists(Array.isArray(res.artists) ? res.artists : []);
        setTotalArtists(res?.pagination?.total ?? (Array.isArray(res.artists) ? res.artists.length : 0));
        setCurrentPage(1); // Reset to first page when filters change
        retryCount = 0; // Reset retry count on success
      } catch (e) {
        if (cancelled) return;
        
        clearTimeout(loadingTimeout); // Clear timeout on error
        
        console.error('Artists load error:', e);
        
        // Retry logic for network errors
        if (retryCount < maxRetries && (e.name === 'AbortError' || e.message.includes('fetch'))) {
          retryCount++;
          console.log(`Retrying artists load (${retryCount}/${maxRetries})...`);
          setTimeout(load, 1000 * retryCount); // Exponential backoff
          return;
        }
        
        setError(`Failed to load artists: ${e.message || 'Unknown error'}`);
        setArtists([]);
        setTotalArtists(0);
      } finally {
        if (!cancelled) {
          setLoading(false);
          console.log('Loading finished'); // Debug log
        }
      }
    }
    
    const t = setTimeout(load, 200);
    return () => { 
      cancelled = true; 
      clearTimeout(t); 
      clearTimeout(loadingTimeout);
    };
  }, [searchTerm, selectedGenre, sortBy]);

  const genres = ['all', 'Rock', 'Pop', 'Hip Hop', 'EDM', 'Jazz', 'Country', 'Alternative', 'Classical', 'Indie', 'Electronic'];

  // Load more artists function
  const loadMoreArtists = async () => {
    if (loadingMore || artists.length >= totalArtists) return;
    
    setLoadingMore(true);
    try {
      const nextPage = currentPage + 1;
      const mapSort = (val) => {
        switch (val) {
          case 'popular': return { sortBy: 'followers', sortOrder: 'desc' };
          case 'newest': return { sortBy: 'latest', sortOrder: 'desc' };
          case 'tips': return { sortBy: 'tips', sortOrder: 'desc' };
          default: return { sortBy: 'followers', sortOrder: 'desc' };
        }
      };
      const { sortBy: sb, sortOrder } = mapSort(sortBy);
      const params = { page: nextPage, limit: 12, sortBy: sb, sortOrder };
      if (searchTerm && searchTerm.trim()) params.search = searchTerm.trim();
      if (selectedGenre && selectedGenre !== 'all') params.genre = selectedGenre;
      
      const res = await api.getArtists(params, { timeoutMs: 10000 });
      if (res && Array.isArray(res.artists)) {
        setArtists(prev => [...prev, ...res.artists]);
        setCurrentPage(nextPage);
      }
    } catch (error) {
      console.error('Load more error:', error);
      showToast('Failed to load more artists', 'error');
    } finally {
      setLoadingMore(false);
    }
  };

  // Follow/unfollow toggle
  const toggleFollow = async (e, card) => {
    e.stopPropagation();
    try {
      if (!api.isAuthenticated?.()) { showToast('Please log in to follow artists', 'error'); return; }
      const id = card._id || card.id; if (!id || pendingMap[id]) return;
      setPendingMap(m => ({ ...m, [id]: true }));
      const next = !card.isFollowing;
      // Optimistic UI - only update follow status, not follower count
      setArtists(prev => prev.map(a => (a._id === id ? { ...a, isFollowing: next } : a)));
      const resp = next ? await api.followArtist(id) : await api.unfollowArtist(id);
      const isFollowing = (resp && typeof resp.isFollowing === 'boolean') ? resp.isFollowing : next;
      // Update only the follow status, not follower count
      setArtists(prev => prev.map(a => (a._id === id ? { ...a, isFollowing } : a)));
      // Optimistic UI update - no need to fetch entire profile for follow status
      showToast(isFollowing ? `Following ${card.name}! 👥` : `Unfollowed ${card.name} 👋`);
    } catch (err) {
      console.error('Follow toggle error (list):', err);
      showToast('Unable to update follow status', 'error');
    } finally {
      const id = card._id || card.id; setPendingMap(m => { const { [id]:_, ...rest } = m; return rest; });
    }
  };

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
          <h1 className="text-5xl md:text-7xl font-space mb-6 text-white">Discover Artists</h1>
          <p className="text-xl text-white/70 mb-8 max-w-2xl mx-auto">
            Find your next favorite artist and have them alert you when they release new music
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
            <div className="grid grid-cols-2 gap-2 md:gap-4 max-w-xl mx-auto">
              {/* Genre Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-white/60 text-xs md:text-sm">Genre:</span>
                <select
                  ref={genreRef}
                  className={`input bg-transparent border-white/20 text-xs md:text-sm px-2 py-1 ${genreExpanded ? 'fixed left-0 w-screen max-w-none z-50' : ''}`}
                  style={genreExpanded ? { top: genreTop + 'px' } : undefined}
                  value={selectedGenre}
                  onFocus={() => expandSelect(genreRef, setGenreExpanded, setGenreTop)}
                  onClick={() => expandSelect(genreRef, setGenreExpanded, setGenreTop)}
                  onTouchStart={() => expandSelect(genreRef, setGenreExpanded, setGenreTop)}
                  onBlur={() => collapseSelect(setGenreExpanded)}
                  onChange={(e) => { setSelectedGenre(e.target.value); collapseSelect(setGenreExpanded); }}
                >
                  {genres.map(genre => (
                    <option key={genre} value={genre} className="bg-dark">
                      {genre === 'all' ? 'All Genres' : genre}
                    </option>
                  ))}
                </select>
                {loading && <span className="text-primary text-xs">⏳</span>}
              </div>
              
              {/* Sort Filter */}
              <div className="flex items-center gap-1.5 justify-end">
                <span className="text-white/60 text-xs md:text-sm whitespace-nowrap">Sort by:</span>
                <select
                  ref={sortRef}
                  className={`input bg-transparent border-white/20 text-xs md:text-sm px-2 py-1 ${sortExpanded ? 'fixed left-0 w-screen max-w-none z-50' : ''}`}
                  style={sortExpanded ? { top: sortTop + 'px' } : undefined}
                  value={sortBy}
                  onFocus={() => expandSelect(sortRef, setSortExpanded, setSortTop)}
                  onClick={() => expandSelect(sortRef, setSortExpanded, setSortTop)}
                  onTouchStart={() => expandSelect(sortRef, setSortExpanded, setSortTop)}
                  onBlur={() => collapseSelect(setSortExpanded)}
                  onChange={(e) => { setSortBy(e.target.value); collapseSelect(setSortExpanded); }}
                >
                  <option value="popular" className="bg-dark">Most Popular</option>
                  <option value="newest" className="bg-dark">Newest</option>
                  <option value="tips" className="bg-dark">Most Tips</option>
                </select>
                {loading && <span className="text-primary text-xs">⏳</span>}
              </div>
            </div>
          </div>
        </section>

        {/* Artists Grid */}
        <section>
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl text-white" style={{fontWeight:600}}>
              {loading ? 'Loading…' : `${artists.length} Artist${artists.length !== 1 ? 's' : ''} Found`}
            </h2>
            <div className="text-white/60">
              {loading ? '' : `Showing ${artists.length} of ${totalArtists} artists`}
            </div>
          </div>
          
          {error && (
            <div className="text-center py-6">
              <div className="text-red-400 mb-4">{error}</div>
              <button 
                onClick={() => window.location.reload()} 
                className="btn btn-outline text-sm"
              >
                Refresh Page
              </button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-20">
              <div className="spinner mx-auto mb-4"></div>
              <div className="text-white/70 mb-2">Loading artists...</div>
              <div className="text-white/40 text-sm">This may take a few seconds</div>
              {error && (
                <div className="mt-4">
                  <button 
                    onClick={() => window.location.reload()} 
                    className="btn btn-outline text-sm"
                  >
                    Retry Loading
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Loading Skeleton - Only show when actually loading and no artists yet */}
              {loading && artists.length === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="card animate-pulse">
                      <div className="w-full aspect-square gradient-primary rounded-xl mb-4 bg-white/10"></div>
                      <div className="text-center">
                        <div className="h-6 bg-white/10 rounded mb-2"></div>
                        <div className="h-4 bg-white/10 rounded mb-4 w-3/4 mx-auto"></div>
                        <div className="h-4 bg-white/10 rounded w-1/2 mx-auto"></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Actual Artists Grid */}
              {artists.length > 0 && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {artists.map(artist => (
                      <div
                        key={artist._id || artist.id}
                        className="card cursor-pointer hover:scale-105 transition-all group"
                        onClick={() => handleArtistClick(artist)}
                      >
                        {/* Artist Image */}
                        <div className="w-full aspect-square gradient-primary rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden">
                          <img 
                            src={getAvatarURL(artist.avatar)} 
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-4xl" style={{display: 'none'}}>
                            🎵
                          </div>
                        </div>
                        
                        {/* Artist Info */}
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-2">
                            <h3 className="text-xl text-white" style={{fontWeight:600}}>{artist.name}</h3>
                            {artist.isVerified && (
                              <span className="text-primary text-sm">✓</span>
                            )}
                          </div>
                          
                          <p className="text-white/60 text-sm mb-4 line-clamp-2">
                            {artist.bio}
                          </p>
                          
                          {/* Follower count hidden from frontend - only visible to artists in dashboard */}
                          
                          {/* Action Buttons */}
                          <div className="flex justify-center gap-2">
                            <button
                              className={`btn btn-sm ${artist.isFollowing ? 'btn-primary' : 'btn-outline'}`}
                              onClick={(e) => toggleFollow(e, artist)}
                              disabled={pendingMap[artist._id || artist.id]}
                            >
                              {pendingMap[artist._id || artist.id] ? (
                                <span className="spinner-sm"></span>
                              ) : artist.isFollowing ? (
                                'Following'
                              ) : (
                                'Follow'
                              )}
                            </button>
                            <button
                              className="btn btn-sm btn-outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                window.location.href = `/artist/${artist.slug || artist.name.toLowerCase().replace(/\s+/g, '-')}`;
                              }}
                              title="View Songs"
                            >
                              Songs
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Load More Button */}
                  {artists.length < totalArtists && (
                    <div className="text-center mt-8">
                      <button
                        onClick={loadMoreArtists}
                        disabled={loadingMore}
                        className="btn btn-outline px-8 py-3"
                      >
                        {loadingMore ? (
                          <>
                            <span className="spinner-sm mr-2"></span>
                            Loading...
                          </>
                        ) : (
                          `Load More Artists (${artists.length} of ${totalArtists})`
                        )}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
          
          {/* Show "No artists found" message when not loading and no results */}
          {!loading && artists.length === 0 && !error && (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-2xl text-white mb-2" style={{fontWeight:600}}>No artists found</h3>
              <p className="text-white/60">
                {selectedGenre !== 'all' 
                  ? `No artists found for "${selectedGenre}" genre. Try a different genre or search term.`
                  : 'Try adjusting your search or filters'
                }
              </p>
              <button 
                onClick={() => {
                  setSelectedGenre('all');
                  setSearchTerm('');
                  setSortBy('popular');
                }}
                className="btn btn-outline mt-4"
              >
                Clear Filters
              </button>
            </div>
          )}
        </section>

        {/* CTA Section */}
        <section className="text-center mt-20">
            <div className="card max-w-2xl mx-auto">
            <h2 className="text-3xl font-space mb-4" style={{fontWeight:600}}>Are You an Artist?</h2>
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

// Export component
window.ArtistsPage = ArtistsPage; 