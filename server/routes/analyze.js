const express = require('express');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const Anthropic = require('@anthropic-ai/sdk');
const Analysis = require('../models/Analysis');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a contract risk analyst for freelancers and solopreneurs.
You will be given the raw text of a client contract or agreement.
Read it carefully and identify clauses that matter to a freelancer's money, rights, or risk exposure.

Focus especially on these categories when present: Payment Terms, IP / Ownership Rights,
Liability & Indemnification, Termination & Kill Fee, Scope Creep / Revisions, Confidentiality / Non-Compete, Late Payment Penalties.

Respond ONLY with valid JSON, no preamble, no markdown fences, matching this exact shape:
{
  "contractTitle": "short descriptive title for this contract",
  "overallRiskScore": <integer 0-100, 0 = very safe for the freelancer, 100 = very risky>,
  "summary": "2-3 sentence plain-English summary of the overall risk picture",
  "clauses": [
    {
      "clauseText": "the relevant excerpt or paraphrase of the clause (under 40 words)",
      "category": "one of: Payment Terms, IP Rights, Liability, Termination, Scope, Confidentiality, Other",
      "riskLevel": "low | medium | high",
      "explanation": "one sentence in plain English on why this matters and what could go wrong"
    }
  ]
}
Only flag clauses that are genuinely notable. If the contract is short or has few risk areas, return fewer clauses rather than padding the list.`;

// POST /api/analyze - upload a contract file (pdf or txt) or raw text, get AI risk report
router.post('/', upload.single('contract'), async (req, res) => {
  try {
    let contractText = req.body.contractText || '';
    let fileName = 'pasted-text.txt';

    if (req.file) {
      fileName = req.file.originalname;
      if (req.file.mimetype === 'application/pdf') {
        const parsed = await pdfParse(req.file.buffer);
        contractText = parsed.text;
      } else {
        contractText = req.file.buffer.toString('utf-8');
      }
    }

    if (!contractText || contractText.trim().length < 30) {
      return res.status(400).json({ error: 'No usable contract text found. Upload a PDF/TXT or paste the contract text.' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: contractText.slice(0, 15000) }]
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    let parsed;
    try {
      const cleaned = textBlock.text.replace(/```json|```/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch (e) {
      return res.status(502).json({ error: 'AI returned an unparseable response. Try again.' });
    }

    const analysis = new Analysis({
      fileName,
      contractTitle: parsed.contractTitle || fileName,
      overallRiskScore: parsed.overallRiskScore,
      summary: parsed.summary,
      clauses: parsed.clauses || [],
      rawTextLength: contractText.length
    });
    await analysis.save();

    res.json(analysis);
  } catch (err) {
    console.error('Analyze error:', err);
    res.status(500).json({ error: 'Something went wrong analyzing the contract.' });
  }
});

// GET /api/analyze/history - list past analyses
router.get('/history', async (req, res) => {
  try {
    const items = await Analysis.find().sort({ createdAt: -1 }).limit(50);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: 'Could not load history.' });
  }
});

// GET /api/analyze/:id - fetch one analysis
router.get('/:id', async (req, res) => {
  try {
    const item = await Analysis.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Not found' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: 'Could not load analysis.' });
  }
});

// DELETE /api/analyze/:id
router.delete('/:id', async (req, res) => {
  try {
    await Analysis.findByIdAndDelete(req.params.id);
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: 'Could not delete.' });
  }
});

module.exports = router;
