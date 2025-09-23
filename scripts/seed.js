const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Song = require('../models/Song');
const Tip = require('../models/Tip');

// Sample data
const sampleArtists = [
  {
    name: 'Luna Echo',
    email: 'luna@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Alternative indie artist pushing boundaries with ethereal vocals and experimental soundscapes.',
    isVerified: true
  },
  {
    name: 'EDM Pulse',
    email: 'pulse@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Electronic dance music producer creating high-energy beats that make crowds move.',
    isVerified: true
  },
  {
    name: 'Jazz Flow',
    email: 'jazz@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Smooth jazz saxophonist bringing soulful melodies to life with every note.',
    isVerified: false
  },
  {
    name: 'Rock Rebel',
    email: 'rock@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Hard rock guitarist shredding through power chords and epic solos.',
    isVerified: true
  },
  {
    name: 'Hip Hop Soul',
    email: 'hiphop@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Hip hop artist with soulful beats and powerful lyrics that tell real stories.',
    isVerified: true
  }
];

const sampleFans = [
  {
    name: 'Music Lover',
    email: 'fan1@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'fan',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Passionate music enthusiast always looking for new sounds.'
  },
  {
    name: 'Concert Goer',
    email: 'fan2@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'fan',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Live music addict and supporter of independent artists.'
  },
  {
    name: 'Vinyl Collector',
    email: 'fan3@musicbae.com',
    password: 'Passw0rd!2345',
    role: 'fan',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Collector of rare vinyl and supporter of emerging talent.'
  }
];

const sampleSongs = [
  {
    title: 'Midnight Whispers',
    duration: 237,
    genre: 'Alternative',
          previewSong: '/uploads/audio/sample-song-1-preview.mp3',
      completeSongMp3: '/uploads/audio/sample-song-1-complete.mp3',
      completeSongWav: '/uploads/audio/sample-song-1-complete.wav',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    description: 'A haunting melody that echoes through the night.',
    plays: 1200,
    tips: 45,
    totalTipAmount: 225
  },
  {
    title: 'Ocean Dreams',
    duration: 198,
    genre: 'Indie',
          previewSong: '/uploads/audio/sample-song-2-preview.mp3',
      completeSongMp3: '/uploads/audio/sample-song-2-complete.mp3',
      completeSongWav: '/uploads/audio/sample-song-2-complete.wav',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    description: 'Waves of sound that carry you away.',
    plays: 890,
    tips: 32,
    totalTipAmount: 160
  },
  {
    title: 'Neon Nights',
    duration: 184,
    genre: 'EDM',
          previewSong: '/uploads/audio/sample-song-3-preview.mp3',
      completeSongMp3: '/uploads/audio/sample-song-3-complete.mp3',
      completeSongWav: '/uploads/audio/sample-song-3-complete.wav',
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    description: 'High-energy electronic beats for the night.',
    plays: 2100,
    tips: 67,
    totalTipAmount: 335
  },
  {
    title: 'Smooth Operator',
    duration: 312,
    genre: 'Jazz',
          previewSong: '/uploads/audio/sample-song-4-preview.mp3',
      completeSongMp3: '/uploads/audio/sample-song-4-complete.mp3',
      completeSongWav: '/uploads/audio/sample-song-4-complete.wav',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    description: 'Smooth jazz vibes for a relaxing evening.',
    plays: 678,
    tips: 23,
    totalTipAmount: 115
  },
  {
    title: 'Thunder Road',
    duration: 267,
    genre: 'Rock',
          previewSong: '/uploads/audio/sample-song-5-preview.mp3',
      completeSongMp3: '/uploads/audio/sample-song-5-complete.mp3',
      completeSongWav: '/uploads/audio/sample-song-5-complete.wav',
    cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
    description: 'Powerful rock anthem with epic guitar solos.',
    plays: 1890,
    tips: 76,
    totalTipAmount: 380
  },
  {
    title: 'Street Dreams',
    duration: 198,
    genre: 'Hip Hop',
          previewSong: '/uploads/audio/sample-song-6-preview.mp3',
      completeSongMp3: '/uploads/audio/sample-song-6-complete.mp3',
      completeSongWav: '/uploads/audio/sample-song-6-complete.wav',
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    description: 'Hip hop beats with powerful storytelling.',
    plays: 3450,
    tips: 123,
    totalTipAmount: 615
  }
];

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/musicbae', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('Connected to MongoDB');
  seedDatabase();
})
.catch((err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Song.deleteMany({});
    await Tip.deleteMany({});

    console.log('Cleared existing data');

    // Create artists
    const createdArtists = [];
    for (const artistData of sampleArtists) {
      const artist = new User(artistData);
      await artist.save();
      createdArtists.push(artist);
      console.log(`Created artist: ${artist.name}`);
    }

    // Create fans
    const createdFans = [];
    for (const fanData of sampleFans) {
      const fan = new User(fanData);
      await fan.save();
      createdFans.push(fan);
      console.log(`Created fan: ${fan.name}`);
    }

    // Create songs and assign to artists
    const createdSongs = [];
    for (let i = 0; i < sampleSongs.length; i++) {
      const songData = sampleSongs[i];
      const artist = createdArtists[i % createdArtists.length];
      
      const song = new Song({
        ...songData,
        artist: artist._id
      });
      
      await song.save();
      createdSongs.push(song);
      console.log(`Created song: ${song.title} by ${artist.name}`);
    }

    // Create some tips
    const tipMessages = [
      'Amazing track!',
      'Love this song!',
      'Keep up the great work!',
      'This is fire! 🔥',
      'Beautiful music!',
      'Can\'t stop listening!',
      'Incredible talent!',
      'Supporting great music!'
    ];

    for (let i = 0; i < 20; i++) {
      const fan = createdFans[Math.floor(Math.random() * createdFans.length)];
      const song = createdSongs[Math.floor(Math.random() * createdSongs.length)];
      const artist = createdArtists.find(a => a._id.toString() === song.artist.toString());
      
      const tip = new Tip({
        fan: fan._id,
        artist: artist._id,
        song: song._id,
        amount: Math.floor(Math.random() * 20) + 1, // $1-$20
        message: tipMessages[Math.floor(Math.random() * tipMessages.length)],
        isAnonymous: Math.random() > 0.7, // 30% anonymous
        status: 'completed'
      });
      
      await tip.save();
      console.log(`Created tip: $${tip.amount} from ${fan.name} to ${artist.name}`);
    }

    // Set up some following relationships
    for (const fan of createdFans) {
      const artistsToFollow = createdArtists.slice(0, Math.floor(Math.random() * 3) + 1);
      fan.following = artistsToFollow.map(a => a._id);
      await fan.save();
      
      // Add fans to artists' followers
      for (const artist of artistsToFollow) {
        artist.followers.push(fan._id);
        await artist.save();
      }
      
      console.log(`${fan.name} is now following ${artistsToFollow.length} artists`);
    }

    // Always delete and recreate superadmin (after all other users)
    const superAdminData = {
      name: 'Super Admin',
      email: 'superadmin@musicbae.com',
      password: 'SuperSecure!2024',
      role: 'superadmin',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      bio: 'The all-powerful super administrator of MusicBae.'
    };
    await User.deleteOne({ email: superAdminData.email });
    await User.create(superAdminData);
    console.log('Superadmin user created:', superAdminData.email);

    console.log('\n✅ Database seeding completed successfully!');
    console.log(`\nCreated:`);
    console.log(`- ${createdArtists.length} artists`);
    console.log(`- ${createdFans.length} fans`);
    console.log(`- ${createdSongs.length} songs`);
    console.log(`- 20 tips`);
    console.log(`- Following relationships`);

    console.log('\nSample login credentials:');
    console.log('Artist: luna@musicbae.com / password123');
    console.log('Fan: fan1@musicbae.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
} 