import mongoose from 'mongoose';

const StockHistorySchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  quantity: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['increase', 'decrease'],
    required: true
  },
  note: {
    type: String,
    required: true
  }
});

const MedicineSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  origin: {
    type: String,
    required: true
  },
  stock: {
    type: Number,
    default: 0
  },
  vialName: {
    type: String
  },
  expDate: {
    type: Date
  },
  history: [StockHistorySchema],
  image: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  createdDate: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

const Medicine = mongoose.model('Medicine', MedicineSchema);

export default Medicine; 