import mongoose from 'mongoose';
import { User } from './src/models/User.ts';
import dotenv from 'dotenv';

dotenv.config();

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/avancemos');
    
    const adminExists = await User.findOne({ email: 'admin@avancemosporchile.cl' });
    if (adminExists) {
      console.log('Admin user already exists');
      process.exit(0);
    }

    const admin = new User({
      name: 'Administrador Avancemos',
      email: 'admin@avancemosporchile.cl',
      password: 'admin123password', // Change this in production!
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully');
    console.log('Email: admin@avancemosporchile.cl');
    console.log('Password: admin123password');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seed();
