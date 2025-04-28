import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const fixIndex = async () => {
  try {
    // Connect to MongoDB
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('No MONGO_URI found in environment variables');
      process.exit(1);
    }
    
    await mongoose.connect(uri);
    console.log('Connected to MongoDB');
    
    // Get the User collection
    const User = mongoose.connection.db.collection('users');
    
    // Get all indexes
    const indexes = await User.indexes();
    console.log('Current indexes:', indexes);
    
    // Find index on name field
    const nameIndex = indexes.find(idx => idx.key && idx.key.name === 1);
    if (nameIndex) {
      console.log('Found index on name field, dropping it');
      await User.dropIndex('name_1');
      console.log('Index dropped successfully');
    } else {
      console.log('No unique index found on name field');
    }
    
    // Verify indexes after change
    const updatedIndexes = await User.indexes();
    console.log('Updated indexes:', updatedIndexes);
    
    console.log('Task completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

fixIndex();
