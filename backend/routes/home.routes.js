const express = require('express');
const router = express.Router();
const { ShoppingList, HouseholdTask } = require('../models/Home.model');
const { protect } = require('../middleware/auth.middleware');

// ========== SHOPPING LISTS ==========
router.get('/shopping-lists', protect, async (req, res) => {
  try {
    const lists = await ShoppingList.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, count: lists.length, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/shopping-lists/:id', protect, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!list) return res.status(404).json({ success: false, message: 'Shopping list not found' });
    res.json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/shopping-lists', protect, async (req, res) => {
  try {
    // S'assurer que items est toujours un tableau
    const listData = {
      ...req.body,
      userId: req.user.id,
      items: Array.isArray(req.body.items) ? req.body.items : []
    };
    const list = await ShoppingList.create(listData);
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    console.error('Create shopping list error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.put('/shopping-lists/:id', protect, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!list) return res.status(404).json({ success: false, message: 'Shopping list not found' });
    
    // S'assurer que items est toujours un tableau
    if (req.body.items && !Array.isArray(req.body.items)) {
      return res.status(400).json({ success: false, message: 'Items must be an array' });
    }
    
    await list.update(req.body);
    await list.reload();
    res.json({ success: true, data: list });
  } catch (error) {
    console.error('Update shopping list error:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
});

router.delete('/shopping-lists/:id', protect, async (req, res) => {
  try {
    const list = await ShoppingList.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!list) return res.status(404).json({ success: false, message: 'Shopping list not found' });
    await list.destroy();
    res.json({ success: true, message: 'Shopping list deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== HOUSEHOLD TASKS ==========
router.get('/household-tasks', protect, async (req, res) => {
  try {
    const tasks = await HouseholdTask.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/household-tasks/:id', protect, async (req, res) => {
  try {
    const task = await HouseholdTask.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!task) return res.status(404).json({ success: false, message: 'Household task not found' });
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/household-tasks', protect, async (req, res) => {
  try {
    const task = await HouseholdTask.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/household-tasks/:id', protect, async (req, res) => {
  try {
    const task = await HouseholdTask.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!task) return res.status(404).json({ success: false, message: 'Household task not found' });
    await task.update(req.body);
    await task.reload();
    res.json({ success: true, data: task });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/household-tasks/:id', protect, async (req, res) => {
  try {
    const task = await HouseholdTask.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!task) return res.status(404).json({ success: false, message: 'Household task not found' });
    await task.destroy();
    res.json({ success: true, message: 'Household task deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
