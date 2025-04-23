import mongoose from 'mongoose';

// More flexible item schema
const orderItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  medicineId: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
    min: 1
  },
  price: {
    type: Number,
    default: 0
  }
}, { _id: false }); // Prevent Mongoose from creating _id fields for subdocuments

const orderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  // Add orderId field that maps to id to prevent MongoDB errors
  orderId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values for backward compatibility
    default: function() {
      return this.id; // Default to the same value as id
    }
  },
  userId: {
    type: String,
    required: true
  },
  userName: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  },
  total: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: ''
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  completionDate: {
    type: Date,
    default: null
  }
}, { 
  timestamps: true,
  strict: false // Allow fields not in the schema
});

// Pre-save hook to ensure orderId matches id
orderSchema.pre('save', function(next) {
  // Always ensure orderId matches id to prevent conflicts
  if (this.id) {
    this.orderId = this.id;
  }
  
  // Calculate total as sum of quantities
  this.total = this.items.reduce((sum, item) => {
    return sum + (item.quantity || 1);
  }, 0);
  
  next();
});

const Order = mongoose.model('Order', orderSchema);

export default Order; 