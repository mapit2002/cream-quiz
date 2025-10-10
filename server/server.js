const express = require('express');
const fs = require('fs');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
 // 🔑 Replace with your real secret key

const app = express();
const path = require('path');
const favicon = require('serve-favicon');

// Роздаємо статичні файли з /public
app.use(express.static(path.join(__dirname, 'public')));

// Видаємо favicon з правильними заголовками
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

// Додатковий "страхувальний" маршрут (на випадок кеша або порядку middleware)
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=604800, immutable'); // 7 днів
  res.sendFile(path.join(__dirname, 'public', 'favicon.ico'));
});

// Перенаправлення з http → https і з www → без www
app.use((req, res, next) => {
  // Якщо з'єднання не HTTPS — перенаправляємо
  if (req.headers["x-forwarded-proto"] !== "https") {
    return res.redirect("https://" + req.headers.host + req.url);
  }

  // Якщо користувач відкрив www.prfskin.com → перенаправляємо на prfskin.com
  if (req.headers.host && req.headers.host.startsWith("www.")) {
    const newHost = req.headers.host.slice(4); // видаляємо "www."
    return res.redirect("https://" + newHost + req.url);
  }

  next();
});

const PORT = process.env.PORT || 10000;

// ✅ Middleware
app.use(cors());
app.use(express.json());

// ✅ Static files
app.use(express.static('public'));
app.use('/images', express.static(path.join(__dirname, '../public/images')));
app.use('/server', express.static(path.join(__dirname))); // to access results.json

// ✅ GET /api/questions
app.get('/api/questions', (req, res) => {
  try {
    const questions = JSON.parse(fs.readFileSync(path.join(__dirname, 'questions.json'), 'utf8'));
    res.json(questions);
  } catch (error) {
    console.error('❌ Failed to load questions:', error.message);
    res.status(500).json({ error: 'Could not load questions' });
  }
});

// ✅ POST /api/save-results
app.post('/api/save-results', (req, res) => {
  try {
    fs.writeFileSync(path.join(__dirname, '../public/results.json'), JSON.stringify(req.body, null, 2));
    res.json({ message: 'Results saved successfully' });
  } catch (error) {
    console.error('❌ Failed to save results:', error.message);
    res.status(500).json({ error: 'Could not save results' });
  }
});

// ✅ Stripe Checkout
app.post('/api/create-checkout-session', async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Results',
            },
            unit_amount: 199,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: 'https://cream-quiz-1.onrender.com/success.html?paid=true',
      cancel_url: 'http://cream-quiz-1.onrender.com/cancel.html'
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error('Stripe error:', error.message);
    res.status(500).json({ error: 'Stripe error' });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server started at: http://localhost:${PORT}`);
});
