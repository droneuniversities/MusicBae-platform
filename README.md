# MusicBae - Connect Artists & Fans

A revolutionary platform where artists share unreleased music and fans support them through tips. Built with Node.js, Express, MongoDB, and React.

## 🚀 Features

- **Artist Profiles**: Complete artist profiles with bio, avatar, and verification status
- **Music Upload**: Artists can upload and manage their songs
- **Tipping System**: Fans can tip artists and songs with custom messages
- **Following System**: Fans can follow their favorite artists
- **Real-time Stats**: Track plays, tips, and earnings
- **File Upload**: Support for audio files and images
- **Authentication**: Secure JWT-based authentication
- **Responsive Design**: Modern, mobile-first UI

## 🛠️ Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **Tailwind CSS** - Styling
- **Babel** - JavaScript compiler

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd musicbae
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up environment variables
Create a `.env` file in the root directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/musicbae
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On macOS with Homebrew
brew services start mongodb-community

# On Ubuntu/Debian
sudo systemctl start mongod

# On Windows
net start MongoDB
```

### 5. Seed the database
```bash
npm run seed
```

### 6. Start the server
```bash
npm run dev
```

The API will be available at `http://localhost:5000`

### 7. Open the frontend
Open `index.html` in your browser or serve it with a local server:
```bash
# Using Python
python -m http.server 3000

# Using Node.js
npx serve .
```

## 📚 API Documentation

### Authentication

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "Artist Name",
  "email": "artist@example.com",
  "password": "password123",
  "role": "artist"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "artist@example.com",
  "password": "password123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer <token>
```

### Artists

#### Get All Artists
```http
GET /api/artists?page=1&limit=10&genre=Rock&search=luna
```

#### Get Artist Profile
```http
GET /api/artists/:id
```

#### Follow Artist
```http
POST /api/artists/:id/follow
Authorization: Bearer <token>
```

#### Unfollow Artist
```http
DELETE /api/artists/:id/follow
Authorization: Bearer <token>
```

### Songs

#### Get All Songs
```http
GET /api/songs?page=1&limit=10&genre=Rock&search=midnight
```

#### Upload Song
```http
POST /api/songs
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Song Title",
  "genre": "Rock",
  "duration": 240,
  "audioFile": "/uploads/audio/song.mp3",
  "cover": "https://example.com/cover.jpg",
  "description": "Song description"
}
```

#### Get Trending Songs
```http
GET /api/songs/trending?limit=10
```

### Tips

#### Send Tip
```http
POST /api/tips
Authorization: Bearer <token>
Content-Type: application/json

{
  "artistId": "artist_id",
  "songId": "song_id",
  "amount": 10.50,
  "message": "Amazing song!",
  "isAnonymous": false
}
```

#### Get Tips Received (Artists)
```http
GET /api/tips/received?page=1&limit=20
Authorization: Bearer <token>
```

#### Get Tips Sent (Fans)
```http
GET /api/tips/sent?page=1&limit=20
Authorization: Bearer <token>
```

### File Uploads

#### Upload Audio
```http
POST /api/upload/audio
Authorization: Bearer <token>
Content-Type: multipart/form-data

audio: <file>
```

#### Upload Image
```http
POST /api/upload/image
Authorization: Bearer <token>
Content-Type: multipart/form-data

image: <file>
```

## 🗄️ Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique),
  password: String (hashed),
  role: String (enum: ['artist', 'fan']),
  avatar: String,
  bio: String,
  followers: [ObjectId],
  following: [ObjectId],
  totalTips: Number,
  totalEarnings: Number,
  isVerified: Boolean,
  isActive: Boolean,
  lastLogin: Date
}
```

### Song Model
```javascript
{
  title: String,
  artist: ObjectId (ref: User),
  duration: Number,
  genre: String,
  audioFile: String,
  cover: String,
  description: String,
  plays: Number,
  tips: Number,
  totalTipAmount: Number,
  isPublic: Boolean,
  tags: [String],
  releaseDate: Date
}
```

### Tip Model
```javascript
{
  fan: ObjectId (ref: User),
  artist: ObjectId (ref: User),
  song: ObjectId (ref: Song),
  amount: Number,
  message: String,
  isAnonymous: Boolean,
  status: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  transactionId: String,
  paymentMethod: String
}
```

## 🎯 Sample Data

The seeder script creates:

- **5 Artists**: Luna Echo, EDM Pulse, Jazz Flow, Rock Rebel, Hip Hop Soul
- **3 Fans**: Music Lover, Concert Goer, Vinyl Collector
- **6 Songs**: Various genres with realistic stats
- **20 Tips**: Random tips between artists and fans
- **Following relationships**: Fans following artists

### Sample Login Credentials
- **Artist**: `luna@musicbae.com` / `password123`
- **Fan**: `fan1@musicbae.com` / `password123`

## 🔧 Development

### Available Scripts
```bash
npm start          # Start production server
npm run dev        # Start development server with nodemon
npm run seed       # Seed database with sample data
```

### Project Structure
```
musicbae/
├── models/           # Database models
├── routes/           # API routes
├── middleware/       # Custom middleware
├── scripts/          # Database seeding
├── uploads/          # File uploads
├── js/              # Frontend JavaScript
├── styles/          # CSS styles
├── assets/          # Static assets
├── server.js        # Main server file
├── package.json     # Dependencies
└── README.md        # Documentation
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/musicbae` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `NODE_ENV` | Environment | `development` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |

## 🚀 Deployment

### Heroku
1. Create a Heroku app
2. Add MongoDB addon (MongoDB Atlas)
3. Set environment variables
4. Deploy with `git push heroku main`

### Vercel
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Docker
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcryptjs for password security
- **Input Validation**: express-validator for data validation
- **Rate Limiting**: Prevents abuse
- **CORS Protection**: Configurable cross-origin requests
- **Helmet**: Security headers
- **File Upload Validation**: Type and size restrictions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, email support@musicbae.com or create an issue in the repository.

## 🔮 Roadmap

- [ ] Real-time notifications
- [ ] Live streaming
- [ ] Mobile app
- [ ] Payment processing (Stripe)
- [ ] Social features
- [ ] Analytics dashboard
- [ ] Music recommendations
- [ ] Collaborative playlists

---

Made with ❤️ for the music community 