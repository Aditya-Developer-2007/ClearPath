import express from 'express';
import {
  extractIntakeData,
  askAssistant,
  explainQuery,
  generateSummary,
  generateInsights,
} from '../services/aiService.js';

const router = express.Router();

router.post('/intake', async (req, res) => {
  const { text } = req.body;
  try {
    const result = await extractIntakeData(text);
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.post('/ask', async (req, res) => {
  const question = req.body.question || req.body.query;
  try {
    const result = await askAssistant(question);
    res.json(result);
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.post('/explain-query', async (req, res) => {
  const { note } = req.body;
  try {
    const explanation = await explainQuery(note);
    res.json({ ok: true, explanation });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.post('/summarize', async (req, res) => {
  const id = req.body.approvalRequestId || req.body.id;
  try {
    const result = await generateSummary(id);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

// Alias for backwards compatibility
router.post('/summary', async (req, res) => {
  const id = req.body.approvalRequestId || req.body.id;
  try {
    const result = await generateSummary(id);
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

router.post('/insight', async (req, res) => {
  try {
    const insights = await generateInsights(req.body);
    res.json({ ok: true, insights });
  } catch (error) {
    res.status(500).json({ ok: false, message: error.message });
  }
});

export default router;
