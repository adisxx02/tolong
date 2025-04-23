import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import Medicine from './models/Medicine.js';
import User from './models/User.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to seed the database with sample orders
const seedOrders = async () => {
  try {
    // Clear existing orders
    await Order.deleteMany({});
    console.log('Cleared existing orders');

    // Get existing medicines
    const medicines = await Medicine.find({});
    if (medicines.length === 0) {
      console.error('No medicines found. Please seed medicines first.');
      process.exit(1);
    }
    console.log(`Found ${medicines.length} medicines`);

    // Get existing users
    const users = await User.find({});
    if (users.length === 0) {
      console.error('No users found. Please seed users first.');
      process.exit(1);
    }
    console.log(`Found ${users.length} users`);

    // Generate sample order data
    const orders = [
      // Specific order with ID ORD223044
      {
        id: 'ORD223044',
        userId: users[0]._id.toString(),
        userName: users[0].username,
        items: [
          {
            id: 'OI123001',
            medicineId: medicines[0].id,
            name: medicines[0].name,
            quantity: 5,
            price: 0
          },
          {
            id: 'OI123002',
            medicineId: medicines[1].id,
            name: medicines[1].name,
            quantity: 3,
            price: 0
          }
        ],
        status: 'pending',
        total: 8, // 5 + 3
        notes: 'This is the specific order #ORD223044',
        orderDate: new Date('2023-08-15T10:30:00'),
        completionDate: null
      },
      // Other sample orders
      {
        id: 'ORD223045',
        userId: users[0]._id.toString(),
        userName: users[0].username,
        items: [
          {
            id: 'OI123003',
            medicineId: medicines[2].id,
            name: medicines[2].name,
            quantity: 2,
            price: 0
          }
        ],
        status: 'completed',
        total: 2,
        notes: 'Completed order',
        orderDate: new Date('2023-08-16T14:20:00'),
        completionDate: new Date('2023-08-17T09:15:00')
      },
      {
        id: 'ORD223046',
        userId: users[1]._id.toString(),
        userName: users[1].username,
        items: [
          {
            id: 'OI123004',
            medicineId: medicines[0].id,
            name: medicines[0].name,
            quantity: 1,
            price: 0
          },
          {
            id: 'OI123005',
            medicineId: medicines[3].id,
            name: medicines[3].name,
            quantity: 4,
            price: 0
          }
        ],
        status: 'processing',
        total: 5,
        notes: 'Processing order',
        orderDate: new Date('2023-08-18T16:45:00'),
        completionDate: null
      }
    ];

    // Insert orders
    const result = await Order.insertMany(orders);
    console.log(`Seeded ${result.length} orders successfully`);

    // Double-check if ORD223044 was inserted correctly
    const specificOrder = await Order.findOne({ id: 'ORD223044' });
    if (specificOrder) {
      console.log('Successfully inserted order #ORD223044:');
      console.log(JSON.stringify(specificOrder, null, 2));
    } else {
      console.error('Failed to insert order #ORD223044');
    }

  } catch (error) {
    console.error('Error seeding orders:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeding function
seedOrders(); 