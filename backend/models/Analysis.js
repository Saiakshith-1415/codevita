const mongoose = require("mongoose");

const analysisSchema = new mongoose.Schema({
  userId: String,
  code: String,
  score: Number,
  complexity: String,
  issues: [String],
  lines: Number
}, { timestamps: true });


module.exports = mongoose.model("Analysis", analysisSchema);