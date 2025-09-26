const express = require("express");
const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static(path.join(__dirname, "..")));
app.use(express.json());

// Створення Stripe Checkout сесії
app.post("/api/create-checkout-session", async (req, res) => {
  const { results } = req.body;

  if (!results || !Array.isArray(results)) {
    return res.status(400).json({ error: "Invalid results format" });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: "PerfectSkin Test Result",
          },
          unit_amount: 990, // $9.90
        },
        quantity: 1,
      },
    ],
    success_url: `${req.headers.origin}/success.html?paid=true`,
    cancel_url: `${req.headers.origin}/`,
  });

  // Зберігаємо результати до файлу (до оплати)
  fs.readFile(path.join(__dirname, "results.json"), "utf8", (err, data) => {
    let json = [];

    if (!err && data) {
      try {
        json = JSON.parse(data);
      } catch (e) {
        console.error("JSON parse error:", e);
      }
    }

    json.push(results);

    fs.writeFile(
      path.join(__dirname, "results.json"),
      JSON.stringify(json, null, 2),
      (err) => {
        if (err) {
          console.error("Error saving results:", err);
        }
      }
    );
  });

  res.json({ url: session.url });
});

// Отримання результатів для сторінки успіху
app.get("/api/results", (req, res) => {
  fs.readFile(path.join(__dirname, "results.json"), "utf8", (err, data) => {
    if (err) {
      console.error("Error reading results:", err);
      return res.status(500).send("Failed to load results.");
    }

    try {
      const results = JSON.parse(data);
      res.json(results[results.length - 1]); // останній результат
    } catch (e) {
      res.status(500).send("Invalid JSON format.");
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
