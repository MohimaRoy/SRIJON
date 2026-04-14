import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const updateUserRoles = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update user roles
    const result = await mongoose.connection.db
      .collection('users')
      .updateOne(
        { email: 'mohimaroy908@gmail.com' },
        { $set: { role: 'admin', roles: ['customer', 'admin'] } }
      );

    console.log('Updated:', result.modifiedCount, 'user');

    // Disconnect
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error updating user roles:', err);
    process.exit(1);
  }
};

updateUserRoles();