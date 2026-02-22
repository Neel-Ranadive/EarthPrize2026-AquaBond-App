const express = require('express');
const bodyParser = require('body-parser');
const sharp = require('sharp');

const app = express();
app.use(bodyParser.json({ limit: '10mb' }));

app.post('/decode', async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'missing imageBase64' });
    const buffer = Buffer.from(imageBase64, 'base64');
    // Resize to small to speed processing
    const img = sharp(buffer);
    const metadata = await img.metadata();
    const small = await img.resize(64, 64, { fit: 'inside' }).raw().toBuffer({ resolveWithObject: true });
    const { data, info } = small; // data is raw RGB(A)
    const channels = info.channels;
    let r = 0, g = 0, b = 0, count = 0;
    for (let i = 0; i < data.length; i += channels) {
      r += data[i];
      g += data[i + 1];
      b += data[i + 2];
      count++;
    }
    const avgR = r / count;
    const avgG = g / count;
    const avgB = b / count;
    res.json({ r: avgR, g: avgG, b: avgB, width: info.width, height: info.height });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

app.post('/upload', async (req, res) => {
  try {
    const { imageBase64, metadata } = req.body;
    if (!imageBase64) return res.status(400).json({ error: 'missing imageBase64' });
    const buffer = Buffer.from(imageBase64, 'base64');
    const id = Date.now();
    const outDir = 'uploads';
    const fs = require('fs');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    const filename = `${outDir}/scan_${id}.jpg`;
    fs.writeFileSync(filename, buffer);
    // save metadata log
    const log = { id, filename, metadata };
    const logFile = `${outDir}/scans.json`;
    let arr = [];
    if (fs.existsSync(logFile)) arr = JSON.parse(fs.readFileSync(logFile));
    arr.unshift(log);
    fs.writeFileSync(logFile, JSON.stringify(arr, null, 2));
    res.json({ ok: true, id, filename });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log('decode server listening on', port));
