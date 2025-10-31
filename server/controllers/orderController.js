const mongoose = require("mongoose");
const Order = require("../models/Order");
const User = require("../models/User");
const Table = require("../models/Table");
const Food = require("../models/Food");
const Chefs = require("../models/Chefs");
const { ALLOWED_CHAIRS } = require("../models/Table");

async function claimBestFitTable({ numOfPerson, orderId, session }) {
  const query = { isOccupied: false, chairs: { $in: ALLOWED_CHAIRS, $gte: numOfPerson } };
  const update = {
    $set: {
      isOccupied: true,
      currentOrder: orderId,
      occupiedUntil: new Date(Date.now() + 20 * 60 * 1000),
    },
  };
  const options = { new: true, sort: { chairs: 1, tableNum: 1 }, session };
  return Table.findOneAndUpdate(query, update, options);
}

function normalizeOrderType(v) {
  const s = String(v || "").toLowerCase().replace(/[^a-z]/g, "");
  if (s === "takeaway" || s === "takeawayorder" || s === "takeawaypickup") return "takeaway";
  if (s === "dinein" || s === "dine") return "dine-in";
  return null;
}

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { user, items, tax = 0, grandTotal, orderType, note = "" } = req.body;
    if (!user) return res.status(400).json({ error: "User ID is required" });
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: "At least one item is required" });
    for (const it of items) {
      if (!it.food) return res.status(400).json({ error: "Missing food id in item" });
      if (!it.qnt || it.qnt < 1) return res.status(400).json({ error: "Invalid quantity" });
    }

    const parsedType = normalizeOrderType(orderType);
    if (!parsedType) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ error: "Order type is required and must be either 'dine-in' or 'takeaway'" });
    }

    const u = await User.findById(user).session(session);
    if (!u) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "User not found" });
    }

    const foodIds = items.map((it) => it.food);
    const foods = await Food.find({ _id: { $in: foodIds } }, { avgPrepTime: 1 }).lean().session(session);
    const foodMap = new Map(foods.map((f) => [String(f._id), Number(f.avgPrepTime) || 0]));
    const enrichedItems = items.map((it) => ({ ...it, avgPrepTime: foodMap.get(String(it.food)) ?? 0 }));

    const orderDoc = new Order({
      user,
      items: enrichedItems,
      tax: Number(tax || 0),
      grandTotal: Number(grandTotal ?? 0),
      orderType: parsedType,
      note,
      status: "processing",
      table: null,
    });

    let assignedTable = null;
    if (parsedType === "dine-in") {
      const numOfPerson = u.numOfPerson || 2;
      assignedTable = await claimBestFitTable({ numOfPerson, orderId: orderDoc._id, session });
      if (!assignedTable) {
        await session.abortTransaction();
        session.endSession();
        return res.status(409).json({ error: "No available table. Please wait or choose takeaway." });
      }
      orderDoc.table = assignedTable._id;
    }

    await orderDoc.save({ session });
    await session.commitTransaction();
    session.endSession();

    try {
      await Chefs.findOneAndUpdate({}, { $inc: { noOfOrdersTaken: 1 } }, { sort: { noOfOrdersTaken: 1, updatedAt: 1 }, new: true });
    } catch {}

    const populated = await Order.findById(orderDoc._id)
      .populate("user", "name numOfPerson")
      .populate("table", "tableNum tableName chairs isOccupied");

    return res.status(201).json({
      message: parsedType === "takeaway" ? "Takeaway order placed successfully" : "Order created successfully",
      order: populated,
      table: assignedTable || null,
    });
  } catch {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({ error: "Server error while creating order" });
  }
};

const updateOrderStatus = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid order id" });
    if (!["processing", "done", "pickup"].includes(status)) return res.status(400).json({ error: "Invalid status value" });
    const order = await Order.findById(id).session(session);
    if (!order) return res.status(404).json({ error: "Order not found" });

    let freedTable = false;
    const finishing = order.status === "processing" && (status === "done" || status === "pickup");

    if (order.orderType === "dine-in" && order.table && (status === "done" || status === "pickup")) {
      const t = await Table.findOneAndUpdate(
        { _id: order.table, currentOrder: order._id },
        { $set: { isOccupied: false, currentOrder: null, occupiedUntil: null } },
        { new: true, session }
      );
      freedTable = Boolean(t);
    }

    if (finishing) {
      try {
        await Chefs.findOneAndUpdate(
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
          { sort: { updatedAt: -1 } }
        );
      } catch {}
    }

    order.status = status;
    await order.save({ session });
    await session.commitTransaction();
    session.endSession();

    return res.json({ message: "Order status updated", tableFreed: freedTable, order });
  } catch {
    await session.abortTransaction().catch(() => {});
    session.endSession();
    return res.status(500).json({ error: "Server error while updating order" });
  }
};

const getAllOrders = async (req, res) => {
  try {
    const { sort = "-createdAt", limit = 50, page = 1 } = req.query;
    const lim = Math.min(100, Math.max(1, Number(limit)));
    const skip = (Math.max(1, Number(page)) - 1) * lim;
    const [orders, total] = await Promise.all([
      Order.find({})
        .populate("user", "name numOfPerson")
        .populate("table", "tableNum tableName chairs")
        .sort(sort)
        .skip(skip)
        .limit(lim)
        .lean(),
      Order.countDocuments(),
    ]);
    const formatted = orders.map((o) => ({ ...o, tableNo: o.table?.tableNum ?? null }));
    res.json({ total, page: Number(page), pages: Math.ceil(total / lim), orders: formatted });
  } catch {
    res.status(500).json({ error: "Server error fetching orders" });
  }
};

module.exports = { createOrder, updateOrderStatus, getAllOrders };
