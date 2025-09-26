const express = require('express');
const fs = require('fs');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4242;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(bodyParser.json());

// Create Checkout Session
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Quiz Results',
          },
          unit_amount: 299, // in cents
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: 'https://cream-quiz-1.onrender.com/success.html',
      cancel_url: 'https://cream-quiz-1.onrender.com/cancel.html',
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// Save Quiz Results
app.post('/api/save-results', (req, res) => {
  const result = req.body;

  if (!result || Object.keys(result).length === 0) {
    return res.status(400).json({ message: 'Invalid result data' });
  }

  const filePath = path.join(__dirname, 'results.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    let results = [];
    if (!err && data) {
      try {
        results = JSON.parse(data);
      } catch (parseErr) {
        console.error('Error parsing JSON:', parseErr);
      }
    }

    results.push(result);

    fs.writeFile(filePath, JSON.stringify(results, null, 2), err => {
      if (err) {
        console.error('Error saving results:', err);
        return res.status(500).json({ message: 'Failed to save results' });
      }

      res.status(200).json({ message: 'Results saved successfully' });
    });
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
