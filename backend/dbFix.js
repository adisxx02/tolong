import mongoose from 'mongoose';
import Order from './models/Order.js';

const fixOrderIds = async () => {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://admin:admin@farmasitaji.hrxqmpf.mongodb.net/tambakaji-pharmacy');
    console.log('Connected to MongoDB');
    
    // Find orders with null orderId
    const ordersToFix = await Order.find({ $or: [
      { orderId: null },
      { orderId: { $exists: false } }
    ]});
    
    console.log(`Found ${ordersToFix.length} orders with missing or null orderId`);
    
    if (ordersToFix.length > 0) {
      // Fix each order
      let fixedCount = 0;
      
      for (const order of ordersToFix) {
        try {
          console.log(`Fixing order: ${order.id}`);
          // Set orderId to match id
          order.orderId = order.id;
          await order.save();
          fixedCount++;
          console.log(`Fixed order ${order.id}`);
        } catch (orderError) {
          console.error(`Error fixing order ${order.id}:`, orderError.message);
        }
      }
      
      console.log(`Fixed ${fixedCount} out of ${ordersToFix.length} orders`);
    }
    
    // Delete any orders with null id
    const nullIdOrders = await Order.find({ id: null });
    if (nullIdOrders.length > 0) {
      console.log(`Found ${nullIdOrders.length} orders with null id, deleting them...`);
      await Order.deleteMany({ id: null });
      console.log(`Deleted ${nullIdOrders.length} orders with null id`);
    }
    
    // Drop the problematic unique index if it exists
    try {
      await Order.collection.dropIndex('orderId_1');
      console.log('Dropped the orderId_1 index');
    } catch (indexError) {
      console.log('No existing orderId_1 index to drop or error dropping:', indexError.message);
    }
    
    // Create a new sparse unique index
    await Order.collection.createIndex({ orderId: 1 }, { unique: true, sparse: true });
    console.log('Created new sparse unique index on orderId');
    
    console.log('Database repair completed successfully');
  } catch (error) {
    console.error('Error fixing database:', error);
  } finally {
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the fix
fixOrderIds(); 