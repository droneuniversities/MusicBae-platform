// ===== API SERVICE =====
class ApiService {
  constructor() {
    // Use environment-aware base URL
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = window.location.port || (protocol === 'https:' ? '443' : '80');
    this.baseURL = `${protocol}//${hostname}:${port}/api`;
    this.token = localStorage.getItem('token');
  }

  // Set authentication token
  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  // Persist/restore user snapshot for instant hydration
  setSavedUser(user) {
    try {
      if (user) localStorage.setItem('user', JSON.stringify(user));
      else localStorage.removeItem('user');
    } catch {}
  }

  getSavedUser() {
    try {
      const raw = localStorage.getItem('user');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  // Get authentication headers (without Content-Type by default)
  getHeaders() {
    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }
    return headers;
  }

  // Make API request
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutMs = options.timeoutMs ?? 30000;
    const id = setTimeout(() => controller.abort(), timeoutMs);

    const baseHeaders = this.getHeaders();
    // Only set JSON Content-Type when sending a JSON body
    const shouldApplyJson = options && options.body && typeof options.body === 'string';
    const config = {
      headers: shouldApplyJson ? { 'Content-Type': 'application/json', ...baseHeaders } : baseHeaders,
      signal: controller.signal,
      cache: 'no-store',
      ...options
    };

    const startedAt = Date.now();
    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `API request failed (${response.status})`);
      }
      return data;
    } catch (error) {
      if (error.name === 'AbortError') {
        console.warn('API Timeout:', { url, ms: Date.now() - startedAt });
      } else {
        console.error('API Error:', { url, ms: Date.now() - startedAt, error: String(error) });
      }
      throw error;
    } finally {
      clearTimeout(id);
    }
  }

  // ===== AUTHENTICATION =====
  
  // Register user
  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    if (data && data.token) {
      this.setToken(data.token);
      if (data.user) this.setSavedUser(data.user);
    }
    return data;
  }

  // Login user
  async login(credentials) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    if (data.token) {
      this.setToken(data.token);
      if (data.user) this.setSavedUser(data.user);
    }
    
    return data;
  }

  // Get current user profile
  async getProfile() {
    return this.request('/auth/me');
  }

  // Update user profile
  async updateProfile(profileData) {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Complete user profile with additional details
  async completeProfile(profileData) {
    return this.request('/users/profile/complete', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Change password
  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
  }

  // ===== ARTISTS =====

  // Get all artists
  async getArtists(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/artists?${queryString}`);
  }

  // Get artist by ID
  async getArtist(id) {
    return this.request(`/artists/${id}`);
  }

  // Follow artist
  async followArtist(id) {
    return this.request(`/artists/${id}/follow`, {
      method: 'POST'
    });
  }

  // Unfollow artist
  async unfollowArtist(id) {
    return this.request(`/artists/${id}/follow`, {
      method: 'DELETE'
    });
  }

  // Get artist's songs
  async getArtistSongs(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/artists/${id}/songs?${queryString}`, { timeoutMs: 8000 });
  }

  // Get artist's tips
  async getArtistTips(id, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/artists/${id}/tips?${queryString}`, { timeoutMs: 8000 });
  }

  // Get current artist profile with live stats (used by dashboard if needed)
  async getMyArtistProfile() {
    const me = await this.getProfile();
    if (me?.user?.role !== 'artist') return null;
    return this.request(`/artists/${me.user._id}`);
  }

  // ===== SONGS =====

  // Get all songs
  async getSongs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/songs?${queryString}`);
  }

  // Get song by ID
  async getSong(id) {
    return this.request(`/songs/${id}`);
  }

  // Get complete song (requires tip)
  async getCompleteSong(id) {
    return this.request(`/songs/${id}/complete`);
  }

  // Upload song files
  async uploadSongFiles(formData) {
    const url = `${this.baseURL}/upload/song`;
    console.log('API Service - Upload URL:', url);
    console.log('API Service - Token:', this.token ? 'Present' : 'Missing');
    
    // Convert FormData to base64 format for Vercel Blob
    const uploadData = {};
    
    // Helper function to convert file to base64
    const fileToBase64 = (file) => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    try {
      // Convert each file to base64
      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          uploadData[key] = await fileToBase64(value);
        }
      }

      const config = {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(uploadData)
      };

      console.log('API Service - Making request to:', url);
      const response = await fetch(url, config);
      console.log('API Service - Response status:', response.status);
      const data = await response.json();
      console.log('API Service - Response data:', data);

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  // Upload new song
  async uploadSong(songData) {
    return this.request('/songs', {
      method: 'POST',
      body: JSON.stringify(songData)
    });
  }

  // Update song
  async updateSong(id, songData) {
    return this.request(`/songs/${id}`, {
      method: 'PUT',
      body: JSON.stringify(songData)
    });
  }

  // Delete song
  async deleteSong(id) {
    return this.request(`/songs/${id}`, {
      method: 'DELETE'
    });
  }

  // Increment song plays
  async incrementSongPlays(id) {
    return this.request(`/songs/${id}/play`, {
      method: 'POST'
    });
  }

  // Get trending songs
  async getTrendingSongs(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/songs/trending?${queryString}`);
  }

  // Get songs by genre
  async getSongsByGenre(genre, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/songs/genre/${genre}?${queryString}`);
  }

  // ===== TIPS =====

  // Send tip
  async sendTip(tipData) {
    return this.request('/tips', {
      method: 'POST',
      body: JSON.stringify(tipData)
    });
  }

  // React to tip (artist only)
  async reactToTip(tipId, reaction) {
    return this.request(`/tips/${tipId}/react`, {
      method: 'PUT',
      body: JSON.stringify({ reaction })
    });
  }

  // ===== SUPERADMIN =====
  async saListUsers() {
    return this.request('/users/superadmin/all');
  }
  async saSiteStats() {
    return this.request('/users/superadmin/stats');
  }
  async saSummary() {
    return this.request('/users/superadmin/summary');
  }
  async saGetPaymentsConfig() {
    return this.request('/users/superadmin/payments-config');
  }
  async saSavePaymentsConfig(cfg) {
    return this.request('/users/superadmin/payments-config', { method: 'PUT', body: JSON.stringify(cfg) });
  }
  async saGetHomepage() {
    return this.request('/users/superadmin/homepage');
  }
  async saUpdateHomepage(payload) {
    return this.request('/users/superadmin/homepage', { method: 'PUT', body: JSON.stringify(payload) });
  }
  async saGetHomepageTexts() {
    return this.request('/users/superadmin/homepage-texts');
  }
  async saUpdateHomepageTexts(texts) {
    return this.request('/users/superadmin/homepage-texts', { method: 'PUT', body: JSON.stringify(texts) });
  }
  async saUpdateUser(id, payload) {
    return this.request(`/users/superadmin/user/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
  }
  async saSetUserStatus(id, isActive) {
    return this.request(`/users/superadmin/user/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) });
  }
  async saResetUserPassword(id, password) {
    return this.request(`/users/superadmin/user/${id}/reset-password`, { method: 'POST', body: JSON.stringify({ password }) });
  }
  async saClearUserSessions(id) {
    return this.request(`/users/superadmin/user/${id}/sessions/clear`, { method: 'POST' });
  }
  async saDeleteUser(id) {
    return this.request(`/users/superadmin/user/${id}`, { method: 'DELETE' });
  }
  async saSetWallet(id, amount) {
    return this.request(`/users/superadmin/user/${id}/wallet`, { 
      method: 'PATCH', 
      body: JSON.stringify({ 
        action: 'set', 
        walletBalance: amount,
        reason: 'SuperAdmin wallet update'
      }) 
    });
  }
  async saEnsureArtists(names, createSampleSong=false) {
    return this.request('/users/superadmin/ensure-artists', { method: 'POST', body: JSON.stringify({ names, createSampleSong }) });
  }
  async saListSongs(params={}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/songs/superadmin/all?${qs}`);
  }
  async saSetSongVisibility(id, isPublic) {
    return this.request(`/songs/superadmin/${id}/visibility`, { method: 'PATCH', body: JSON.stringify({ isPublic }) });
  }
  async saDeleteSong(id) {
    return this.request(`/songs/superadmin/${id}`, { method: 'DELETE' });
  }
  async saListTips(params={}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/tips/superadmin/all?${qs}`);
  }
  async saUpdateTipStatus(id, status) {
    return this.request(`/tips/superadmin/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
  }
  async saListWithdrawals(params={}) {
    const qs = new URLSearchParams(params).toString();
    return this.request(`/users/superadmin/withdrawals?${qs}`);
  }
  async saUpdateWithdrawal(id, payload) {
    return this.request(`/users/superadmin/withdrawals/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
  }

  // ===== WALLET =====

  // Get wallet balance
  async getWalletBalance() {
    return this.request('/users/wallet/balance', { timeoutMs: 5000 });
  }

  // Get wallet transactions (top-ups) for wallet tab
  async getWalletTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/fan/wallet-transactions?${queryString}`);
  }

  // Top up wallet
  async topupWallet(amount, method = 'stripe') {
    return this.request('/users/wallet/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, method })
    });
  }

  // Request withdrawal
  async requestWithdrawal(amount, method, recipient) {
    return this.request('/users/wallet/withdraw', {
      method: 'POST',
      body: JSON.stringify({ amount, method, recipient })
    });
  }

  // Tip from wallet
  async tipFromWallet(tipData) {
    return this.request('/users/wallet/tip', {
      method: 'POST',
      body: JSON.stringify(tipData)
    });
  }

  // Handle payment webhook (for future payment provider integration)
  async handlePaymentWebhook(webhookData) {
    return this.request('/users/wallet/webhook', {
      method: 'POST',
      body: JSON.stringify(webhookData)
    });
  }

  // Get tips received (for artists)
  async getReceivedTips(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tips/received?${queryString}`);
  }

  // Get tips sent (for fans)
  async getSentTips(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tips/sent?${queryString}`);
  }

  // Get tips for a song
  async getSongTips(songId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tips/song/${songId}?${queryString}`);
  }

  // ===== FAN DASHBOARD =====

  // Get fan dashboard data
  async getFanDashboard() {
    return this.request('/users/fan/dashboard', { timeoutMs: 8000 });
  }

  // Get fan's favorite artists
  async getFavoriteArtists(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/fan/favorite-artists?${queryString}`, { timeoutMs: 8000 });
  }

  // Get fan's song library
  async getSongLibrary(params = {}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page);
    if (params.limit) query.set('limit', params.limit);
    if (params.genre) query.set('genre', params.genre);
    if (params.search) query.set('search', params.search);
    const qs = query.toString();
    return this.request(`/users/fan/song-library${qs ? `?${qs}` : ''}`, { timeoutMs: 8000 });
  }

  // Get fan's tips history
  async getTipsHistory(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/fan/tips-history?${queryString}`, { timeoutMs: 8000 });
  }

  // Get tips for an artist
  async getArtistTips(artistId, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/tips/artist/${artistId}?${queryString}`);
  }

  // Get specific tip
  async getTip(id) {
    return this.request(`/tips/${id}`);
  }

  // ===== USERS =====

  // Get user profile
  async getUserProfile() {
    return this.request('/users/profile');
  }

  // Update user profile
  async updateUserProfile(profileData) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData)
    });
  }

  // Get following users
  async getFollowing(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/following?${queryString}`);
  }

  // Get followers
  async getFollowers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/followers?${queryString}`);
  }

  // Get public user profile
  async getPublicUser(id) {
    return this.request(`/users/${id}`);
  }

  // Search users
  async searchUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/users/search?${queryString}`);
  }

  // Deactivate account
  async deactivateAccount() {
    return this.request('/users/account', {
      method: 'DELETE'
    });
  }

  // ===== UPLOADS =====

  // Upload audio file
  async uploadAudio(file) {
    const formData = new FormData();
    formData.append('audio', file);

    const url = `${this.baseURL}/upload/audio`;
    const config = {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`
      },
      body: formData
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      return data;
    } catch (error) {
      console.error('Upload Error:', error);
      throw error;
    }
  }

  // Upload image file using base64
  async uploadImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const url = `${this.baseURL}/upload/image`;
          const config = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              file: reader.result // This will be the base64 data URL
            })
          };

          const response = await fetch(url, config);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          resolve(data);
        } catch (error) {
          console.error('Upload Error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // Upload audio file using base64
  async uploadAudio(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async () => {
        try {
          const url = `${this.baseURL}/upload/audio`;
          const config = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${this.token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              file: reader.result // This will be the base64 data URL
            })
          };

          const response = await fetch(url, config);
          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Upload failed');
          }

          resolve(data);
        } catch (error) {
          console.error('Audio Upload Error:', error);
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read audio file'));
      reader.readAsDataURL(file);
    });
  }

  // Delete uploaded file
  async deleteFile(filename) {
    return this.request(`/upload/${filename}`, {
      method: 'DELETE'
    });
  }

  // ===== DASHBOARD =====

  // Get dashboard stats
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  // Get wallet transactions
  async getWalletTransactions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/wallet/transactions?${queryString}`);
  }

  // Get user tips
  async getUserTips(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/user/tips?${queryString}`);
  }

  // ===== UTILITY =====

  // Check if user is authenticated
  isAuthenticated() {
    return !!this.token;
  }

  // Logout
  logout() {
    this.setToken(null);
    this.setSavedUser(null);
  }

  // Get full URL for uploaded files
  getFileURL(path) {
    if (path.startsWith('http')) {
      return path;
    }
    return `${this.baseURL.replace('/api', '')}${path}`;
  }
}

// Create global API service instance
window.api = new ApiService(); 