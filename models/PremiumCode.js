const mongoose = require("mongoose");

const premiumCodeSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  type: { type: String, enum: ["monthly", "lifetime"], default: "monthly" }, // New Field
  claimed: { type: Boolean, default: false },
  claimedBy: { type: String, default: null },
  claimedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
});
module.exports = mongoose.model("PremiumCode", premiumCodeSchema);
