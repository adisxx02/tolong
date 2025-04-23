import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/User.js';

dotenv.config();

const checkUsers = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');
    
    console.log('Fetching all users:');
    const users = await User.find({});
    
    console.log(`Total users: ${users.length}`);
    
    users.forEach(user => {
      console.log({
        _id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role
      });
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await mongoose.connection.close();
    console.log('Connection closed');
  }
};

checkUsers(); 