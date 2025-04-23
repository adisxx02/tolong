import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Medicine from './models/Medicine.js';
import Order from './models/Order.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to seed the database
const seedDatabase = async () => {
  try {
    // Clear existing data
    await User.deleteMany({});
    await Medicine.deleteMany({});
    await Order.deleteMany({});
    console.log('Cleared existing data');

    // Create users
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = [
      {
        id: 'USR001',
        username: 'admin',
        password: passwordHash,
        name: 'Admin User',
        email: 'admin@example.com',
        phone: '1234567890',
        role: 'superadmin',
      },
      {
        id: 'USR002',
        username: 'user',
        password: passwordHash,
        name: 'Regular User',
        email: 'user@example.com',
        phone: '9876543210',
        role: 'user',
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`Created ${createdUsers.length} users`);

    // Create medicines
    const medicines = [
      {
        id: 'MED001',
        name: 'Paracetamol',
        description: 'Pain reliever and fever reducer',
        stock: 100,
        category: 'Analgesic',
        history: [
          {
            id: 'HIST001',
            date: new Date(),
            quantity: 100,
            type: 'increase',
            note: 'Initial stock'
          }
        ]
      },
      {
        id: 'MED002',
        name: 'Amoxicillin',
        description: 'Antibiotic to treat bacterial infections',
        stock: 50,
        category: 'Antibiotic',
        history: [
          {
            id: 'HIST002',
            date: new Date(),
            quantity: 50,
            type: 'increase',
            note: 'Initial stock'
          }
        ]
      },
      {
        id: 'MED003',
        name: 'Ibuprofen',
        description: 'NSAID for pain relief and inflammation',
        stock: 75,
        category: 'Analgesic',
        history: [
          {
            id: 'HIST003',
            date: new Date(),
            quantity: 75,
            type: 'increase',
            note: 'Initial stock'
          }
        ]
      },
      {
        id: 'MED004',
        name: 'Cetirizine',
        description: 'Antihistamine for allergies',
        stock: 60,
        category: 'Antihistamine',
        history: [
          {
            id: 'HIST004',
            date: new Date(),
            quantity: 60,
            type: 'increase',
            note: 'Initial stock'
          }
        ]
      }
    ];

    const createdMedicines = await Medicine.insertMany(medicines);
    console.log(`Created ${createdMedicines.length} medicines`);

    // Create orders
    const orders = [
      // Our specific order with ID ORD223044
      {
        id: 'ORD223044',
        userId: createdUsers[0]._id.toString(),
        userName: createdUsers[0].username,
        items: [
          {
            id: 'OI223044_001',
            medicineId: createdMedicines[0].id,
            name: createdMedicines[0].name,
            quantity: 5,
            price: 0
          },
          {
            id: 'OI223044_002',
            medicineId: createdMedicines[1].id,
            name: createdMedicines[1].name,
            quantity: 3,
            price: 0
          }
        ],
        status: 'pending',
        total: 8,
        notes: 'Specific order #ORD223044',
        orderDate: new Date('2023-08-15T10:30:00'),
        completionDate: null
      },
      // Additional orders
      {
        id: 'ORD223045',
        userId: createdUsers[0]._id.toString(),
        userName: createdUsers[0].username,
        items: [
          {
            id: 'OI223045_001',
            medicineId: createdMedicines[2].id,
            name: createdMedicines[2].name,
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
        userId: createdUsers[1]._id.toString(),
        userName: createdUsers[1].username,
        items: [
          {
            id: 'OI223046_001',
            medicineId: createdMedicines[0].id,
            name: createdMedicines[0].name,
            quantity: 1,
            price: 0
          },
          {
            id: 'OI223046_002',
            medicineId: createdMedicines[3].id,
            name: createdMedicines[3].name,
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

    const createdOrders = await Order.insertMany(orders);
    console.log(`Created ${createdOrders.length} orders`);

    // Verify specific order
    const specificOrder = await Order.findOne({ id: 'ORD223044' });
    if (specificOrder) {
      console.log('Successfully created order #ORD223044:');
      console.log(JSON.stringify(specificOrder, null, 2));
    } else {
      console.error('Failed to create order #ORD223044');
    }

    console.log('Database seeding completed successfully!');
    
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the seeding function
seedDatabase(); 