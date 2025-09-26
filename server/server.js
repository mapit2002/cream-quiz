const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
require('dotenv').config();
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/api/save-results', (req, res) => {
  const filePath = path.join(__dirname, 'results.json');

  // Читаємо існуючий файл або створюємо новий
  fs.readFile(filePath, 'utf8', (err, data) => {
    let results = [];
    if (!err && data) {
      try {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          results = parsed;
        } else {
          console.warn("⚠️ Warning: existing results.json is not an array. Overwriting.");
        }
      } catch (e) {
        console.warn("⚠️ Warning: Failed to parse results.json. Creating a new one.");
      }
    }

    // Додаємо нові результати
    results.push(req.body);

    // Записуємо назад у файл
    fs.writeFile(filePath, JSON.stringify(results, null, 2), (writeErr) => {
      if (writeErr) {
        console.error("❌ Error saving results:", writeErr);
        return res.status(500).json({ error: 'Failed to save results.' });
      }
      console.log("✅ Results saved successfully.");
      res.status(200).json({ message: 'Results saved.' });
    });
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
