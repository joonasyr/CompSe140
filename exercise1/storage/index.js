import express from 'express';
import fs from 'fs';
import path from 'path';

const app = express();
const PORT = 8080;
const DATA_DIR = process.env.DATA_DIR;
const LOG_FILE = path.join(DATA_DIR, 'shared.log');

// Ensure folder and file exist
fs.mkdirSync(DATA_DIR, { recursive: true });
fs.closeSync(fs.openSync(LOG_FILE, 'a'));

app.use('/log', express.text({ type: '*/*' }));

app.post('/log', (req, res) => {
  const body = (req.body ?? '').toString();
  fs.appendFileSync(LOG_FILE, body.endsWith('\n') ? body : body + '\n');
  res.type('text/plain').send('OK\n');
});

app.get('/log', (req, res) => {
  const content = fs.readFileSync(LOG_FILE, 'utf8');
  res.type('text/plain').send(content);
});

app.get('/clear', (_req, res) => {
  fs.writeFileSync(LOG_FILE, '');
  res.type('text/plain').send('CLEARED\n');
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`storage listening on ${PORT}`);
});
