const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const apiKey = (process.env.GEMINI_API_KEY || '').trim();

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

/** POST /api/gemini/calories-from-image - Estimation des calories à partir d'une photo de plat (vision). */
router.post('/calories-from-image', async (req, res) => {
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      success: false,
      message: 'GEMINI_API_KEY is not configured on the server.'
    });
  }
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ success: false, message: 'imageBase64 is required.' });
  }
  const type = (mimeType && typeof mimeType === 'string') ? mimeType : 'image/jpeg';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.2
      }
    });
    const prompt = `Analyze this food/meal image. Return ONLY a valid JSON object with exactly these two keys (no other text, no markdown):
- "calories": number (estimated total calories for the whole meal/plate shown)
- "name": string (short meal name in the same language as the user, e.g. "Salade César", "Grilled chicken with rice")

Be realistic with calorie estimates. If you cannot see food clearly, use calories: 0 and name: "Repas non reconnu".`;
    const imagePart = { inlineData: { mimeType: type, data: imageBase64 } };
    const result = await model.generateContent([imagePart, prompt]);
    const response = result.response;
    let text = '';
    if (response && typeof response.text === 'function') {
      const out = response.text();
      text = (typeof out?.then === 'function' ? await out : out) || '';
    }
    let json = {};
    try {
      json = JSON.parse((text || '{}').trim());
    } catch (_) {
      // ignore invalid JSON
    }
    const calories = typeof json.calories === 'number' && json.calories >= 0 ? Math.round(json.calories) : 0;
    const name = typeof json.name === 'string' ? json.name.trim() : undefined;
    res.json({ success: true, calories, name });
  } catch (err) {
    if (isQuotaError(err)) {
      return res.status(429).json({
        success: false,
        message: 'health.discussionQuotaExceeded'
      });
    }
    console.error('Gemini calories-from-image error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Estimation failed.'
    });
  }
});

/** POST /api/gemini/receipt-from-image - Analyse d'une facture/reçu (vision). */
router.post('/receipt-from-image', async (req, res) => {
  if (!apiKey || !apiKey.trim()) {
    return res.status(503).json({
      success: false,
      message: 'GEMINI_API_KEY is not configured on the server.'
    });
  }
  const { imageBase64, mimeType } = req.body;
  if (!imageBase64 || typeof imageBase64 !== 'string') {
    return res.status(400).json({ success: false, message: 'imageBase64 is required.' });
  }
  const type = (mimeType && typeof mimeType === 'string') ? mimeType : 'image/jpeg';
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2 }
    });
    const prompt = `This image is a receipt or invoice (facture). Extract the following and return ONLY a valid JSON object (no other text, no markdown):
- "amount": number (total amount to pay, as a number without currency symbol)
- "description": string (store name, merchant, or short description of the receipt)
- "date": string (date of the receipt in YYYY-MM-DD format if visible, otherwise empty string)
- "category": string (one of: food, shopping, health, leisure, transport, bills, other - choose the best match)
- "paymentMethod": string (e.g. Card, Cash, Visa) if visible, otherwise empty string

If you cannot read a field, omit it or use empty string. Always try to extract at least amount and description.`;
    const imagePart = { inlineData: { mimeType: type, data: imageBase64 } };
    const result = await model.generateContent([imagePart, prompt]);
    const response = result.response;
    let text = '';
    if (response && typeof response.text === 'function') {
      const out = response.text();
      text = (typeof out?.then === 'function' ? await out : out) || '';
    }
    let json = {};
    try {
      json = JSON.parse((text || '{}').trim());
    } catch (_) {}
    const amount = typeof json.amount === 'number' ? json.amount : undefined;
    const description = typeof json.description === 'string' ? json.description.trim() : undefined;
    const date = typeof json.date === 'string' ? json.date.trim() : undefined;
    const category = typeof json.category === 'string' ? json.category.trim() : undefined;
    const paymentMethod = typeof json.paymentMethod === 'string' ? json.paymentMethod.trim() : undefined;
    res.json({ success: true, amount, description, date, category, paymentMethod });
  } catch (err) {
    if (isQuotaError(err)) {
      return res.status(429).json({
        success: false,
        message: 'health.discussionQuotaExceeded'
      });
    }
    console.error('Gemini receipt-from-image error:', err);
    res.status(500).json({
      success: false,
      message: err.message || 'Receipt analysis failed.'
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
