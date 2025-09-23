// ===== ARTIST DASHBOARD COMPONENT =====
function ArtistDashboard({ goTo }) {
  const { user, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('overview');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState(0);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [isSubmittingWithdraw, setIsSubmittingWithdraw] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({ amount: 0, method: 'paypal', recipient: {} });
  const [uploadForm, setUploadForm] = useState({
    title: '',
    genre: '',
    description: ''
  });
  const [uploadFiles, setUploadFiles] = useState({
    previewSong: null,
    completeSongMp3: null,
    completeSongWav: null,
    coverArt: null
  });
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [mySongs, setMySongs] = useState([]);
  const [songsPage, setSongsPage] = useState(0);
  const [hasMoreSongs, setHasMoreSongs] = useState(true);
  const [isRefreshingSongs, setIsRefreshingSongs] = useState(false);
  const [receivedTips, setReceivedTips] = useState([]);
  const [isLoadingTips, setIsLoadingTips] = useState(false);
  const [stats, setStats] = useState({ totalEarnings: 0, totalTips: 0, totalPlays: 0, totalFollowers: 0, monthlyGrowth: 0, topSong: '' });
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [editSong, setEditSong] = useState(null);
  
  // Compute stats whenever songs or tips change
  useEffect(() => {
    const totalPlays = mySongs.reduce((sum, s) => sum + (Number(s.plays) || 0), 0);
    const totalTips = receivedTips.length;
    const totalEarnings = receivedTips.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const top = mySongs.length ? mySongs.slice().sort((a,b)=> (b.plays||0)-(a.plays||0))[0] : null;
    setStats({
      totalEarnings,
      totalTips,
      totalPlays,
      totalFollowers: Array.isArray(user?.followers) ? user.followers.length : (user?.followerCount || 0),
      monthlyGrowth: 0,
      topSong: top?.title || ''
    });
  }, [mySongs, receivedTips, user]);

  // Fetch wallet balance on component mount
  useEffect(() => {
    getWalletBalance();
    // Preload songs and tips without clearing the UI
    if (mySongs.length === 0) {
      loadMoreMySongs(true);
    }
    loadReceivedTips();
  }, []);

  // When opening edit modal, prefill form from selected song
  useEffect(() => {
    if (showUploadModal && editSong) {
      setUploadForm({
        title: editSong.title || '',
        genre: editSong.genre || '',
        description: editSong.description || ''
      });
      setUploadFiles({ previewSong: null, completeSongMp3: null, completeSongWav: null, coverArt: null });
    }
  }, [showUploadModal, editSong]);

  useEffect(() => {
    if (activeTab === 'overview' || activeTab === 'upload') {
      // Background refresh without clearing current list
      refreshMySongsInPlace();
    }
    if (activeTab === 'tips' || activeTab === 'messages') {
      loadReceivedTips();
    }
  }, [activeTab]);

  const resetMySongs = () => {
    setSongsPage(0);
    setHasMoreSongs(true);
    setMySongs([]);
  };

  const loadMoreMySongs = async (firstPage = false) => {
    try {
      if (!user?._id) return;
      if (!hasMoreSongs && !firstPage) return;
      const nextPage = firstPage ? 1 : (songsPage + 1);
      const res = await api.getArtistSongs(user._id, { page: nextPage, limit: 12 });
      setMySongs(prev => firstPage ? (res.songs || []) : [...prev, ...(res.songs || [])]);
      setSongsPage(nextPage);
      setHasMoreSongs(res.pagination?.page < res.pagination?.pages);
    } catch (e) {
      console.error('Load my songs error:', e);
      setMySongs([]);
    }
  };

  const refreshMySongsInPlace = async () => {
    if (!user?._id) return;
    try {
      setIsRefreshingSongs(true);
      const res = await api.getArtistSongs(user._id, { page: 1, limit: Math.max(12, mySongs.length || 12) });
      setMySongs(res.songs || []);
      setSongsPage(1);
      setHasMoreSongs(res.pagination?.page < res.pagination?.pages);
    } catch (e) {
      console.error('Refresh songs error:', e);
      setMySongs([]);
    } finally {
      setIsRefreshingSongs(false);
    }
  };

  const openEditSong = (song) => {
    setEditSong({ ...song });
    setShowUploadModal(true); // reuse modal UI for editing with prefill
    // Fetch full song details to ensure we have preview/mp3/wav/description
    setTimeout(async () => {
      try {
        const full = await api.getSong(song._id || song.id);
        if (full?.song) {
          setEditSong(prev => ({ ...(prev || {}), ...(full.song || {}) }));
          setUploadForm({
            title: full.song.title || song.title || '',
            genre: full.song.genre || song.genre || '',
            description: full.song.description || ''
          });
        }
      } catch(_) {}
    }, 0);
  };

  const deleteSong = async (song) => {
    try {
      if (!confirm(`Delete "${song.title}"? This cannot be undone (tips will remain).`)) return;
      await api.deleteSong(song._id || song.id);
      setMySongs(prev => prev.filter(s => (s._id || s.id) !== (song._id || song.id)));
      showToast('Song deleted');
    } catch (e) {
      console.error('Delete song error:', e);
      showToast(e.message || 'Failed to delete song', 'error');
    }
  };

  const loadReceivedTips = async () => {
    try {
      setIsLoadingTips(true);
      const res = await api.getUserTips({ limit: 20, type: 'received' });
      console.log('Received tips:', res.tips);
      setReceivedTips(res.tips || []);
    } catch (e) {
      console.error('Load received tips error:', e);
      setReceivedTips([]);
    } finally {
      setIsLoadingTips(false);
    }
  };

  const handleReactToTip = async (tipId) => {
    try {
      // Create a custom emoji picker modal
      const emojis = ['❤️', '🔥', '🎵', '👏', '🙏', '💯', '✨', '🎉', '😍', '🤩', '🥰', '😎', '🤘', '🎸', '🎹', '🎤'];
      
      // Create modal element
      const modal = document.createElement('div');
      modal.className = 'fixed inset-0 z-50 backdrop';
      modal.innerHTML = `
        <div class="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <div class="absolute inset-0 flex items-center justify-center p-4">
          <div class="glass-dark rounded-2xl p-6 max-w-sm w-full animate-slideInUp">
            <div class="text-center mb-6">
              <h3 class="text-xl font-bold text-white mb-2">React to Message</h3>
              <p class="text-white/60">Choose an emoji reaction</p>
            </div>
            <div class="grid grid-cols-4 gap-3">
              ${emojis.map(emoji => `
                <button class="emoji-btn w-12 h-12 text-2xl hover:bg-white/10 rounded-lg transition-all hover:scale-110" data-emoji="${emoji}">
                  ${emoji}
                </button>
              `).join('')}
            </div>
            <div class="mt-6 text-center">
              <button class="btn btn-ghost" onclick="this.closest('.backdrop').remove()">Cancel</button>
            </div>
          </div>
        </div>
      `;
      
      // Add event listeners
      modal.querySelectorAll('.emoji-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
          const selectedEmoji = btn.dataset.emoji;
          console.log('Selected emoji:', selectedEmoji, 'Type:', typeof selectedEmoji, 'Length:', selectedEmoji.length);
          try {
            await api.reactToTip(tipId, selectedEmoji);
            showToast('Reaction added! 💫');
            // Refresh tips to show the new reaction
            loadReceivedTips();
          } catch (error) {
            console.error('Error adding reaction:', error);
            showToast('Failed to add reaction', 'error');
          }
          modal.remove();
        });
      });
      
      // Add to DOM
      document.body.appendChild(modal);
      
      // Close on backdrop click
      modal.querySelector('.bg-black\\/50').addEventListener('click', () => modal.remove());
      
    } catch (error) {
      console.error('Error adding reaction:', error);
      showToast('Failed to add reaction', 'error');
    }
  };

  const getWalletBalance = async () => {
    setIsLoadingWallet(true);
    try {
      const response = await api.getDashboardStats();
      setWalletBalance(response.stats?.walletBalance || 0);
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      showToast('Failed to load wallet balance', 'error');
      setWalletBalance(0);
    } finally {
      setIsLoadingWallet(false);
    }
  };

  const openWithdrawModal = (amount) => {
    if (!amount || amount <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    if (amount > walletBalance) {
      showToast('Insufficient balance for withdrawal', 'error');
      return;
    }
    setWithdrawForm({ amount, method: 'paypal', recipient: {} });
    setShowWithdrawModal(true);
  };

  const submitWithdrawal = async () => {
    try {
      if (!withdrawForm.amount || withdrawForm.amount <= 0) {
        showToast('Enter a valid amount', 'error');
        return;
      }
      if (withdrawForm.amount > walletBalance) {
        showToast('Insufficient balance for withdrawal', 'error');
        return;
      }
      // Validate recipient fields based on method
      const m = withdrawForm.method;
      const r = withdrawForm.recipient || {};
      if (m === 'paypal' && !r.email) { showToast('PayPal email is required', 'error'); return; }
      if (m === 'venmo' && !r.username) { showToast('Venmo username is required', 'error'); return; }
      if (m === 'cashapp' && !r.cashtag) { showToast('Cash App $Cashtag is required', 'error'); return; }
      if (m === 'bank' && (!r.accountNumber || !r.routingNumber)) { showToast('Bank account and routing number are required', 'error'); return; }
      if (m === 'wise' && !(r.iban || r.accountNumber)) { showToast('Wise requires IBAN or account number', 'error'); return; }

      setIsSubmittingWithdraw(true);
      await api.requestWithdrawal(withdrawForm.amount, withdrawForm.method, withdrawForm.recipient);
      showToast(`Withdrawal requested: $${withdrawForm.amount} via ${withdrawForm.method}`);
      setShowWithdrawModal(false);
      setWithdrawForm({ amount: 0, method: 'paypal', recipient: {} });
      await getWalletBalance();
    } catch (error) {
      console.error('Withdrawal error:', error);
      showToast(error.message || 'Failed to process withdrawal', 'error');
    } finally {
      setIsSubmittingWithdraw(false);
    }
  };

  // Save single social link key to backend and update global user
  const updateSocialLink = async (key, value) => {
    try {
      const nextLinks = { ...(user?.socialLinks || {}), [key]: value };
      const u = await api.completeProfile({ socialLinks: nextLinks });
      window.updateUser?.(u.user);
      showToast('Saved', 'success');
    } catch (err) {
      console.error('Save social link error:', err);
      showToast('Failed to save link', 'error');
    }
  };

  // Ensure fresh state when opening a brand new upload
  const openNewSongModal = () => {
    if (isUploading) return;
    setEditSong(null);
    setUploadForm({ title: '', genre: '', description: '' });
    setUploadFiles({ previewSong: null, completeSongMp3: null, completeSongWav: null, coverArt: null });
    setShowUploadModal(true);
  };

  // Close modal and clear edit state so next open defaults to create
  const closeUploadModal = () => {
    if (isUploading) return;
    setShowUploadModal(false);
    setEditSong(null);
  };

  const handleFileChange = (field, file) => {
    setUploadFiles(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    // Derive values for edit/create
    const isEdit = !!editSong;
    const titleValue = uploadForm.title || (isEdit ? editSong.title : '');
    const genreValue = uploadForm.genre || (isEdit ? editSong.genre : '');

    // Validate required fields
    if (!titleValue || !genreValue) {
      showToast('Please fill in all required fields', 'error');
      return;
    }
    // For create, require audio files; for edit, allow skipping file re-upload
    if (!isEdit) {
      if (!uploadFiles.previewSong || !uploadFiles.completeSongMp3) {
        showToast('Preview song and complete song MP3 are required', 'error');
        return;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      if (uploadFiles.previewSong) formData.append('previewSong', uploadFiles.previewSong);
      if (uploadFiles.completeSongMp3) formData.append('completeSongMp3', uploadFiles.completeSongMp3);
      if (uploadFiles.completeSongWav) {
        formData.append('completeSongWav', uploadFiles.completeSongWav);
      }
      if (uploadFiles.coverArt) {
        formData.append('coverArt', uploadFiles.coverArt);
      }

      // Upload files first (only if any selected)
      let uploadResult = { files: {} };
      const hasAnyFile = uploadFiles.previewSong || uploadFiles.completeSongMp3 || uploadFiles.completeSongWav || uploadFiles.coverArt;
      if (hasAnyFile) {
        setUploadProgress(30);
        console.log('Uploading files to:', `${api.baseURL}/upload/song`);
        console.log('FormData contents:', Array.from(formData.entries()));
        uploadResult = await api.uploadSongFiles(formData);
      }
      
      setUploadProgress(60);

      // Create or update song record
      const songData = {
        title: titleValue,
        genre: genreValue,
        duration: 180, // Default duration, could be calculated from file
        previewSong: uploadResult.files.previewSong?.url || (editSong?.previewSong || undefined),
        completeSongMp3: uploadResult.files.completeSongMp3?.url || (editSong?.completeSongMp3 || undefined),
        completeSongWav: uploadResult.files.completeSongWav?.url || (editSong?.completeSongWav || null),
        cover: uploadResult.files.coverArt?.url || editSong?.cover || 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
        description: uploadForm.description !== '' ? uploadForm.description : (editSong?.description || '')
      };

      setUploadProgress(80);
      let created = null;
      if (isEdit) {
        const saved = await api.updateSong(editSong._id || editSong.id, songData);
        setMySongs(prev => prev.map(s => (s._id||s.id) === (editSong._id||editSong.id) ? { ...(s), ...saved.song } : s));
      } else {
        created = await api.uploadSong(songData);
      }
      
      setUploadProgress(100);
      showToast(isEdit ? 'Song updated successfully! 🎵' : 'Song uploaded successfully! 🎵', 'success');
      
      // Optimistically show the new song instantly in lists
      if (!editSong && created?.song) {
        setMySongs(prev => [created.song, ...prev]);
      }

      // Reset form
      setShowUploadModal(false);
      setEditSong(null);
      setUploadForm({
        title: '',
        genre: '',
        description: ''
      });
      setUploadFiles({
        previewSong: null,
        completeSongMp3: null,
        completeSongWav: null,
        coverArt: null
      });
      setUploadProgress(0);
      // Background refresh to reconcile pagination
      refreshMySongsInPlace();
      
    } catch (error) {
      console.error('Upload error:', error);
      showToast(error.message || 'Failed to upload song', 'error');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <main className="min-h-screen relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 animated-bg opacity-10"></div>
      <div className="absolute top-20 left-10 w-32 h-32 gradient-primary rounded-full blur-3xl animate-float"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 gradient-secondary rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      
      <div className="relative z-10 pt-20 pb-24 px-4 max-w-7xl mx-auto">
        {/* Header */}
        <section className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🎤</span>
            </div>
            <div>
              <h1 className="text-4xl font-space font-bold text-white">Artist Dashboard</h1>
              <p className="text-white/60">Welcome back, {user?.name || 'Artist'}!</p>
            </div>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
            <div className="card text-center">
              <div className="text-3xl mb-2">💳</div>
              <div className="text-2xl font-bold text-white mb-1">
                {isLoadingWallet ? (
                  <div className="spinner mx-auto"></div>
                ) : (
                  formatCurrency(walletBalance)
                )}
              </div>
              <div className="text-white/60">Available Balance</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">💰</div>
              <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.totalEarnings)}</div>
              <div className="text-white/60">Total Earnings</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">👥</div>
              <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.totalFollowers)}</div>
              <div className="text-white/60">Followers</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">🎵</div>
              <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.totalPlays)}</div>
              <div className="text-white/60">Total Plays</div>
            </div>
            <div className="card text-center">
              <div className="text-3xl mb-2">📈</div>
              <div className="text-2xl font-bold text-white mb-1">+{stats.monthlyGrowth}%</div>
              <div className="text-white/60">Monthly Growth</div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <section className="mb-8">
          <div className="flex border-b border-white/10 overflow-x-auto">
            {[
              { key: 'overview', label: 'Overview', icon: '📊' },
              { key: 'earnings', label: 'Earnings', icon: '💳' },
              { key: 'upload', label: 'Upload Music', icon: '🎵' },
              { key: 'tips', label: 'Tips Received', icon: '💰' },
              { key: 'messages', label: 'Messages', icon: '💬' },
              { key: 'analytics', label: 'Analytics', icon: '📈' },
              { key: 'profile', label: 'Profile', icon: '👤' }
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
          {activeTab === 'earnings' && (
            <div className="space-y-8">
              {/* Earnings Overview */}
              <div className="card">
                <h3 className="text-2xl font-bold text-white mb-6">Earnings Overview</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-white/5 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/80">Available Balance</span>
                      <span className="text-2xl font-bold text-white">{formatCurrency(walletBalance)}</span>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-2">
                        <button className="btn btn-outline" disabled={walletBalance < 25} onClick={() => openWithdrawModal(25)}>$25</button>
                        <button className="btn btn-outline" disabled={walletBalance < 50} onClick={() => openWithdrawModal(50)}>$50</button>
                        <button className="btn btn-outline" disabled={walletBalance < 100} onClick={() => openWithdrawModal(100)}>$100</button>
                      </div>
                      <div className="flex gap-2">
                        <input id="customWithdraw" type="number" min="1" className="input flex-1" placeholder="Custom amount" />
                        <button className="btn btn-primary" onClick={() => { const v = Number(document.getElementById('customWithdraw').value); openWithdrawModal(v); }}>Withdraw</button>
                      </div>
                      <button
                        className="btn btn-ghost w-full"
                        onClick={() => openWithdrawModal(walletBalance)}
                        disabled={walletBalance < 20}
                      >
                        Withdraw All (Min $20)
                      </button>
                    </div>
                    {walletBalance < 20 && (
                      <p className="text-sm text-white/60 mt-2">
                        Minimum withdrawal amount is $20
                      </p>
                    )}
                  </div>
                  <div className="bg-white/5 rounded-lg p-6">
                    <h4 className="text-lg font-bold text-white mb-4">Earnings Stats</h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-white/60">Total Earnings</span>
                        <span className="text-white font-medium">{formatCurrency(stats.totalEarnings)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Total Tips</span>
                        <span className="text-white font-medium">{stats.totalTips}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Average Tip</span>
                        <span className="text-white font-medium">
                          {stats.totalTips > 0 ? formatCurrency(stats.totalEarnings / stats.totalTips) : '$0.00'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Platform Fee</span>
                        <span className="text-white font-medium">10%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Earnings */}
              <div className="card">
                <h3 className="text-2xl font-bold text-white mb-6">Recent Earnings</h3>
                {isLoadingTips ? (
                  <div className="text-center py-12 text-white/60">Loading…</div>
                ) : receivedTips.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💳</div>
                    <h3 className="text-xl font-bold text-white mb-2">No earnings yet</h3>
                    <p className="text-white/60">Start receiving tips to see your earnings here!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {receivedTips.slice(0, 10).map(tip => (
                      <div key={tip.id || tip._id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                          <span className="text-xl">💰</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">Tip from {tip.fan?.name || 'Anonymous'}</div>
                          <div className="text-white/60 text-sm">{tip.song?.title || '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-medium">+{formatCurrency((tip.amount || 0) * 0.90)}</div>
                          <div className="text-white/40 text-sm">{new Date(tip.createdAt).toLocaleDateString?.() || ''}</div>
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
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-2xl font-bold text-white mb-4">Recent Tips</h3>
                  <div className="space-y-3">
                    {receivedTips.slice(0, 3).map(tip => (
                      <div key={tip.id || tip._id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                        <div className="w-10 h-10 gradient-primary rounded-lg flex items-center justify-center">
                          <span className="text-lg">💰</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{tip.fan?.name || 'Anonymous'}</div>
                          <div className="text-white/60 text-sm">{tip.song?.title || '—'}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-white font-bold">{formatCurrency(tip.amount || 0)}</div>
                          <div className="text-white/40 text-xs">{new Date(tip.createdAt).toLocaleDateString?.() || ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="card">
                  <h3 className="text-2xl font-bold text-white mb-4">Performance</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Top Song</span>
                      <span className="text-white font-medium">{stats.topSong || '—'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Total Tips</span>
                      <span className="text-white font-medium">{formatNumber(stats.totalTips || 0)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-white/60">Monthly Growth</span>
                      <span className="text-green-400 font-medium">+{formatNumber(stats.monthlyGrowth || 0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="card">
                <h3 className="text-2xl font-bold text-white mb-6">Quick Actions</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button
                    className="btn btn-primary text-lg py-4"
                    onClick={() => setActiveTab('upload')}
                  >
                    🎵 Upload New Song
                  </button>
                  <button
                    className="btn btn-outline text-lg py-4"
                    onClick={() => goTo('artists')}
                  >
                    👥 View All Artists
                  </button>
                  <button
                    className="btn btn-outline text-lg py-4"
                    onClick={() => setActiveTab('profile')}
                  >
                    👤 Edit Profile
                  </button>
                </div>
              </div>

              {/* Your Songs */}
              <div className="card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-bold text-white">Your Songs</h3>
                  <button className="btn btn-ghost" onClick={() => { resetMySongs(); loadMoreMySongs(true); }}>Refresh</button>
                </div>
                {mySongs.length === 0 ? (
                  <div className="text-center py-10 text-white/60">No songs yet. Upload your first track!</div>
                ) : (
                  <div className="space-y-3">
                    {mySongs.map(song => (
                      <div key={song._id || song.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 rounded overflow-hidden bg-white/10 flex items-center justify-center">
                          {song.cover ? <img src={song.cover.startsWith('http') ? song.cover : api.getFileURL(song.cover)} className="w-full h-full object-cover" /> : <span>🎵</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{song.title}</div>
                          <div className="text-white/60 text-sm">{song.genre}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm text-white/60 mr-2">{formatNumber(song.plays || 0)} plays</div>
                          <button className="btn btn-outline btn-sm" onClick={() => openEditSong(song)}>Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => deleteSong(song)} title="Delete">🗑️</button>
                        </div>
                      </div>) )}
                    {hasMoreSongs && (
                      <div className="text-center pt-2">
                        <button className="btn btn-outline" onClick={() => loadMoreMySongs()}>Load More</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-6">
              <div className="card">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-2xl font-bold text-white">Upload Music</h3>
                  <button
                    className="btn btn-primary"
                    onClick={openNewSongModal}
                  >
                    🎵 Upload New Song
                  </button>
                </div>
                {mySongs.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎵</div>
                    <h3 className="text-xl font-bold text-white mb-2">Ready to share your music?</h3>
                    <p className="text-white/60 mb-6">Upload your unreleased tracks and start earning from your fans</p>
                    <button
                      className="btn btn-primary text-lg px-8 py-4"
                      onClick={openNewSongModal}
                    >
                      Upload Your First Song
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isRefreshingSongs && (
                      <div className="text-center text-white/60 text-sm">Refreshing…</div>
                    )}
                    {mySongs.map(song => (
                      <div key={song._id || song.id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                        <div className="w-12 h-12 rounded overflow-hidden bg-white/10 flex items-center justify-center">
                          {song.cover ? <img src={song.cover.startsWith('http') ? song.cover : api.getFileURL(song.cover)} className="w-full h-full object-cover" /> : <span>🎵</span>}
                        </div>
                        <div className="flex-1">
                          <div className="text-white font-medium">{song.title}</div>
                          <div className="text-white/60 text-sm">{song.genre}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right text-sm text-white/60 mr-2">{formatNumber(song.plays || 0)} plays</div>
                          <button className="btn btn-outline btn-sm" onClick={() => openEditSong(song)}>Edit</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => deleteSong(song)} title="Delete">🗑️</button>
                        </div>
                      </div>
                    ))}
                    {hasMoreSongs && (
                      <div className="text-center pt-2">
                        <button className="btn btn-outline" onClick={() => loadMoreMySongs()}>Load More</button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'tips' && (
            <div className="card">
              <h3 className="text-2xl font-bold text-white mb-6">Tips Received</h3>
              {isLoadingTips ? (
                <div className="text-center py-12 text-white/60">Loading…</div>
              ) : receivedTips.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💰</div>
                  <h3 className="text-xl font-bold text-white mb-2">No tips received yet</h3>
                  <p className="text-white/60">Upload music and promote your profile to start receiving tips!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedTips.map(tip => (
                    <div key={tip.id || tip._id} className="flex items-center gap-4 p-4 bg-white/5 rounded-lg">
                      <div className="w-12 h-12 gradient-primary rounded-lg flex items-center justify-center">
                        <span className="text-xl">💰</span>
                      </div>
                      <div className="flex-1">
                        <div className="text-white font-medium">Anonymous Fan</div>
                        <div className="text-white/60 text-sm">{tip.song?.title || '—'}</div>
                        {tip.message && (
                          <div className="text-white/40 text-sm mt-2 italic">"{tip.message}"</div>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-white font-bold">{formatCurrency(tip.amount || 0)}</div>
                        <div className="text-white/40 text-sm">{new Date(tip.createdAt).toLocaleDateString?.() || ''}</div>
                      </div>
                      <div className="flex flex-col items-center gap-2">
                        <div className={`px-2 py-1 rounded text-xs ${
                          tip.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {tip.status}
                        </div>
                        {tip.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            {tip.reaction ? (
                              <span className="text-2xl">{tip.reaction}</span>
                            ) : (
                              <button
                                onClick={() => handleReactToTip(tip._id || tip.id)}
                                className="text-white/60 hover:text-white text-sm px-2 py-1 rounded border border-white/20 hover:border-white/40 transition-all"
                              >
                                React
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'messages' && (
            <div className="card">
              <h3 className="text-2xl font-bold text-white mb-6">Fan Messages</h3>
              {isLoadingTips ? (
                <div className="text-center py-12 text-white/60">Loading…</div>
              ) : receivedTips.filter(tip => tip.message && tip.message.trim()).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4">💬</div>
                  <h3 className="text-xl font-bold text-white mb-2">No messages received yet</h3>
                  <p className="text-white/60">Fans can send you messages with their tips. Messages will appear here!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {receivedTips
                    .filter(tip => tip.message && tip.message.trim())
                    .map(tip => (
                    <div key={tip.id || tip._id} className="flex flex-col message-animate">
                      {/* Message Header */}
                      <div className="flex items-center gap-3 mb-2 px-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-sm text-white">👤</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium text-sm">Anonymous Fan</span>
                            <span className="text-primary font-bold text-sm">{formatCurrency(tip.amount || 0)}</span>
                          </div>
                          {tip.song?.title && (
                            <div className="text-white/60 text-xs">For: {tip.song.title}</div>
                          )}
                        </div>
                        <div className="text-white/40 text-xs">
                          {new Date(tip.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                      
                      {/* Message Bubble */}
                      <div className="flex justify-start">
                        <div className="max-w-[80%] bg-gradient-to-r from-blue-500/20 to-purple-600/20 border border-blue-500/30 rounded-2xl rounded-tl-md px-4 py-3 relative message-bubble">
                          <div className="text-white text-sm leading-relaxed">
                            {tip.message}
                          </div>
                          
                          {/* Message Status & Reaction */}
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-1">
                              <span className="text-blue-400 text-xs">✓</span>
                              <span className="text-blue-400 text-xs">✓</span>
                            </div>
                            {tip.reaction && (
                              <div className="flex items-center gap-1">
                                <span className="text-2xl reaction-animate">{tip.reaction}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Reaction Button */}
                      {tip.status === 'completed' && !tip.reaction && (
                        <div className="flex justify-start mt-2 px-2">
                          <button
                            onClick={() => handleReactToTip(tip._id || tip.id)}
                            className="text-white/60 hover:text-white text-xs px-3 py-1 rounded-full border border-white/20 hover:border-white/40 transition-all bg-white/5 hover:bg-white/10"
                          >
                            React with emoji
                          </button>
                        </div>
                      )}
                      
                      {/* Tip Status */}
                      <div className="flex justify-start mt-1 px-2">
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

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="card">
                <h3 className="text-2xl font-bold text-white mb-6">Performance Analytics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-3xl mb-2">📈</div>
                    <div className="text-2xl font-bold text-white mb-1">{formatCurrency(stats.totalEarnings)}</div>
                    <div className="text-white/60">Total Earnings</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-3xl mb-2">👥</div>
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.totalFollowers)}</div>
                    <div className="text-white/60">Followers</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-3xl mb-2">🎵</div>
                    <div className="text-2xl font-bold text-white mb-1">{formatNumber(stats.totalPlays)}</div>
                    <div className="text-white/60">Total Plays</div>
                  </div>
                  <div className="text-center p-4 bg-white/5 rounded-lg">
                    <div className="text-3xl mb-2">💰</div>
                    <div className="text-2xl font-bold text-white mb-1">{stats.totalTips}</div>
                    <div className="text-white/60">Total Tips</div>
                  </div>
                </div>
              </div>
              
              <div className="card">
                <h3 className="text-2xl font-bold text-white mb-6">Growth Trends</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span className="text-white/60">Monthly Growth</span>
                    <span className="text-green-400 font-bold">+{stats.monthlyGrowth}%</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-white/5 rounded-lg">
                    <span className="text-white/60">Top Performing Song</span>
                    <span className="text-white font-medium">{stats.topSong || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="card">
              <h3 className="text-2xl font-bold text-white mb-6">Profile Settings</h3>
              <div className="space-y-6">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Artist Name</label>
                  <input
                    type="text"
                    className="input w-full"
                    placeholder="Your artist name"
                    defaultValue={user?.name || ''}
                    onBlur={async (e) => { try { const u = await api.updateProfile({ name: e.target.value }); window.updateUser?.(u.user); showToast('Name updated'); } catch(err){ showToast('Failed to update name','error'); } }}
                  />
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Bio</label>
                  <textarea
                    className="input w-full resize-none"
                    rows="4"
                    placeholder="Tell fans about your music..."
                    defaultValue={user?.bio || ''}
                    onBlur={async (e) => { try { const u = await api.updateProfile({ bio: e.target.value }); window.updateUser?.(u.user); showToast('Bio updated'); } catch(err){ showToast('Failed to update bio','error'); } }}
                  />
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Profile Picture</label>
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white/10 flex items-center justify-center">
                      <img
                        src={getAvatarURL(avatarPreview || user?.avatar)}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-full h-full flex items-center justify-center text-2xl" style={{display: 'none'}}>
                        🎤
                      </div>
                    </div>
                    <input type="file" accept="image/*" className="input flex-1" onChange={async (e)=>{
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const prevAvatar = user?.avatar;
                      let blobUrl = null;
                      try {
                        blobUrl = URL.createObjectURL(file);
                        setAvatarPreview(blobUrl);
                        try { window.updateUser?.({ ...(user || {}), avatar: blobUrl }); } catch(_) {}
                        const result = await api.uploadImage(file);
                        const u = await api.updateProfile({ avatar: result.file.url });
                        window.updateUser?.(u.user);
                        setAvatarPreview(null);
                        if (blobUrl) URL.revokeObjectURL(blobUrl);
                        showToast('Profile picture updated');
                      } catch(err){
                        console.error(err);
                        showToast('Failed to upload image','error');
                        setAvatarPreview(null);
                        if (blobUrl) URL.revokeObjectURL(blobUrl);
                        try { window.updateUser?.({ ...(user || {}), avatar: prevAvatar }); } catch(_) {}
                      }
                    }} />
                  </div>
                </div>
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Email</label>
                  <input
                    type="email"
                    className="input w-full"
                    placeholder="your@email.com"
                    defaultValue={user?.email || ''}
                    onBlur={async (e) => { try { const u = await api.updateProfile({ email: e.target.value }); window.updateUser?.(u.user); showToast('Email updated'); } catch(err){ showToast('Failed to update email','error'); } }}
                  />
                </div>
                {/* Optional links / socials like on artist page */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Website</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">🌐</span>
                      <input defaultValue={user?.website || ''} type="url" className="input w-full pl-9" placeholder="https://" onBlur={async (e)=>{ try { const u = await api.completeProfile({ website: e.target.value }); window.updateUser?.(u.user); showToast('Website updated'); } catch(err){ showToast('Failed to update website','error'); } }} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Location</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50">📍</span>
                      <input defaultValue={user?.location || ''} type="text" className="input w-full pl-9" placeholder="City, Country" onBlur={async (e)=>{ try { const u = await api.completeProfile({ location: e.target.value }); window.updateUser?.(u.user); showToast('Location updated'); } catch(err){ showToast('Failed to update location','error'); } }} />
                    </div>
                  </div>
                </div>

                {/* Social & Streaming Links */}
                <div>
                  <h4 className="text-white font-semibold mb-3">Social & Streaming Links</h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Instagram</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">📸</span><input defaultValue={user?.socialLinks?.instagram || ''} className="input w-full pl-9" placeholder="https://instagram.com/..." onBlur={(e)=>updateSocialLink('instagram', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Twitter / X</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🐦</span><input defaultValue={user?.socialLinks?.twitter || ''} className="input w-full pl-9" placeholder="https://x.com/..." onBlur={(e)=>updateSocialLink('twitter', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Facebook</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">📘</span><input defaultValue={user?.socialLinks?.facebook || ''} className="input w-full pl-9" placeholder="https://facebook.com/..." onBlur={(e)=>updateSocialLink('facebook', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">YouTube</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">▶️</span><input defaultValue={user?.socialLinks?.youtube || ''} className="input w-full pl-9" placeholder="https://youtube.com/@..." onBlur={(e)=>updateSocialLink('youtube', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Spotify</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🟢</span><input defaultValue={user?.socialLinks?.spotify || ''} className="input w-full pl-9" placeholder="https://open.spotify.com/artist/..." onBlur={(e)=>updateSocialLink('spotify', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">SoundCloud</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">☁️</span><input defaultValue={user?.socialLinks?.soundcloud || ''} className="input w-full pl-9" placeholder="https://soundcloud.com/..." onBlur={(e)=>updateSocialLink('soundcloud', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Apple Music</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🍎</span><input defaultValue={user?.socialLinks?.appleMusic || ''} className="input w-full pl-9" placeholder="https://music.apple.com/artist/..." onBlur={(e)=>updateSocialLink('appleMusic', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Deezer</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🎶</span><input defaultValue={user?.socialLinks?.deezer || ''} className="input w-full pl-9" placeholder="https://deezer.com/artist/..." onBlur={(e)=>updateSocialLink('deezer', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">TIDAL</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🌊</span><input defaultValue={user?.socialLinks?.tidal || ''} className="input w-full pl-9" placeholder="https://tidal.com/browse/artist/..." onBlur={(e)=>updateSocialLink('tidal', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Bandcamp</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🎧</span><input defaultValue={user?.socialLinks?.bandcamp || ''} className="input w-full pl-9" placeholder="https://artistname.bandcamp.com" onBlur={(e)=>updateSocialLink('bandcamp', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">Audiomack</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🎵</span><input defaultValue={user?.socialLinks?.audiomack || ''} className="input w-full pl-9" placeholder="https://audiomack.com/artist/..." onBlur={(e)=>updateSocialLink('audiomack', e.target.value)} /></div>
                    </div>
                    <div>
                      <label className="block text-white/70 text-sm mb-1">YouTube Music</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🎬</span><input defaultValue={user?.socialLinks?.youtubeMusic || ''} className="input w-full pl-9" placeholder="https://music.youtube.com/channel/..." onBlur={(e)=>updateSocialLink('youtubeMusic', e.target.value)} /></div>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-white/70 text-sm mb-1">Linktree</label>
                      <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2">🌳</span><input defaultValue={user?.socialLinks?.linktree || ''} className="input w-full pl-9" placeholder="https://linktr.ee/username" onBlur={(e)=>updateSocialLink('linktree', e.target.value)} /></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 backdrop">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={closeUploadModal}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="glass-dark rounded-2xl p-8 max-w-2xl w-full animate-slideInUp max-h-[90vh] overflow-y-auto">
              <button 
                className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" 
                onClick={closeUploadModal}
                disabled={isUploading}
              >
                ✕
              </button>
              
              <div className="text-center mb-6">
                <div className="text-4xl mb-4">🎵</div>
                <h3 className="text-2xl font-bold text-white mb-2">{editSong ? 'Edit Song' : 'Upload New Song'}</h3>
                <p className="text-white/60">{editSong ? 'Update your track details' : 'Share your unreleased music with fans'}</p>
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="mb-6">
                  <div className="flex justify-between text-sm text-white/80 mb-2">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpload} className="space-y-6">
                {/* Basic Info */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Song Title *</label>
                    <input
                      type="text"
                      required
                      disabled={isUploading}
                      className="input w-full"
                      placeholder="Enter song title"
                      value={editSong ? (uploadForm.title || editSong.title) : uploadForm.title}
                      onChange={(e) => setUploadForm({...uploadForm, title: e.target.value})}
                    />
                  </div>
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Genre *</label>
                    <select
                      required
                      disabled={isUploading}
                      className="input w-full"
                      value={editSong ? (uploadForm.genre || editSong.genre) : uploadForm.genre}
                      onChange={(e) => setUploadForm({...uploadForm, genre: e.target.value})}
                    >
                      <option value="">Select genre</option>
                      <option value="Pop">Pop</option>
                      <option value="Rock">Rock</option>
                      <option value="Hip Hop">Hip Hop</option>
                      <option value="Jazz">Jazz</option>
                      <option value="Classical">Classical</option>
                      <option value="Country">Country</option>
                      <option value="Electronic">Electronic</option>
                      <option value="R&B">R&B</option>
                      <option value="Metal">Metal</option>
                      <option value="Folk">Folk</option>
                      <option value="Blues">Blues</option>
                      <option value="Reggae">Reggae</option>
                      <option value="Punk">Punk</option>
                      <option value="Ambient">Ambient</option>
                      <option value="Latin">Latin</option>
                      <option value="Gospel">Gospel</option>
                      <option value="Indie">Indie</option>
                      <option value="World">World</option>
                      <option value="Alternative">Alternative</option>
                      <option value="EDM">EDM</option>
                    </select>
                  </div>
                </div>

                {/* File Uploads */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Preview Song *</label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="audio/*"
                        disabled={isUploading}
                        className="hidden"
                        id="previewSong"
                        onChange={(e) => handleFileChange('previewSong', e.target.files[0])}
                      />
                      <label htmlFor="previewSong" className="cursor-pointer">
                        {uploadFiles.previewSong ? (
                          <div className="text-green-400">
                            <div className="text-2xl mb-2">✅</div>
                            <div className="font-medium">{uploadFiles.previewSong.name}</div>
                            <div className="text-sm text-white/60">{(uploadFiles.previewSong.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        ) : editSong?.previewSong ? (
                          <div className="text-white/80">
                            <div className="text-2xl mb-2">🎵</div>
                            <div className="font-medium break-all">Current: {editSong.previewSong}</div>
                            <div className="text-sm text-white/60">Click to replace</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl mb-2">🎵</div>
                            <div className="font-medium">Click to upload preview song</div>
                            <div className="text-sm text-white/60">MP3, WAV, OGG, M4A (max 50MB)</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Complete Song MP3 *</label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="audio/mp3,audio/mpeg"
                        disabled={isUploading}
                        className="hidden"
                        id="completeSongMp3"
                        onChange={(e) => handleFileChange('completeSongMp3', e.target.files[0])}
                      />
                      <label htmlFor="completeSongMp3" className="cursor-pointer">
                        {uploadFiles.completeSongMp3 ? (
                          <div className="text-green-400">
                            <div className="text-2xl mb-2">✅</div>
                            <div className="font-medium">{uploadFiles.completeSongMp3.name}</div>
                            <div className="text-sm text-white/60">{(uploadFiles.completeSongMp3.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        ) : editSong?.completeSongMp3 ? (
                          <div className="text-white/80">
                            <div className="text-2xl mb-2">🎧</div>
                            <div className="font-medium break-all">Current: {editSong.completeSongMp3}</div>
                            <div className="text-sm text-white/60">Click to replace MP3</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl mb-2">🎧</div>
                            <div className="font-medium">Click to upload complete MP3</div>
                            <div className="text-sm text-white/60">MP3 format only (max 50MB)</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Complete Song WAV (Optional)</label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="audio/wav"
                        disabled={isUploading}
                        className="hidden"
                        id="completeSongWav"
                        onChange={(e) => handleFileChange('completeSongWav', e.target.files[0])}
                      />
                      <label htmlFor="completeSongWav" className="cursor-pointer">
                        {uploadFiles.completeSongWav ? (
                          <div className="text-green-400">
                            <div className="text-2xl mb-2">✅</div>
                            <div className="font-medium">{uploadFiles.completeSongWav.name}</div>
                            <div className="text-sm text-white/60">{(uploadFiles.completeSongWav.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        ) : editSong?.completeSongWav ? (
                          <div className="text-white/80">
                            <div className="text-2xl mb-2">🎼</div>
                            <div className="font-medium break-all">Current: {editSong.completeSongWav}</div>
                            <div className="text-sm text-white/60">Click to replace WAV</div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl mb-2">🎼</div>
                            <div className="font-medium">Click to upload WAV file</div>
                            <div className="text-sm text-white/60">WAV format only (max 50MB)</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Cover Art</label>
                    <div className="border-2 border-dashed border-white/20 rounded-lg p-4 text-center hover:border-primary transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        disabled={isUploading}
                        className="hidden"
                        id="coverArt"
                        onChange={(e) => handleFileChange('coverArt', e.target.files[0])}
                      />
                      <label htmlFor="coverArt" className="cursor-pointer">
                        {uploadFiles.coverArt ? (
                          <div className="text-green-400">
                            <div className="text-2xl mb-2">✅</div>
                            <div className="font-medium">{uploadFiles.coverArt.name}</div>
                            <div className="text-sm text-white/60">{(uploadFiles.coverArt.size / 1024 / 1024).toFixed(2)} MB</div>
                          </div>
                        ) : editSong?.cover ? (
                          <div className="flex items-center gap-3 justify-center text-white/80">
                            <img src={editSong.cover?.startsWith('http') ? editSong.cover : api.getFileURL(editSong.cover)} className="w-10 h-10 rounded object-cover" />
                            <div>
                              <div className="font-medium">Current cover</div>
                              <div className="text-sm text-white/60">Click to replace</div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="text-3xl mb-2">🖼️</div>
                            <div className="font-medium">Click to upload cover art</div>
                            <div className="text-sm text-white/60">JPEG, PNG, GIF, WebP (max 50MB)</div>
                          </div>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-white/90 mb-2 font-medium">Description</label>
                  <textarea
                    disabled={isUploading}
                    className="input w-full resize-none"
                    rows="3"
                    placeholder="Tell fans about this song..."
                    value={editSong ? (uploadForm.description || editSong.description || '') : uploadForm.description}
                    onChange={(e) => setUploadForm({...uploadForm, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-3">
                  <button 
                    type="submit" 
                    disabled={isUploading}
                    className="btn btn-primary w-full text-lg py-4"
                  >
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2">
                        <div className="spinner"></div>
                        <span>{editSong ? 'Saving...' : 'Uploading...'}</span>
                      </div>
                    ) : (
                      editSong ? 'Save Changes' : 'Upload Song'
                    )}
                  </button>
                  {editSong && (
                    <button type="button" className="btn btn-ghost text-lg py-4" disabled={isUploading} onClick={() => { setEditSong(null); setShowUploadModal(false); }}>Cancel</button>
                  )}
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="fixed inset-0 z-50 backdrop">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={()=>setShowWithdrawModal(false)}></div>
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="glass-dark rounded-2xl p-8 max-w-lg w-full animate-slideInUp">
              <button className="absolute top-4 right-4 text-2xl text-white/60 hover:text-white" onClick={()=>setShowWithdrawModal(false)} disabled={isSubmittingWithdraw}>✕</button>

              <div className="text-center mb-6">
                <div className="text-4xl mb-4">💳</div>
                <h3 className="text-2xl font-bold text-white mb-2">Request Withdrawal</h3>
                <p className="text-white/60">Enter your payout details below</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-white/90 mb-2 font-medium">Amount</label>
                  <input type="number" min="1" className="input w-full" value={withdrawForm.amount}
                    onChange={(e)=>setWithdrawForm(prev=>({ ...prev, amount: Number(e.target.value||0) }))} />
                  <div className="text-white/50 text-sm mt-1">Available: {formatCurrency(walletBalance)}</div>
                </div>

                <div>
                  <label className="block text-white/90 mb-2 font-medium">Payout Method</label>
                  <select className="input w-full" value={withdrawForm.method}
                    onChange={(e)=>setWithdrawForm(prev=>({ ...prev, method: e.target.value, recipient: {} }))}>
                    {['paypal','wise','venmo','cashapp','bank'].map(m=> <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                {/* Recipient fields */}
                {withdrawForm.method === 'paypal' && (
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">PayPal Email</label>
                    <input className="input w-full" type="email" placeholder="email@example.com"
                      value={withdrawForm.recipient.email || ''}
                      onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, email: e.target.value } }))} />
                  </div>
                )}
                {withdrawForm.method === 'venmo' && (
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Venmo Username</label>
                    <input className="input w-full" placeholder="@username"
                      value={withdrawForm.recipient.username || ''}
                      onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, username: e.target.value } }))} />
                  </div>
                )}
                {withdrawForm.method === 'cashapp' && (
                  <div>
                    <label className="block text-white/90 mb-2 font-medium">Cash App $Cashtag</label>
                    <input className="input w-full" placeholder="$yourname"
                      value={withdrawForm.recipient.cashtag || ''}
                      onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, cashtag: e.target.value } }))} />
                  </div>
                )}
                {withdrawForm.method === 'bank' && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/90 mb-2 font-medium">Account Number</label>
                      <input className="input w-full" placeholder="Account number"
                        value={withdrawForm.recipient.accountNumber || ''}
                        onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, accountNumber: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="block text-white/90 mb-2 font-medium">Routing Number</label>
                      <input className="input w-full" placeholder="Routing number"
                        value={withdrawForm.recipient.routingNumber || ''}
                        onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, routingNumber: e.target.value } }))} />
                    </div>
                  </div>
                )}
                {withdrawForm.method === 'wise' && (
                  <div className="grid md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-white/90 mb-2 font-medium">IBAN (optional)</label>
                      <input className="input w-full" placeholder="IBAN"
                        value={withdrawForm.recipient.iban || ''}
                        onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, iban: e.target.value } }))} />
                    </div>
                    <div>
                      <label className="block text-white/90 mb-2 font-medium">Account Number (if no IBAN)</label>
                      <input className="input w-full" placeholder="Account number"
                        value={withdrawForm.recipient.accountNumber || ''}
                        onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, accountNumber: e.target.value } }))} />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-white/90 mb-2 font-medium">Bank Code (SWIFT/BIC, optional)</label>
                      <input className="input w-full" placeholder="SWIFT/BIC"
                        value={withdrawForm.recipient.bankCode || ''}
                        onChange={(e)=>setWithdrawForm(prev=>({ ...prev, recipient: { ...prev.recipient, bankCode: e.target.value } }))} />
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button className="btn btn-primary w-full" disabled={isSubmittingWithdraw} onClick={submitWithdrawal}>
                    {isSubmittingWithdraw ? 'Submitting…' : 'Request Withdrawal'}
                  </button>
                  <button className="btn btn-ghost" disabled={isSubmittingWithdraw} onClick={()=>setShowWithdrawModal(false)}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// Export component
window.ArtistDashboard = ArtistDashboard; 