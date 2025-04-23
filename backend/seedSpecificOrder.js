import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';

dotenv.config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected successfully'))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Function to add a specific order
const addSpecificOrder = async () => {
  try {
    // Check if the order already exists
    const existingOrder = await Order.findOne({ id: 'ORD223044' });
    if (existingOrder) {
      console.log('Order #ORD223044 already exists in the database:');
      console.log(JSON.stringify(existingOrder, null, 2));
      return;
    }

    // Create the specific order with ID ORD223044
    const specificOrder = new Order({
      id: 'ORD223044',
      userId: '64d5f6d88ecd7d1b6c0c1234', // Sample user ID - will be displayed as is
      userName: 'testuser',
      items: [
        {
          id: 'OI123001',
          medicineId: 'MED123001',
          name: 'Paracetamol',
          quantity: 5,
          price: 0
        },
        {
          id: 'OI123002',
          medicineId: 'MED123002',
          name: 'Amoxicillin',
          quantity: 3,
          price: 0
        }
      ],
      status: 'pending',
      total: 8, // 5 + 3
      notes: 'This is the specific order #ORD223044',
      orderDate: new Date('2023-08-15T10:30:00'),
      completionDate: null
    });

    // Save the order
    await specificOrder.save();
    console.log('Successfully added order #ORD223044:');
    console.log(JSON.stringify(specificOrder, null, 2));

    // Verify that the order was added correctly
    const verifyOrder = await Order.findOne({ id: 'ORD223044' });
    if (verifyOrder) {
      console.log('Verified order #ORD223044 in database:');
      console.log(JSON.stringify(verifyOrder, null, 2));
    } else {
      console.error('Failed to verify order #ORD223044 in database');
    }

  } catch (error) {
    console.error('Error adding specific order:', error);
  } finally {
    // Close the connection
    mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

// Run the function
addSpecificOrder(); 