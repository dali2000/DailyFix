const express = require('express');
const router = express.Router();
const { SocialEvent, ActivitySuggestion } = require('../models/Social.model');
const { protect } = require('../middleware/auth.middleware');

// ========== SOCIAL EVENTS ==========
router.get('/events', protect, async (req, res) => {
  try {
    const events = await SocialEvent.findAll({
      where: { userId: req.user.id },
      order: [['date', 'ASC']]
    });
    res.json({ success: true, count: events.length, data: events });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/events/:id', protect, async (req, res) => {
  try {
    const event = await SocialEvent.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!event) return res.status(404).json({ success: false, message: 'Social event not found' });
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/events', protect, async (req, res) => {
  try {
    const event = await SocialEvent.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/events/:id', protect, async (req, res) => {
  try {
    const event = await SocialEvent.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!event) return res.status(404).json({ success: false, message: 'Social event not found' });
    await event.update(req.body);
    await event.reload();
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/events/:id', protect, async (req, res) => {
  try {
    const event = await SocialEvent.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!event) return res.status(404).json({ success: false, message: 'Social event not found' });
    await event.destroy();
    res.json({ success: true, message: 'Social event deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ========== ACTIVITY SUGGESTIONS ==========
router.get('/suggestions', protect, async (req, res) => {
  try {
    const suggestions = await ActivitySuggestion.findAll({
      where: { userId: req.user.id }
    });
    res.json({ success: true, count: suggestions.length, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/suggestions/:id', protect, async (req, res) => {
  try {
    const suggestion = await ActivitySuggestion.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Activity suggestion not found' });
    res.json({ success: true, data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/suggestions', protect, async (req, res) => {
  try {
    const suggestion = await ActivitySuggestion.create({ ...req.body, userId: req.user.id });
    res.status(201).json({ success: true, data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/suggestions/:id', protect, async (req, res) => {
  try {
    const suggestion = await ActivitySuggestion.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Activity suggestion not found' });
    await suggestion.update(req.body);
    await suggestion.reload();
    res.json({ success: true, data: suggestion });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.delete('/suggestions/:id', protect, async (req, res) => {
  try {
    const suggestion = await ActivitySuggestion.findOne({
      where: { id: req.params.id, userId: req.user.id }
    });
    if (!suggestion) return res.status(404).json({ success: false, message: 'Activity suggestion not found' });
    await suggestion.destroy();
    res.json({ success: true, message: 'Activity suggestion deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
