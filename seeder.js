const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Song = require('./models/Song');
const Tip = require('./models/Tip');

// Connect to database
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.NODE_ENV === 'production' 
        ? process.env.MONGODB_URI_PROD 
        : process.env.MONGODB_URI || 'mongodb://localhost:27017/musicbae',
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
    
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Sample artists data
const artistsData = [
  {
    name: 'Luna Echo',
    email: 'luna@musicbae.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Alternative indie artist pushing boundaries with ethereal vocals and experimental soundscapes.',
    picture: '🎤',
    verified: true,
    followers: 12450,
    totalTips: 2840,
    genres: ['Alternative', 'Indie'],
    balance: 2414
  },
  {
    name: 'EDM Pulse',
    email: 'pulse@musicbae.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    bio: 'Electronic dance music producer creating high-energy beats that make crowds move.',
    picture: '🎧',
    verified: true,
    followers: 8920,
    totalTips: 1560,
    genres: ['EDM', 'Electronic'],
    balance: 1326
  },
  {
    name: 'Jazz Flow',
    email: 'jazz@musicbae.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
    bio: 'Smooth jazz saxophonist bringing soulful melodies to life with every note.',
    picture: '🎷',
    verified: true,
    followers: 5670,
    totalTips: 920,
    genres: ['Jazz'],
    balance: 782
  },
  {
    name: 'Rock Rebel',
    email: 'rock@musicbae.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
    bio: 'Hard rock guitarist shredding through power chords and epic solos.',
    picture: '🎸',
    verified: true,
    followers: 15680,
    totalTips: 3420,
    genres: ['Rock'],
    balance: 2907
  },
  {
    name: 'Hip Hop Soul',
    email: 'hiphop@musicbae.com',
    password: 'password123',
    role: 'artist',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Hip hop artist with soulful beats and powerful lyrics that tell real stories.',
    picture: '🎤',
    verified: true,
    followers: 20340,
    totalTips: 4560,
    genres: ['Hip Hop'],
    balance: 3876
  }
];

// Sample fans data
const fansData = [
  {
    name: 'Music Lover',
    email: 'fan1@musicbae.com',
    password: 'password123',
    role: 'fan',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
    bio: 'Passionate music enthusiast always looking for new sounds.',
    picture: '🎵'
  },
  {
    name: 'Concert Goer',
    email: 'fan2@musicbae.com',
    password: 'password123',
    role: 'fan',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&crop=face',
    bio: 'Live music addict and supporter of independent artists.',
    picture: '🎪'
  },
  {
    name: 'Vinyl Collector',
    email: 'fan3@musicbae.com',
    password: 'password123',
    role: 'fan',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
    bio: 'Collector of rare vinyl and supporter of emerging talent.',
    picture: '💿'
  }
];

// Sample songs data
const songsData = [
  {
    title: 'Midnight Whispers',
    genre: 'Alternative',
    duration: 237,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    audioFile: '/uploads/sample-audio-1.mp3',
    audioFileId: 'sample-audio-1',
    description: 'A haunting melody that echoes through the night.',
    plays: 1200,
    tips: 45,
    totalTipsAmount: 225,
    isPublic: true,
    featured: true
  },
  {
    title: 'Ocean Dreams',
    genre: 'Indie',
    duration: 198,
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    audioFile: '/uploads/sample-audio-2.mp3',
    audioFileId: 'sample-audio-2',
    description: 'Dreamy indie vibes inspired by the ocean waves.',
    plays: 890,
    tips: 32,
    totalTipsAmount: 160,
    isPublic: true,
    featured: false
  },
  {
    title: 'Neon Nights',
    genre: 'EDM',
    duration: 184,
    cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=300&h=300&fit=crop',
    audioFile: '/uploads/sample-audio-3.mp3',
    audioFileId: 'sample-audio-3',
    description: 'High-energy EDM track perfect for the club scene.',
    plays: 2100,
    tips: 67,
    totalTipsAmount: 335,
    isPublic: true,
    featured: true
  },
  {
    title: 'Smooth Operator',
    genre: 'Jazz',
    duration: 312,
    cover: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    audioFile: '/uploads/sample-audio-4.mp3',
    audioFileId: 'sample-audio-4',
    description: 'Smooth jazz saxophone with soulful melodies.',
    plays: 678,
    tips: 23,
    totalTipsAmount: 115,
    isPublic: true,
    featured: false
  },
  {
    title: 'Thunder Road',
    genre: 'Rock',
    duration: 267,
    cover: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=300&h=300&fit=crop',
    audioFile: '/uploads/sample-audio-5.mp3',
    audioFileId: 'sample-audio-5',
    description: 'Epic rock anthem with powerful guitar riffs.',
    plays: 1890,
    tips: 76,
    totalTipsAmount: 380,
    isPublic: true,
    featured: true
  }
];

// Sample tips data
const tipsData = [
  {
    amount: 25,
    message: 'Amazing track! Keep up the great work!',
    type: 'artist',
    paymentMethod: 'stripe',
    status: 'completed',
    isAnonymous: false
  },
  {
    amount: 15,
    message: 'Love this song!',
    type: 'song',
    paymentMethod: 'stripe',
    status: 'completed',
    isAnonymous: false
  },
  {
    amount: 50,
    message: 'Incredible talent!',
    type: 'artist',
    paymentMethod: 'stripe',
    status: 'completed',
    isAnonymous: true
  },
  {
    amount: 10,
    message: 'This is fire! 🔥',
    type: 'song',
    paymentMethod: 'stripe',
    status: 'completed',
    isAnonymous: false
  },
  {
    amount: 30,
    message: 'Can\'t wait for more music!',
    type: 'artist',
    paymentMethod: 'stripe',
    status: 'completed',
    isAnonymous: false
  }
];

// Superadmin user
const superAdminData = {
  name: 'Super Admin',
  email: 'superadmin@musicbae.com',
  password: 'SuperSecure!2024',
  role: 'superadmin',
  avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
  bio: 'The all-powerful super administrator of MusicBae.'
};

// Seed function
const seedDatabase = async () => {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Song.deleteMany({});
    await Tip.deleteMany({});

    console.log('Cleared existing data');

    // Always delete and recreate superadmin
    await User.deleteOne({ email: superAdminData.email });
    await User.create(superAdminData);
    console.log('Superadmin user created:', superAdminData.email);

    // Create artists
    const artists = [];
    for (const artistData of artistsData) {
      const artist = await User.create(artistData);
      artists.push(artist);
      console.log(`Created artist: ${artist.name}`);
    }

    // Create fans
    const fans = [];
    for (const fanData of fansData) {
      const fan = await User.create(fanData);
      fans.push(fan);
      console.log(`Created fan: ${fan.name}`);
    }

    // Create songs
    const songs = [];
    for (let i = 0; i < songsData.length; i++) {
      const songData = {
        ...songsData[i],
        artist: artists[i % artists.length]._id
      };
      const song = await Song.create(songData);
      songs.push(song);
      console.log(`Created song: ${song.title}`);
    }

    // Create tips
    for (let i = 0; i < tipsData.length; i++) {
      const tipData = {
        ...tipsData[i],
        fan: fans[i % fans.length]._id,
        artist: artists[i % artists.length]._id,
        song: tipsData[i].type === 'song' ? songs[i % songs.length]._id : null
      };
      const tip = await Tip.create(tipData);
      console.log(`Created tip: $${tip.amount} from ${tipData.fan} to ${tipData.artist}`);
    }

    // Update user following relationships
    for (const fan of fans) {
      const followingArtists = artists.slice(0, 2); // Each fan follows first 2 artists
      fan.following = followingArtists.map(artist => artist._id);
      await fan.save();
      
      // Update artist follower counts
      for (const artist of followingArtists) {
        artist.followers += 1;
        await artist.save();
      }
    }

    console.log('Database seeding completed successfully!');
    console.log(`Created ${artists.length} artists, ${fans.length} fans, ${songs.length} songs, and ${tipsData.length} tips`);

  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run seeder
const runSeeder = async () => {
  await connectDB();
  await seedDatabase();
};

// Check if this file is run directly
if (require.main === module) {
  runSeeder();
}

module.exports = { seedDatabase }; 