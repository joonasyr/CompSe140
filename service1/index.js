import express from 'express';
import checkDiskSpace from 'check-disk-space';
import fs from 'fs';

const STORAGE_URL = process.env.STORAGE_URL
const SERVICE2_URL = process.env.SERVICE2_URL
const VSTORAGE_PATH = process.env.VSTORAGE_PATH

const app = express();
const PORT = 8199;

// ISO8601 UTC wihtout milliseconds
function getTimestamp() {
  return new Date().toISOString().replace(/\.\d+Z$/, 'Z');
}

function getUptimeHours() {
  return (process.uptime() / 3600).toFixed(2);
}

async function getFreeDiskSpaceMB() {
  try {
    const diskSpace = await checkDiskSpace('/');
    return (diskSpace.free / (1024 * 1024)).toFixed(1);
  } catch (error) {
    console.error(`Free disk space error: ${error}`);
    return 0;
  }
}

async function buildLogMessage(prefix) {
  const freeDiskSpace = await getFreeDiskSpaceMB();
  const date = getTimestamp();
  const uptime = getUptimeHours();
  return `${prefix}: ${date} uptime ${uptime} hours, free disk in root: ${freeDiskSpace} MBytes`;
}

function saveToVStorage(line) {
  try {
    fs.appendFileSync(VSTORAGE_PATH, line + '\n');
  } catch (e) {
    console.error('Save to vstorage error:', e);
  }
}


app.get('/status', async (req, res) => {
  const status1 = await buildLogMessage('Timestamp1');
  saveToVStorage(status1);
  await fetch(`${STORAGE_URL}/log`, {
    method: 'POST',
    headers: { 'Content-type': 'text/plain' },
    body: status1,
  });

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

app.get('/clear', async (req, res) => {
  try {
    fs.writeFileSync(VSTORAGE_PATH, '');

    await fetch(`${STORAGE_URL}/clear`).catch(() => null);

    res.type('text/plain').send('CLEARED\n');
  } catch (error) {
    res.status(500).send(`Error clearing logs: ${error}`);
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`service1 listening on ${PORT}`);
});