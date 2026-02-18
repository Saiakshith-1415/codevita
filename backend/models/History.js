const mongoose = require("mongoose");

const historySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  code: String,
  language: String,
  review: String,
  suggestions: String,
  refactoredCode: String,
  critical: Number,
  high: Number,
  medium: Number,
  low: Number,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("History", historySchema);