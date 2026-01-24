const express = require('express');
const router = express.Router();
const { JournalEntry, PersonalGoal, StressManagement } = require('../models/Wellness.model');
const { protect } = require('../middleware/auth.middleware');

// ========== JOURNAL ENTRIES ==========
router.get('/journal', protect, async (req, res) => {
  try {
    const entries = await JournalEntry.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json({ success: true, count: entries.length, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/journal/:id', protect, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!entry) return res.status(404).json({ success: false, message: 'Journal entry not found' });
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/journal', protect, async (req, res) => {
  try {
    const entry = await JournalEntry.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/journal/:id', protect, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!entry) return res.status(404).json({ success: false, message: 'Journal entry not found' });
    await entry.update(req.body);
    await entry.reload();
    res.json({ success: true, data: entry });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/journal/:id', protect, async (req, res) => {
  try {
    const entry = await JournalEntry.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!entry) return res.status(404).json({ success: false, message: 'Journal entry not found' });
    await entry.destroy();
    res.json({ success: true, message: 'Journal entry deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== PERSONAL GOALS ==========
router.get('/goals', protect, async (req, res) => {
  try {
    const goals = await PersonalGoal.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/goals/:id', protect, async (req, res) => {
  try {
    const goal = await PersonalGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ success: false, message: 'Personal goal not found' });
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/goals', protect, async (req, res) => {
  try {
    const goal = await PersonalGoal.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/goals/:id', protect, async (req, res) => {
  try {
    const goal = await PersonalGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ success: false, message: 'Personal goal not found' });
    await goal.update(req.body);
    await goal.reload();
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/goals/:id', protect, async (req, res) => {
  try {
    const goal = await PersonalGoal.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!goal) return res.status(404).json({ success: false, message: 'Personal goal not found' });
    await goal.destroy();
    res.json({ success: true, message: 'Personal goal deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== STRESS MANAGEMENT ==========
router.get('/stress', protect, async (req, res) => {
  try {
    const records = await StressManagement.findAll({
      where: { userId: req.user.id },
      order: [['date', 'DESC']]
    });
    res.json({ success: true, count: records.length, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/stress/:id', protect, async (req, res) => {
  try {
    const record = await StressManagement.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Stress record not found' });
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/stress', protect, async (req, res) => {
  try {
    const record = await StressManagement.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/stress/:id', protect, async (req, res) => {
  try {
    const record = await StressManagement.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Stress record not found' });
    await record.update(req.body);
    await record.reload();
    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/stress/:id', protect, async (req, res) => {
  try {
    const record = await StressManagement.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!record) return res.status(404).json({ success: false, message: 'Stress record not found' });
    await record.destroy();
    res.json({ success: true, message: 'Stress record deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
