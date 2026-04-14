import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

await mongoose.connect(process.env.MONGODB_URI);

// যে email delete করতে চান সেটা দিন
const result = await mongoose.connection.db
  .collection('users')
  .deleteOne({ email:'roymohima664@gmail.com' });

console.log('Deleted:', result.deletedCount, 'user');
await mongoose.disconnect();
