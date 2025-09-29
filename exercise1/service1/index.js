const express = require('express');
const fs = require('fs');
const { execSync } = require('child_process');
const os = require('os');
const path = require('path');
const fetch = require('node-fetch');

const STORAGE_URL = process.env.STORAGE_URL || 'http://storage:8080';
const SERVICE2_URL = process.env.SERVICE2_URL || 'http://service2:8188/status';
const VSTORAGE_PATH = process.env.VSTORAGE_PATH || '/vstorage/status.log';

const app = express();
const PORT = 8199;

function uptimeHours() {
  try {
    const text = fs.readFileSync('/proc/uptime', 'utf8').split(' ')[0];
    return parseFloat(text) / 3600;
  } catch (error) {
    console.error(`Error reading /proc/uptime: ${error}. Returning os.uptime()`);
    return os.uptime() / 3600;
  }
}

function freeDiskSpaceMB() {
  try {
    return parseInt(execSync("df -m / tail -1 | awk '{print $4}'").toString().trim(), 10);
  } catch (error) {
    console.error(`Error getting free disk space: ${error}. Returning 0`);
    return 0;
  }
}

function buildStatus(prefix) {
  return `${prefix}: uptime ${uptimeHours().toFixed(2)} hours, free disk space in root ${freeDiskSpaceMB()} MBytes`;
}

function saveToVStorage(line) {
  fs.mkdirSync(path.dirname(VSTORAGE_PATH), { recursive: true });
  fs.appendFileSync(VSTORAGE_PATH, `${line}\n`);
}

async function postToStorage(line) {
  try {
    const response = await fetch(`${STORAGE_URL}/log`, {
      method: 'POST',
      headers: { 'Content-type': 'text/plain' },
      body: line,
    });
  } catch (error) {
    console.error(`Error posting to storage: ${error}`);
  }
}

app.get('/status', async (req, res) => {
  const status1 = buildStatus('Timestamp1');
  saveToVStorage(status1);
  await postToStorage(status1);

  let status2;
  try {
    const response = await fetch(SERVICE2_URL);
    status2 = await response.text();
  } catch (error) {
    status2 = `Error fetching status from service2: ${error}`;
  }

  res.type('text/plain').send(`${status1}\n${status2}\n`);
});

app.get('/log', async (req, res) => {
  try {
    const response = await fetch(`${STORAGE_URL}/log`);
    res.status(response.status).type('text/plain').send(await response.text());
  } catch (error) {
    res.status(502).send(`Error fetching log from storage: ${error}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`service1 listening on ${PORT}`);
});