const express = require('express');
const router = express.Router();
const { Expense, Budget, SavingsGoal, Salary, ExpenseCategory } = require('../models/Finance.model');
const { protect } = require('../middleware/auth.middleware');

// Helper function for CRUD operations (order: e.g. [['date', 'DESC']] or [['createdAt', 'DESC']])
const createCRUDRoutes = (Model, resourceName, order = [['createdAt', 'DESC']]) => {
  // GET all
  router.get(`/${resourceName}`, protect, async (req, res) => {
    try {
      const items = await Model.findAll({
        where: { userId: req.user.id },
        order
      });
      res.json({ success: true, count: items.length, data: items });
    } catch (error) {
      console.error(`Get ${resourceName} error:`, error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // POST create
  router.post(`/${resourceName}`, protect, async (req, res) => {
    try {
      const item = await Model.create({ ...req.body, userId: req.user.id });
      res.status(201).json({ success: true, data: item });
    } catch (error) {
      console.error(`Create ${resourceName} error:`, error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // PUT update
  router.put(`/${resourceName}/:id`, protect, async (req, res) => {
    try {
      const item = await Model.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
      if (!item) {
        return res.status(404).json({ success: false, message: `${resourceName} not found` });
      }
      await item.update(req.body);
      await item.reload();
      res.json({ success: true, data: item });
    } catch (error) {
      console.error(`Update ${resourceName} error:`, error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });

  // DELETE
  router.delete(`/${resourceName}/:id`, protect, async (req, res) => {
    try {
      const item = await Model.findOne({
        where: { id: req.params.id, userId: req.user.id }
      });
      if (!item) {
        return res.status(404).json({ success: false, message: `${resourceName} not found` });
      }
      await item.destroy();
      res.json({ success: true, message: `${resourceName} deleted` });
    } catch (error) {
      console.error(`Delete ${resourceName} error:`, error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  });
};

// Expense POST: normalize payload to avoid 500 (userId integer, date parsed, allowed fields only)
router.post('/expenses', protect, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10);
    if (Number.isNaN(userId)) {
      return res.status(401).json({ success: false, message: 'Invalid user' });
    }
    const { amount, category, description, date, paymentMethod } = req.body;
    const amountNum = amount != null ? Number(amount) : NaN;
    if (Number.isNaN(amountNum) || amountNum < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    const desc = description != null ? String(description).trim() : '';
    if (!desc) {
      return res.status(400).json({ success: false, message: 'Description is required' });
    }
    const categoryStr = (category != null ? String(category).trim() : '') || 'other';
    const dateVal = date != null ? (date instanceof Date ? date : new Date(date)) : new Date();
    if (Number.isNaN(dateVal.getTime())) {
      return res.status(400).json({ success: false, message: 'Valid date is required' });
    }
    const paymentStr = paymentMethod != null ? String(paymentMethod).trim() : null;
    const item = await Expense.create({
      userId,
      amount: amountNum,
      category: categoryStr,
      description: desc,
      date: dateVal,
      paymentMethod: paymentStr || undefined
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create expense error:', error);
    const message = error.name === 'SequelizeValidationError' && error.errors?.length
      ? error.errors.map(e => e.message).join('; ')
      : 'Server error';
    res.status(error.name === 'SequelizeValidationError' ? 400 : 500).json({ success: false, message });
  }
});

// Expense GET/PUT/DELETE via generic CRUD; POST is overridden above so we only register GET/PUT/DELETE for expenses
router.get('/expenses', protect, async (req, res) => {
  try {
    const items = await Expense.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get expenses error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.put('/expenses/:id', protect, async (req, res) => {
  try {
    const item = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'expenses not found' });
    const { amount, category, description, date, paymentMethod } = req.body;
    const updates = {};
    if (amount != null) updates.amount = Number(amount);
    if (category != null) updates.category = String(category).trim() || 'other';
    if (description != null) updates.description = String(description).trim();
    if (date != null) updates.date = date instanceof Date ? date : new Date(date);
    if (paymentMethod !== undefined) updates.paymentMethod = paymentMethod ? String(paymentMethod).trim() : null;
    await item.update(updates);
    await item.reload();
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});
router.delete('/expenses/:id', protect, async (req, res) => {
  try {
    const item = await Expense.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'expenses not found' });
    await item.destroy();
    res.json({ success: true, message: 'expenses deleted' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Other resources: generic CRUD (Budget, SavingsGoal, Salary)
createCRUDRoutes(Budget, 'budgets', [['createdAt', 'DESC']]);
createCRUDRoutes(SavingsGoal, 'savings-goals', [['createdAt', 'DESC']]);
createCRUDRoutes(Salary, 'salaries', [['date', 'DESC']]);

// Catégories personnalisées (GET, POST avec findOrCreate, DELETE)
router.get('/categories', protect, async (req, res) => {
  try {
    const items = await ExpenseCategory.findAll({
      where: { userId: req.user.id },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/categories', protect, async (req, res) => {
  try {
    const { name } = req.body;
    const trimmed = (name && String(name).trim()) || '';
    if (!trimmed) {
      return res.status(400).json({ success: false, message: 'Category name is required' });
    }
    const [category, created] = await ExpenseCategory.findOrCreate({
      where: { userId: req.user.id, name: trimmed },
      defaults: { userId: req.user.id, name: trimmed }
    });
    res.status(201).json({ success: true, data: category, created });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/categories/:id', protect, async (req, res) => {
  try {
    const item = await ExpenseCategory.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    await item.destroy();
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
