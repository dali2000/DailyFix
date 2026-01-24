const express = require('express');
const router = express.Router();
const Task = require('../models/Task.model');
const { protect } = require('../middleware/auth.middleware');
const { Op } = require('sequelize');

// @route   GET /api/tasks
// @desc    Get all tasks for user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: { userId: req.user.id },
      order: [['createdAt', 'DESC']]
    });
    
    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/:id
// @desc    Get single task
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/tasks
// @desc    Create new task
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      userId: req.user.id
    };

    const task = await Task.create(taskData);

    res.status(201).json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/tasks/:id
// @desc    Update task
// @access  Private
router.put('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.update(req.body);
    await task.reload();

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/tasks/:id
// @desc    Delete task
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const task = await Task.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    res.json({
      success: true,
      message: 'Task deleted successfully'
    });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/tasks/status/:status
// @desc    Get tasks by status
// @access  Private
router.get('/status/:status', protect, async (req, res) => {
  try {
    const tasks = await Task.findAll({
      where: {
        userId: req.user.id,
        status: req.params.status
      },
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: tasks.length,
      data: tasks
    });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;
