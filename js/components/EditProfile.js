// ===== EDIT PROFILE COMPONENT =====
function EditProfile({ onClose, onSave }) {
  const { user, showToast } = useApp();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
    location: user?.location || '',
    website: user?.website || '',
    profileVisibility: user?.profileVisibility || 'public',
    allowMessages: user?.allowMessages !== false,
    showOnlineStatus: user?.showOnlineStatus !== false,
    socialLinks: {
      instagram: user?.socialLinks?.instagram || '',
      twitter: user?.socialLinks?.twitter || '',
      facebook: user?.socialLinks?.facebook || '',
      youtube: user?.socialLinks?.youtube || '',
      spotify: user?.socialLinks?.spotify || '',
      soundcloud: user?.socialLinks?.soundcloud || '',
      appleMusic: user?.socialLinks?.appleMusic || '',
      deezer: user?.socialLinks?.deezer || '',
      tidal: user?.socialLinks?.tidal || '',
      bandcamp: user?.socialLinks?.bandcamp || '',
      audiomack: user?.socialLinks?.audiomack || '',
      youtubeMusic: user?.socialLinks?.youtubeMusic || '',
      linktree: user?.socialLinks?.linktree || ''
    },
    preferences: {
      emailNotifications: user?.preferences?.emailNotifications !== false,
      pushNotifications: user?.preferences?.pushNotifications !== false,
      marketingEmails: user?.preferences?.marketingEmails || false,
      theme: user?.preferences?.theme || 'auto',
      language: user?.preferences?.language || 'en',
      timezone: user?.preferences?.timezone || 'UTC'
    }
  });

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await api.completeProfile(formData);
      showToast('Profile updated successfully!', 'success');
      if (onSave) onSave(response.user);
      if (onClose) onClose();
    } catch (error) {
      console.error('Profile update error:', error);
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateCompletion = () => {
    const base = [
      { field: 'name', weight: 15 },
      { field: 'bio', weight: 10 },
      { field: 'avatar', weight: 10 },
      { field: 'location', weight: 5 },
      { field: 'website', weight: 5 },
      { field: 'preferences.theme', weight: 2 },
      { field: 'preferences.language', weight: 2 },
      { field: 'preferences.timezone', weight: 2 }
    ];
    const artistOnly = [
      { field: 'socialLinks.instagram', weight: 3 },
      { field: 'socialLinks.twitter', weight: 3 },
      { field: 'socialLinks.facebook', weight: 3 },
      { field: 'socialLinks.youtube', weight: 3 },
      { field: 'socialLinks.spotify', weight: 3 },
      { field: 'socialLinks.soundcloud', weight: 3 }
    ];

    const fields = (user?.role === 'artist') ? [...base, ...artistOnly] : base;

    let completion = 0;
    let totalWeight = 0;
    fields.forEach(({ field, weight }) => {
      totalWeight += weight;
      const value = field.split('.').reduce((obj, key) => obj && obj[key], formData);
      if (value && (typeof value === 'string' ? value.trim() !== '' : true)) {
        completion += weight;
      }
    });
    return Math.round((completion / totalWeight) * 100);
  };

  const completionPercentage = calculateCompletion();

  return (
    <div className="fixed inset-0 z-50 backdrop flex items-center justify-center p-4">
      <div className="modal max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Edit Profile</h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
          </div>
          
          {/* Profile Completion */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/80">Profile Completion</span>
              <span className="text-white font-medium">{completionPercentage}%</span>
            </div>
            <div className="w-full rounded-full h-2" style={{ backgroundColor: 'var(--hover-surface)' }}>
              <div 
                className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Basic Information */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 mb-2">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="input w-full"
                  placeholder="Your name"
                  required
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Location</label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleInputChange('location', e.target.value)}
                  className="input w-full"
                  placeholder="City, Country"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/80 mb-2">Bio</label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  className="input w-full resize-none"
                  placeholder="Tell us about yourself..."
                  rows="3"
                  maxLength="500"
                />
                <div className="text-right text-white/40 text-sm mt-1">
                  {formData.bio.length}/500
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/80 mb-2">Avatar</label>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-lg overflow-hidden bg-white/10 flex items-center justify-center">
                    <img 
                      src={getAvatarURL(formData.avatar)} 
                      alt="avatar" 
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
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setIsLoading(true);
                      try {
                        const form = new FormData();
                        form.append('image', file);
                        const res = await api.uploadImage(file);
                        if (res && res.file && res.file.url) {
                          handleInputChange('avatar', res.file.url);
                          showToast('Avatar uploaded', 'success');
                        } else {
                          showToast('Failed to upload image', 'error');
                        }
                      } catch (err) {
                        console.error('Avatar upload error:', err);
                        showToast('Failed to upload image', 'error');
                      } finally {
                        setIsLoading(false);
                        e.target.value = '';
                      }
                    }}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:bg-primary/20 file:text-white hover:file:bg-primary/30"
                  />
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-white/80 mb-2">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleInputChange('website', e.target.value)}
                  className="input w-full"
                  placeholder="https://yourwebsite.com"
                />
              </div>
            </div>
          </section>

          {/* Social Links (only for artists) */}
          {user?.role === 'artist' && (
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Social & Streaming Links</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 mb-2">Instagram</label>
                <input
                  type="text"
                  value={formData.socialLinks.instagram}
                  onChange={(e) => handleInputChange('socialLinks.instagram', e.target.value)}
                  className="input w-full"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Twitter</label>
                <input
                  type="text"
                  value={formData.socialLinks.twitter}
                  onChange={(e) => handleInputChange('socialLinks.twitter', e.target.value)}
                  className="input w-full"
                  placeholder="@username"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Facebook</label>
                <input
                  type="text"
                  value={formData.socialLinks.facebook}
                  onChange={(e) => handleInputChange('socialLinks.facebook', e.target.value)}
                  className="input w-full"
                  placeholder="facebook.com/username"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">YouTube</label>
                <input
                  type="text"
                  value={formData.socialLinks.youtube}
                  onChange={(e) => handleInputChange('socialLinks.youtube', e.target.value)}
                  className="input w-full"
                  placeholder="youtube.com/@channel"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Spotify</label>
                <input
                  type="text"
                  value={formData.socialLinks.spotify}
                  onChange={(e) => handleInputChange('socialLinks.spotify', e.target.value)}
                  className="input w-full"
                  placeholder="open.spotify.com/artist/..."
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">SoundCloud</label>
                <input
                  type="text"
                  value={formData.socialLinks.soundcloud}
                  onChange={(e) => handleInputChange('socialLinks.soundcloud', e.target.value)}
                  className="input w-full"
                  placeholder="soundcloud.com/username"
                />
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-white/80 mb-2">Apple Music</label>
                <input
                  type="text"
                  value={formData.socialLinks.appleMusic}
                  onChange={(e) => handleInputChange('socialLinks.appleMusic', e.target.value)}
                  className="input w-full"
                  placeholder="music.apple.com/artist/..."
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Deezer</label>
                <input
                  type="text"
                  value={formData.socialLinks.deezer}
                  onChange={(e) => handleInputChange('socialLinks.deezer', e.target.value)}
                  className="input w-full"
                  placeholder="deezer.com/artist/..."
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">TIDAL</label>
                <input
                  type="text"
                  value={formData.socialLinks.tidal}
                  onChange={(e) => handleInputChange('socialLinks.tidal', e.target.value)}
                  className="input w-full"
                  placeholder="tidal.com/browse/artist/..."
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Bandcamp</label>
                <input
                  type="text"
                  value={formData.socialLinks.bandcamp}
                  onChange={(e) => handleInputChange('socialLinks.bandcamp', e.target.value)}
                  className="input w-full"
                  placeholder="artistname.bandcamp.com"
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Audiomack</label>
                <input
                  type="text"
                  value={formData.socialLinks.audiomack}
                  onChange={(e) => handleInputChange('socialLinks.audiomack', e.target.value)}
                  className="input w-full"
                  placeholder="audiomack.com/artist/..."
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">YouTube Music</label>
                <input
                  type="text"
                  value={formData.socialLinks.youtubeMusic}
                  onChange={(e) => handleInputChange('socialLinks.youtubeMusic', e.target.value)}
                  className="input w-full"
                  placeholder="music.youtube.com/channel/..."
                />
              </div>
              <div>
                <label className="block text-white/80 mb-2">Linktree</label>
                <input
                  type="text"
                  value={formData.socialLinks.linktree}
                  onChange={(e) => handleInputChange('socialLinks.linktree', e.target.value)}
                  className="input w-full"
                  placeholder="linktr.ee/username"
                />
              </div>
            </div>
          </section>
          )}

          {/* Privacy Settings (only for artists) */}
          {user?.role === 'artist' && (
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Privacy Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-white/80 mb-2">Profile Visibility</label>
                <select
                  value={formData.profileVisibility}
                  onChange={(e) => handleInputChange('profileVisibility', e.target.value)}
                  className="input w-full"
                >
                  <option value="public">Public</option>
                  <option value="followers">Followers Only</option>
                  <option value="private">Private</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white/80">Allow Messages</label>
                  <p className="text-white/40 text-sm">Let other users send you messages</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.allowMessages}
                    onChange={(e) => handleInputChange('allowMessages', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white/80">Show Online Status</label>
                  <p className="text-white/40 text-sm">Display when you're online</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOnlineStatus}
                    onChange={(e) => handleInputChange('showOnlineStatus', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
            </div>
          </section>
          )}

          {/* Preferences */}
          <section>
            <h3 className="text-xl font-bold text-white mb-4">Preferences</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white/80 mb-2">Theme</label>
                <select
                  value={formData.preferences.theme}
                  onChange={(e) => handleInputChange('preferences.theme', e.target.value)}
                  className="input w-full"
                >
                  <option value="auto">Auto</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 mb-2">Language</label>
                <select
                  value={formData.preferences.language}
                  onChange={(e) => handleInputChange('preferences.language', e.target.value)}
                  className="input w-full"
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                  <option value="it">Italian</option>
                  <option value="pt">Portuguese</option>
                </select>
              </div>
              <div>
                <label className="block text-white/80 mb-2">Timezone</label>
                <select
                  value={formData.preferences.timezone}
                  onChange={(e) => handleInputChange('preferences.timezone', e.target.value)}
                  className="input w-full"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white/80">Email Notifications</label>
                  <p className="text-white/40 text-sm">Receive email notifications</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle email notifications"
                  onClick={() => handleInputChange('preferences.emailNotifications', !formData.preferences.emailNotifications)}
                  className={`relative inline-flex items-center switch ${formData.preferences.emailNotifications ? 'switch-checked' : ''}`}
                >
                  <span className="switch-track"></span>
                  <span className="switch-thumb"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white/80">Push Notifications</label>
                  <p className="text-white/40 text-sm">Receive push notifications</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle push notifications"
                  onClick={() => handleInputChange('preferences.pushNotifications', !formData.preferences.pushNotifications)}
                  className={`relative inline-flex items-center switch ${formData.preferences.pushNotifications ? 'switch-checked' : ''}`}
                >
                  <span className="switch-track"></span>
                  <span className="switch-thumb"></span>
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-white/80">Marketing Emails</label>
                  <p className="text-white/40 text-sm">Receive promotional emails</p>
                </div>
                <button
                  type="button"
                  aria-label="Toggle marketing emails"
                  onClick={() => handleInputChange('preferences.marketingEmails', !formData.preferences.marketingEmails)}
                  className={`relative inline-flex items-center switch ${formData.preferences.marketingEmails ? 'switch-checked' : ''}`}
                >
                  <span className="switch-track"></span>
                  <span className="switch-thumb"></span>
                </button>
              </div>
            </div>
          </section>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-6 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-outline flex-1"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary flex-1"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="spinner"></div>
                  Saving...
                </div>
              ) : (
                'Save Changes'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Export component
window.EditProfile = EditProfile; 