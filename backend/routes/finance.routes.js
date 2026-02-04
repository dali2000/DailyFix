const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Expense, Budget, SavingsGoal, Salary, ExpenseCategory, WalletCard } = require('../models/Finance.model');
const { sequelize } = require('../config/database');
const { protect } = require('../middleware/auth.middleware');

// DB column name for wallet card (PostgreSQL uses snake_case)
const WALLET_CARD_ID_COL = 'wallet_card_id';

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
    let walletCardId = req.body.walletCardId != null ? parseInt(String(req.body.walletCardId), 10) : null;
    if (walletCardId != null && !Number.isNaN(walletCardId)) {
      const card = await WalletCard.findOne({ where: { id: walletCardId, userId } });
      if (!card) walletCardId = null;
    } else {
      walletCardId = null;
    }
    const item = await Expense.create({
      userId,
      amount: String(amountNum),
      category: categoryStr,
      description: desc,
      date: dateVal,
      paymentMethod: paymentStr || null,
      walletCardId: walletCardId || null
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create expense error:', error);
    const message = error.name === 'SequelizeValidationError' && error.errors?.length
      ? error.errors.map(e => e.message).join('; ')
      : (error.message || 'Server error');
    const status = error.name === 'SequelizeValidationError' ? 400 : 500;
    res.status(status).json({ success: false, message });
  }
});

// Expense GET: optional ?walletCardId= to filter by card (use DB column wallet_card_id)
router.get('/expenses', protect, async (req, res) => {
  try {
    const cardId = req.query.walletCardId != null ? parseInt(String(req.query.walletCardId), 10) : null;
    const where = cardId != null && !Number.isNaN(cardId)
      ? { [Op.and]: [ { userId: req.user.id }, sequelize.where(sequelize.col(WALLET_CARD_ID_COL), cardId) ] }
      : { userId: req.user.id };
    const items = await Expense.findAll({
      where,
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
    if (req.body.walletCardId !== undefined) {
      const cardId = req.body.walletCardId != null ? parseInt(String(req.body.walletCardId), 10) : null;
      updates.walletCardId = (cardId != null && !Number.isNaN(cardId)) ? cardId : null;
    }
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

// Salaries: custom GET/POST to support walletCardId (per-card stats, use DB column wallet_card_id)
router.get('/salaries', protect, async (req, res) => {
  try {
    const cardId = req.query.walletCardId != null ? parseInt(String(req.query.walletCardId), 10) : null;
    const where = cardId != null && !Number.isNaN(cardId)
      ? { [Op.and]: [ { userId: req.user.id }, sequelize.where(sequelize.col(WALLET_CARD_ID_COL), cardId) ] }
      : { userId: req.user.id };
    const items = await Salary.findAll({
      where,
      order: [['date', 'DESC']]
    });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get salaries error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/salaries', protect, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10);
    const { amount, period, date, description, walletCardId: bodyCardId } = req.body;
    const amountNum = amount != null ? Number(amount) : NaN;
    if (Number.isNaN(amountNum) || amountNum < 0) {
      return res.status(400).json({ success: false, message: 'Valid amount is required' });
    }
    const periodVal = (period === 'yearly' ? 'yearly' : 'monthly');
    const dateVal = date != null ? (date instanceof Date ? date : new Date(date)) : new Date();
    if (Number.isNaN(dateVal.getTime())) {
      return res.status(400).json({ success: false, message: 'Valid date is required' });
    }
    let walletCardId = bodyCardId != null ? parseInt(String(bodyCardId), 10) : null;
    if (walletCardId != null && !Number.isNaN(walletCardId)) {
      const card = await WalletCard.findOne({ where: { id: walletCardId, userId } });
      if (!card) walletCardId = null;
    } else {
      walletCardId = null;
    }
    const item = await Salary.create({
      userId,
      amount: String(amountNum),
      period: periodVal,
      date: dateVal,
      description: description != null ? String(description).trim() : null,
      walletCardId: walletCardId || null
    });
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create salary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/salaries/:id', protect, async (req, res) => {
  try {
    const item = await Salary.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Salary not found' });
    const { amount, period, date, description, walletCardId: bodyCardId } = req.body;
    const updates = {};
    if (amount != null) updates.amount = String(Number(amount));
    if (period !== undefined) updates.period = period === 'yearly' ? 'yearly' : 'monthly';
    if (date != null) updates.date = date instanceof Date ? date : new Date(date);
    if (description !== undefined) updates.description = description ? String(description).trim() : null;
    if (bodyCardId !== undefined) {
      const cardId = bodyCardId != null ? parseInt(String(bodyCardId), 10) : null;
      updates.walletCardId = (cardId != null && !Number.isNaN(cardId)) ? cardId : null;
    }
    await item.update(updates);
    await item.reload();
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update salary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/salaries/:id', protect, async (req, res) => {
  try {
    const item = await Salary.findOne({ where: { id: req.params.id, userId: req.user.id } });
    if (!item) return res.status(404).json({ success: false, message: 'Salary not found' });
    await item.destroy();
    res.json({ success: true, message: 'Salary deleted' });
  } catch (error) {
    console.error('Delete salary error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Other resources: generic CRUD (Budget, SavingsGoal)
createCRUDRoutes(Budget, 'budgets', [['createdAt', 'DESC']]);
createCRUDRoutes(SavingsGoal, 'savings-goals', [['createdAt', 'DESC']]);

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

// ---------- Wallet cards ----------
router.get('/wallet-cards', protect, async (req, res) => {
  try {
    const items = await WalletCard.findAll({
      where: { userId: req.user.id },
      order: [['isDefault', 'DESC'], ['createdAt', 'ASC']]
    });
    res.json({ success: true, count: items.length, data: items });
  } catch (error) {
    console.error('Get wallet-cards error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/wallet-cards', protect, async (req, res) => {
  try {
    const userId = typeof req.user.id === 'number' ? req.user.id : parseInt(String(req.user.id), 10);
    const { name, holderName, cardNumber, expiryDate, rib, isDefault } = req.body;
    const holder = (holderName != null ? String(holderName).trim() : '') || '';
    const number = (cardNumber != null ? String(cardNumber).trim() : '') || '';
    const expiry = (expiryDate != null ? String(expiryDate).trim() : '') || '';
    if (!holder || !number || !expiry) {
      return res.status(400).json({ success: false, message: 'Holder name, card number and expiry are required' });
    }
    const cardName = name != null ? String(name).trim() : null;
    const isFirst = (await WalletCard.count({ where: { userId } })) === 0;
    const item = await WalletCard.create({
      userId,
      name: cardName || null,
      holderName: holder,
      cardNumber: number,
      expiryDate: expiry,
      rib: rib != null ? String(rib).trim() : null,
      isDefault: isFirst || Boolean(isDefault)
    });
    if (isFirst || isDefault) {
      await WalletCard.update(
        { isDefault: false },
        { where: { userId, id: { [Op.ne]: item.id } } }
      );
      await item.update({ isDefault: true });
    }
    res.status(201).json({ success: true, data: item });
  } catch (error) {
    console.error('Create wallet-card error:', error);
    res.status(500).json({ success: false, message: error.message || 'Server error' });
  }
});

router.put('/wallet-cards/:id', protect, async (req, res) => {
  try {
    const item = await WalletCard.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Wallet card not found' });
    }
    const { name, holderName, cardNumber, expiryDate, rib, isDefault } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name != null ? String(name).trim() : null;
    if (holderName !== undefined) updates.holderName = String(holderName).trim();
    if (cardNumber !== undefined) updates.cardNumber = String(cardNumber).trim();
    if (expiryDate !== undefined) updates.expiryDate = String(expiryDate).trim();
    if (rib !== undefined) updates.rib = rib != null ? String(rib).trim() : null;
    if (isDefault === true) {
      await WalletCard.update({ isDefault: false }, { where: { userId: req.user.id } });
      updates.isDefault = true;
    }
    await item.update(updates);
    await item.reload();
    res.json({ success: true, data: item });
  } catch (error) {
    console.error('Update wallet-card error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/wallet-cards/:id', protect, async (req, res) => {
  try {
    const item = await WalletCard.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!item) {
      return res.status(404).json({ success: false, message: 'Wallet card not found' });
    }
    const wasDefault = item.isDefault;
    await item.destroy();
    if (wasDefault) {
      const next = await WalletCard.findOne({
        where: { userId: req.user.id },
        order: [['createdAt', 'ASC']]
      });
      if (next) {
        await next.update({ isDefault: true });
      }
    }
    res.json({ success: true, message: 'Wallet card deleted' });
  } catch (error) {
    console.error('Delete wallet-card error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
