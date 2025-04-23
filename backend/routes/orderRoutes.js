import express from 'express';
import Order from '../models/Order.js';
import Medicine from '../models/Medicine.js';

const router = express.Router();

// Get all orders
router.get('/', async (req, res) => {
  try {
    const orders = await Order.find({});
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get orders by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.params.userId });
    res.status(200).json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get order by ID
router.get('/:id', async (req, res) => {
  try {
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    res.status(200).json(order);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new order
router.post('/', async (req, res) => {
  try {
    let { userId, userName, items, status, notes, id } = req.body;
    
    console.log('Received order creation request:', {
      userId,
      userName,
      items: items?.length || 0,
      status,
      notes,
      providedId: id,
      bodyData: JSON.stringify(req.body, null, 2)
    });
    
    if (!userId) {
      return res.status(400).json({ message: 'User ID is required' });
    }
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must contain at least one item' });
    }
    
    try {
      // Validate each item
      items.forEach((item, index) => {
        if (!item.id) {
          throw new Error(`Item at index ${index} is missing id`);
        }
        if (!item.medicineId) {
          throw new Error(`Item at index ${index} is missing medicineId`);
        }
        if (!item.name) {
          throw new Error(`Item at index ${index} is missing name`);
        }
        if (!item.quantity || item.quantity <= 0) {
          throw new Error(`Item ${item.name} has invalid quantity`);
        }
      });
    } catch (validationError) {
      console.error('Order item validation error:', validationError);
      return res.status(400).json({ message: validationError.message });
    }
    
    // Use provided ID if exists, otherwise generate a new one
    const orderId = id || `ORD${Date.now().toString().slice(-6)}`;
    console.log('Using order ID:', orderId, id ? '(client provided)' : '(server generated)');
    
    // Calculate total (now using quantity directly since price is 0)
    const total = items.reduce((sum, item) => sum + item.quantity, 0);
    
    // Create order
    const order = new Order({
      id: orderId,
      orderId: orderId,
      userId,
      userName,
      items,
      status: status || 'pending',
      total,
      notes: notes || '',
      orderDate: new Date(),
      completionDate: null
    });
    
    try {
      // Save the order
      const savedOrder = await order.save();
      console.log('Order created successfully:', savedOrder.id);
      res.status(201).json(savedOrder);
    } catch (saveError) {
      console.error('Error saving order:', saveError);
      
      // Provide detailed validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors).map(field => ({
          field,
          message: saveError.errors[field].message
        }));
        
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: validationErrors,
          details: saveError.message
        });
      }
      
      throw saveError;
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order status
router.patch('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }
    
    const previousStatus = order.status;
    console.log(`Updating order ${order.id} status from ${previousStatus} to ${status}`);
    
    // Update order status
    order.status = status;
    
    // Set completion date if status is 'completed'
    if (status === 'completed') {
      order.completionDate = new Date();
      
      console.log(`Order ${order.id} is being completed, updating stock for ${order.items.length} items`);
      
      // Update stock for each medicine only when the order is completed
      for (const item of order.items) {
        try {
          console.log(`Looking for medicine with id: ${item.medicineId}`);
          const medicine = await Medicine.findOne({ id: item.medicineId });
          
          if (medicine) {
            console.log(`Reducing stock for ${medicine.name} from ${medicine.stock} by ${item.quantity}`);
            
            // Ensure stock doesn't go negative
            const newStock = Math.max(0, medicine.stock - item.quantity);
            medicine.stock = newStock;
            
            // Add history entry
            const historyEntry = {
              id: `hist${Date.now()}${medicine.history.length}`,
              date: new Date(),
              quantity: item.quantity,
              type: 'decrease',
              note: `Order #${order.id} completed`
            };
            
            medicine.history.unshift(historyEntry);
            await medicine.save();
            console.log(`Updated ${medicine.name} stock to ${medicine.stock}`);
          } else {
            console.error(`Medicine not found with id: ${item.medicineId}`);
          }
        } catch (itemError) {
          console.error(`Error updating stock for item ${item.medicineId}:`, itemError);
          // Continue with other items even if one fails
        }
      }
    }
    
    // Handle order cancellation
    if (status === 'cancelled' && (previousStatus === 'completed')) {
      // If cancelling a completed order, add stock back
      console.log(`Cancelling a completed order ${order.id}, restoring stock`);
      
      for (const item of order.items) {
        try {
          const medicine = await Medicine.findOne({ id: item.medicineId });
          if (medicine) {
            console.log(`Restoring stock for ${medicine.name} from ${medicine.stock} by ${item.quantity}`);
            
            // Update stock
            medicine.stock = medicine.stock + item.quantity;
            
            // Add history entry
            const historyEntry = {
              id: `hist${Date.now()}${medicine.history.length}`,
              date: new Date(),
              quantity: item.quantity,
              type: 'increase',
              note: `Order #${order.id} cancelled`
            };
            
            medicine.history.unshift(historyEntry);
            await medicine.save();
            console.log(`Restored ${medicine.name} stock to ${medicine.stock}`);
          }
        } catch (itemError) {
          console.error(`Error restoring stock for item ${item.medicineId}:`, itemError);
        }
      }
    }
    
    const updatedOrder = await order.save();
    console.log(`Order ${updatedOrder.id} status updated to ${updatedOrder.status}`);
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: error.message });
  }
});

// Update order notes
router.patch('/:id/notes', async (req, res) => {
  try {
    const { notes } = req.body;
    
    console.log(`Updating notes for order ${req.params.id}`);
    
    const order = await Order.findOne({ id: req.params.id });
    if (!order) {
      console.error(`Order not found with ID: ${req.params.id}`);
      return res.status(404).json({ message: 'Order not found' });
    }
    
    // Update order notes
    order.notes = notes;
    
    const updatedOrder = await order.save();
    console.log(`Notes updated for order ${updatedOrder.id}`);
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error('Error updating order notes:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;