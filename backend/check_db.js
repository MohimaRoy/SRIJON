import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import User from './models/User.js';

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'test1@test.com' });
  console.log(user);
  process.exit(0);
}
check();
