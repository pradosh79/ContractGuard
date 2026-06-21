const mongoose = require('mongoose');

const ClauseSchema = new mongoose.Schema({
  clauseText: { type: String, required: true },
  category: { type: String, required: true }, // e.g. "Payment Terms", "IP Rights", "Liability", "Termination"
  riskLevel: { type: String, enum: ['low', 'medium', 'high'], required: true },
  explanation: { type: String, required: true }
}, { _id: false });

const AnalysisSchema = new mongoose.Schema({
  fileName: { type: String, required: true },
  contractTitle: { type: String, default: 'Untitled Contract' },
  overallRiskScore: { type: Number, min: 0, max: 100, required: true }, // 0 = safe, 100 = very risky
  summary: { type: String, required: true },
  clauses: { type: [ClauseSchema], default: [] },
  rawTextLength: { type: Number },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Analysis', AnalysisSchema);
