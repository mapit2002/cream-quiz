const express = require("express");
const fs = require("fs");
const path = require("path");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(express.static("public"));
app.use(express.json());

// API: створити Stripe Checkout сесію
app.post("/api/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: "PerfectSkin Test Results",
          },
          unit_amount: 1.99, // $1.99
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${process.env.DOMAIN}/success.html?paid=true`,
      cancel_url: `${process.env.DOMAIN}/index.html`,
    });

    res.json({ id: session.id });
  } catch (err) {
    console.error("Error creating checkout session:", err.message);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});

// API: зберегти результати
app.post("/api/save-results", (req, res) => {
  const newResult = {
    answers: req.body.answers,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(__dirname, "public", "results.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    let json = [];

    if (!err && data) {
      try {
        json = JSON.parse(data);
        if (!Array.isArray(json)) json = [];
      } catch {
        json = [];
      }
    }

    json.push(newResult);

    fs.writeFile(filePath, JSON.stringify(json, null, 2), (err) => {
      if (err) {
        console.error("Error saving results:", err.message);
        return res.status(500).json({ message: "Error saving results" });
      }
      res.json({ message: "Results saved successfully" });
    });
  });
});

// API: отримати результати
app.get("/api/results", (req, res) => {
  const filePath = path.join(__dirname, "public", "results.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to load results" });

    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch {
      res.status(500).json({ error: "Invalid results data" });
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
