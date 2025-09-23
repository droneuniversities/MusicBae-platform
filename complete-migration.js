const mongoose = require('mongoose');
const { MongoClient } = require('mongodb');

// MongoDB Atlas connection string
const ATLAS_URI = 'mongodb+srv://musicbae_DB:uQzcwVf8qIMPvACl@musicbaedb.7dycpbq.mongodb.net/musicbae?retryWrites=true&w=majority&appName=MusicBaeDB';

// Local MongoDB connection
const LOCAL_URI = 'mongodb://localhost:27017/musicbae';

async function completeMigration() {
  try {
    console.log('🔄 Starting COMPLETE data migration from local MongoDB to MongoDB Atlas...');
    
    // Connect to local MongoDB
    const localClient = new MongoClient(LOCAL_URI);
    await localClient.connect();
    const localDb = localClient.db('musicbae');
    
    // Connect to MongoDB Atlas
    const atlasClient = new MongoClient(ATLAS_URI);
    await atlasClient.connect();
    const atlasDb = atlasClient.db('musicbae');
    
    console.log('✅ Connected to both databases');
    
    // Get all collections from local database
    const localCollections = await localDb.listCollections().toArray();
    console.log('\n📦 Found collections in local database:', localCollections.map(c => c.name));
    
    // Collections to migrate
    const collections = ['users', 'songs', 'tips', 'libraryitems', 'wallettransactions', 'sitesettings', 'sessions'];
    
    for (const collectionName of collections) {
      console.log(`\n📦 Migrating collection: ${collectionName}`);
      
      try {
        // Get data from local database
        const localCollection = localDb.collection(collectionName);
        const documents = await localCollection.find({}).toArray();
        
        if (documents.length === 0) {
          console.log(`   ⚠️  No documents found in ${collectionName}`);
          continue;
        }
        
        console.log(`   📊 Found ${documents.length} documents`);
        
        // Clear existing data in Atlas (optional - remove if you want to keep existing data)
        const atlasCollection = atlasDb.collection(collectionName);
        await atlasCollection.deleteMany({});
        
        // Insert data into Atlas
        if (documents.length > 0) {
          await atlasCollection.insertMany(documents);
          console.log(`   ✅ Successfully migrated ${documents.length} documents to Atlas`);
          
          // Verify the migration
          const atlasCount = await atlasCollection.countDocuments();
          console.log(`   🔍 Verification: ${atlasCount} documents now in Atlas`);
        }
      } catch (error) {
        console.error(`   ❌ Error migrating ${collectionName}:`, error.message);
      }
    }
    
    // Final verification
    console.log('\n🔍 FINAL VERIFICATION - Atlas Collections:');
    const atlasCollections = await atlasDb.listCollections().toArray();
    for (const collection of atlasCollections) {
      const count = await atlasDb.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    
    console.log('\n🎉 Complete migration finished!');
    
    // Close connections
    await localClient.close();
    await atlasClient.close();
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration
completeMigration();
