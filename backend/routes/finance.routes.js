const express = require('express');
const router = express.Router();
const { Expense, Budget, SavingsGoal, Salary } = require('../models/Finance.model');
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

// Create routes for each model (Budget et SavingsGoal n'ont pas de colonne "date", utiliser createdAt)
createCRUDRoutes(Expense, 'expenses', [['date', 'DESC']]);
createCRUDRoutes(Budget, 'budgets', [['createdAt', 'DESC']]);
createCRUDRoutes(SavingsGoal, 'savings-goals', [['createdAt', 'DESC']]);
createCRUDRoutes(Salary, 'salaries', [['date', 'DESC']]);

module.exports = router;
