const Order = require("../models/Order");
const User = require("../models/User");
const Chefs = require("../models/Chefs");

const getAnalyticsSummary = async (req, res) => {
  try {
    const totalClients = await User.countDocuments({});
    const rev = await Order.aggregate([{ $group: { _id: null, totalRevenue: { $sum: "$grandTotal" } } }]);
    const totalRevenue = rev[0]?.totalRevenue || 0;
    const totalOrders = await Order.countDocuments();
    const totalChefs = await Chefs.countDocuments();
    res.json({ totalClients, totalRevenue, totalOrders, totalChefs });
  } catch {
    res.status(500).json({ error: "Failed to fetch analytics data" });
  }
};

module.exports = { getAnalyticsSummary };
