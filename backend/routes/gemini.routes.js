const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = process.env.GEMINI_API_KEY;

function isQuotaError(err) {
  const msg = err && err.message ? String(err.message) : '';
  return /429|quota|Quota exceeded/i.test(msg);
}

/** POST /api/gemini/chat - Chat avec instruction système (santé ou maison). */
router.post('/chat', async (req, res) => {
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      success: false,
      message: 'GEMINI_API_KEY is not configured on the server.'
    });
  }
  const { userMessage, history = [], systemInstruction } = req.body;
  if (!userMessage || typeof userMessage !== 'string') {
    return res.status(400).json({ success: false, message: 'userMessage is required.' });
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chatHistory = (Array.isArray(history) ? history : []).map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.text || '' }]
    }));
    const chat = model.startChat({
      history: chatHistory,
      systemInstruction: systemInstruction
        ? { role: 'user', parts: [{ text: systemInstruction }] }
        : undefined
    });
    const result = await chat.sendMessage(userMessage);
    const response = result.response;
    let text = '';
    if (response && typeof response.text === 'function') {
      const out = response.text();
      text = (typeof out?.then === 'function' ? await out : out) || '';
    }
    res.json({ success: true, text: text || "Désolé, je n'ai pas pu générer une réponse." });
  } catch (err) {
    if (isQuotaError(err)) {
      return res.status(429).json({
        success: false,
        message: 'health.discussionQuotaExceeded'
      });
    }
    console.error('Gemini chat error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Gemini request failed.'
    });
  }
});

/** POST /api/gemini/advice - Conseil du jour (prompt unique). */
router.post('/advice', async (req, res) => {
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      success: false,
      message: 'GEMINI_API_KEY is not configured on the server.'
    });
  }
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ success: false, message: 'prompt is required.' });
  }
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const result = await model.generateContent(prompt);
    const response = result.response;
    let text = '';
    if (response && typeof response.text === 'function') {
      const out = response.text();
      text = (typeof out?.then === 'function' ? await out : out) || '';
    }
    text = (text || '').trim() || 'Pas de conseil disponible.';
    res.json({ success: true, text });
  } catch (err) {
    if (isQuotaError(err)) {
      return res.status(429).json({
        success: false,
        message: 'health.discussionQuotaExceeded'
      });
    }
    console.error('Gemini advice error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Gemini request failed.'
    });
  }
});

module.exports = router;
