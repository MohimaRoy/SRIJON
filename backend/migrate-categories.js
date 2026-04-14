import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from './models/Product.js';

dotenv.config();

const updateCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');

    const result = await Product.updateMany(
      { category: { $nin: ['fruits-vegetables', 'dairy-eggs', 'meat-fish', 'beverages', 'snacks-bakery', 'pantry', 'spices'] } },
      { $set: { category: 'pantry' } }
    );

    console.log(`Updated ${result.modifiedCount} products to use new category 'pantry'`);
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    mongoose.disconnect();
  }
};

updateCategories();
