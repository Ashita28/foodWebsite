const mongoose = require('mongoose');
const Chefs = require('../models/Chefs');

const chefsData = async (req, res) => {
  try {
    const payload = req.body;
    if (!payload || (Array.isArray(payload) && payload.length === 0)) {
      return res.status(400).json({ error: 'Provide chef data' });
    }
    const arr = Array.isArray(payload) ? payload : [payload];
    for (const ch of arr) {
      if (!ch?.name) return res.status(400).json({ error: 'Chef name is required' });
      if (typeof ch.noOfOrdersTaken === 'undefined') ch.noOfOrdersTaken = 0;
    }
    const docs = await Chefs.insertMany(arr, { ordered: true });
    return res.status(201).json({ message: 'Chefs created', chefs: docs });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const updateChefsData = async (req, res) => {
  try {
    const { decrement = false } = req.body || {};
    const sort = { noOfOrdersTaken: 1, updatedAt: 1 };

    let chef;
    if (decrement) {
      chef = await Chefs.findOneAndUpdate(
        {},
        [
          {
            $set: {
              noOfOrdersTaken: {
                $cond: [
                  { $gt: ['$noOfOrdersTaken', 0] },
                  { $subtract: ['$noOfOrdersTaken', 1] },
                  0,
                ],
              },
            },
          },
        ],
        { new: true, sort }
      ).lean();
    } else {
      chef = await Chefs.findOneAndUpdate(
        {},
        { $inc: { noOfOrdersTaken: 1 } },
        { new: true, sort }
      ).lean();
    }

    if (!chef) return res.status(404).json({ error: 'No chefs found' });
    return res.json({ message: decrement ? 'Chef load decremented' : 'Chef assigned', chef });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const allChefs = async (req, res) => {
  try {
    const { sortBy = 'noOfOrdersTaken', dir = 'asc' } = req.query;
    const dirNum = dir === 'desc' ? -1 : 1;
    const chefs = await Chefs.find({}).sort({ [sortBy]: dirNum, updatedAt: dirNum });
    return res.json({ total: chefs.length, chefs });
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

const getChef = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: 'Invalid id' });
    const chef = await Chefs.findById(id);
    if (!chef) return res.status(404).json({ error: 'Chef not found' });
    return res.json(chef);
  } catch (err) {
    return res.status(500).json({ error: 'Server error' });
  }
};

module.exports = { chefsData, updateChefsData, allChefs, getChef };
