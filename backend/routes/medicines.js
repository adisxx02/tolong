import express from 'express';
import Medicine from '../models/Medicine.js';

const router = express.Router();

// Get all medicines
router.get('/', async (req, res) => {
  try {
    const medicines = await Medicine.find({});
    res.status(200).json(medicines);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get medicine by ID
router.get('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ id: req.params.id });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    res.status(200).json(medicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new medicine
router.post('/', async (req, res) => {
  try {
    const { id, name, category, origin, stock, vialName, expDate, notes, createdDate } = req.body;
    
    // Check if medicine with same ID already exists
    const existingMedicine = await Medicine.findOne({ id });
    if (existingMedicine) {
      return res.status(400).json({ message: 'Medicine with this ID already exists' });
    }
    
    // Create new medicine
    const medicine = new Medicine({
      id,
      name,
      category,
      origin,
      stock: stock || 0,
      vialName,
      expDate,
      notes,
      createdDate,
      history: []
    });
    
    const savedMedicine = await medicine.save();
    res.status(201).json(savedMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update medicine
router.put('/:id', async (req, res) => {
  try {
    const { name, category, origin, stock, vialName, expDate, notes, createdDate } = req.body;
    
    const medicine = await Medicine.findOne({ id: req.params.id });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Update fields
    medicine.name = name || medicine.name;
    medicine.category = category || medicine.category;
    medicine.origin = origin || medicine.origin;
    medicine.stock = stock !== undefined ? stock : medicine.stock;
    medicine.vialName = vialName !== undefined ? vialName : medicine.vialName;
    medicine.expDate = expDate !== undefined ? expDate : medicine.expDate;
    medicine.notes = notes !== undefined ? notes : medicine.notes;
    medicine.createdDate = createdDate || medicine.createdDate;
    
    const updatedMedicine = await medicine.save();
    res.status(200).json(updatedMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update stock and add history entry
router.patch('/:id/stock', async (req, res) => {
  try {
    const { quantity, type, note } = req.body;
    
    const medicine = await Medicine.findOne({ id: req.params.id });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    // Calculate new stock
    let updatedStock;
    if (type === 'increase') {
      updatedStock = medicine.stock + quantity;
    } else if (type === 'decrease') {
      updatedStock = medicine.stock - quantity;
      // Prevent negative stock
      if (updatedStock < 0 && medicine.history.length > 0) {
        return res.status(400).json({ message: 'Insufficient stock' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid stock update type' });
    }
    
    // Create history entry
    const historyEntry = {
      id: `hist${Date.now()}`,
      date: new Date(),
      quantity,
      type,
      note: note || (type === 'increase' ? 'Stock added' : 'Stock removed')
    };
    
    // Special case for initial entries with 0 quantity
    const isInitialEntry = medicine.history.length === 0 && quantity === 0;
    if (isInitialEntry) {
      updatedStock = medicine.stock; // Don't change stock for initial entries
    }
    
    // Update medicine
    medicine.stock = updatedStock;
    medicine.history.unshift(historyEntry); // Add to beginning of array
    
    const updatedMedicine = await medicine.save();
    res.status(200).json(updatedMedicine);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete medicine
router.delete('/:id', async (req, res) => {
  try {
    const medicine = await Medicine.findOne({ id: req.params.id });
    if (!medicine) {
      return res.status(404).json({ message: 'Medicine not found' });
    }
    
    await Medicine.deleteOne({ id: req.params.id });
    res.status(200).json({ message: 'Medicine deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 