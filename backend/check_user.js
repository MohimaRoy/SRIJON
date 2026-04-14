import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const result = await mongoose.connection.db.collection('users').deleteMany({ email: /roymohima/i });
  console.log('Deleted users:', result.deletedCount);
  process.exit(0);
}
check();
