/*
  Ensure specific artists exist in the database (idempotent).
  Usage: node scripts/ensureArtists.js [--with-songs]

  This script does NOT wipe data. It will create artists if missing and
  optionally attach a sample public song so they appear in listings.
*/

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const Song = require('../models/Song');

const WANT_SONGS = process.argv.includes('--with-songs');

const targetArtists = [
  'Ambient Dreams',
  'Folk Tales',
  'World Music',
  'Reggae Vibes',
  'Classical Harmony',
  'Indie Folk'
];

function toSlug(name) {
  return String(name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function ensureArtist(name) {
  const existing = await User.findOne({ role: 'artist', name: new RegExp('^' + name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$', 'i') });
  if (existing) return { artist: existing, created: false };

  const slug = toSlug(name);
  const email = `${slug}@musicbae.com`;

  const artist = await User.create({
    name,
    email,
    password: 'Passw0rd!2345',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: `${name} artist on MusicBae.`,
    isVerified: true
  });

  return { artist, created: true };
}

async function ensureSampleSong(artist, genreHint) {
  const hasSong = await Song.findOne({ artist: artist._id });
  if (hasSong) return { created: false };

  // Use existing uploaded files so playback works immediately in dev
  const previewCandidates = [
    '/uploads/audio/previewSong-1754886146193-356963898.mp3',
    '/uploads/audio/previewSong-1754886198956-109572672.mp3',
    '/uploads/audio/previewSong-1754887552449-7170204.mp3'
  ];
  const mp3Candidates = [
    '/uploads/audio/completeSongMp3-1754886146194-930289841.mp3',
    '/uploads/audio/completeSongMp3-1754886059587-87418184.mp3',
    '/uploads/audio/completeSongMp3-1754885514068-640047418.mp3'
  ];
  const wavCandidates = [
    '/uploads/audio/completeSongWav-1754886146194-762355621.wav',
    '/uploads/audio/completeSongWav-1754886059590-470498536.wav'
  ];
  const coverCandidates = [
    '/uploads/images/coverArt-1754886198960-587677622.png',
    '/uploads/images/coverArt-1754885514070-637917032.jpeg'
  ];

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  const song = await Song.create({
    title: 'Sample Track',
    duration: 180,
    genre: genreHint || 'Indie',
    previewSong: pick(previewCandidates),
    completeSongMp3: pick(mp3Candidates),
    completeSongWav: pick(wavCandidates),
    cover: pick(coverCandidates),
    description: 'Auto-generated sample track for demo.',
    isPublic: true,
    artist: artist._id
  });

  return { created: true, song };
}

async function run() {
  const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/musicbae';
  await mongoose.connect(mongoUrl, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected:', mongoUrl);

  try {
    for (const name of targetArtists) {
      const { artist, created } = await ensureArtist(name);
      console.log(created ? `Created artist: ${name}` : `Exists: ${name}`);
      if (WANT_SONGS) {
        const genreHint = (function(n){
          if (/ambient/i.test(n)) return 'Ambient';
          if (/folk/i.test(n)) return 'Folk';
          if (/world/i.test(n)) return 'World';
          if (/reggae/i.test(n)) return 'Reggae';
          if (/classical/i.test(n)) return 'Classical';
          return 'Indie';
        })(name);
        const s = await ensureSampleSong(artist, genreHint);
        if (s.created) console.log(`  + Added sample song for ${name}`);
      }
    }
    console.log('Done.');
  } catch (e) {
    console.error('Error:', e);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
}

run();


