const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config(); // <-- обов'язково на самому початку!

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 4242;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// 🔹 Перевірка ключа Stripe
console.log("✅ Stripe ключ прочитаний з .env:", process.env.STRIPE_SECRET_KEY ? 'OK' : '❌ NOT FOUND');

app.get('/api/questions', (req, res) => {
  const questionsPath = path.join(__dirname, 'questions.json');
  fs.readFile(questionsPath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Error reading questions:', err);
      return res.status(500).json({ error: 'Failed to load questions' });
    }
    res.json(JSON.parse(data));
  });
});

app.post('/api/save-results', (req, res) => {
  const results = req.body;
  const resultsPath = path.join(__dirname, 'results.json');

  fs.readFile(resultsPath, 'utf8', (err, data) => {
    let json = [];
    if (!err) {
      try {
        json = JSON.parse(data);
      } catch (e) {
        console.error('❌ Error parsing results file:', e);
      }
    }
    json.push(results);

    fs.writeFile(resultsPath, JSON.stringify(json, null, 2), (err) => {
      if (err) {
        console.error('❌ Error saving results:', err);
        return res.status(500).json({ error: 'Failed to save results' });
      }
      res.status(200).json({ message: 'Results saved successfully' });
    });
  });
});

// 🔹 Stripe checkout endpoint
app.post('/api/create-checkout-session', async (req, res) => {
  console.log("➡️ POST /api/create-checkout-session");

  const YOUR_DOMAIN = 'https://cream-quiz-1.onrender.com';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Skin Type Report',
          },
          unit_amount: 500, // $5.00
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${YOUR_DOMAIN}/success.html?paid=true`,
      cancel_url: `${YOUR_DOMAIN}/cancel.html`,
    });

    console.log("✅ Stripe session created:", session.id);
    res.json({ id: session.id });
  } catch (err) {
    console.error('❌ Error creating checkout session:', err.message);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
