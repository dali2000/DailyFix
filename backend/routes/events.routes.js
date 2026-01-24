const express = require('express');
const router = express.Router();
const Event = require('../models/Event.model');
const { protect } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// @route   GET /api/events
// @desc    Get all events for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { userId: req.user.id },
      order: [['startDate', 'ASC']]
    });
    
    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/events/:id
// @desc    Get single event
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/events
// @desc    Create new event
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const eventData = {
      ...req.body,
      userId: req.user.id
    };

    const event = await Event.create(eventData);

    res.status(201).json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/events/:id
// @desc    Update event
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.update(req.body);
    await event.reload();

    res.json({
      success: true,
      data: event
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/events/:id
// @desc    Delete event
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const event = await Event.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    await event.destroy();

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/events/date/:date
// @desc    Get events for a specific date
// @access  Private
router.get('/date/:date', protect, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const startOfDay = new Date(date.setHours(0, 0, 0, 0));
    const endOfDay = new Date(date.setHours(23, 59, 59, 999));

    const events = await Event.findAll({
      where: {
        userId: req.user.id,
        startDate: {
          [Op.gte]: startOfDay,
          [Op.lte]: endOfDay
        }
      },
      order: [['startDate', 'ASC']]
    });

    res.json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    console.error('Get events by date error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
