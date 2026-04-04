import express from 'express';
import { getBackupSettings, updateBackupSettings } from './backup-settings.js';
import { getMainSettings, updateMainSettings } from './project-settings.js';
import { getBaselineSpecies, updateBaselineSpecies } from './baseline-species.js';
import { startInatDataDownload, getInatDataLog } from './observation-data.js';
import { getDownloadState, setDownloadState, subscribeToDownload } from './inat-download-state.js';
import { generateCuratorSummary, getCuratorReviewCount } from './curator-summary.js';
import cors from 'cors';
import nocache from 'nocache';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(nocache());

app.get('/backup-settings', (req, res) => {
  const { exists, backupSettings } = getBackupSettings();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ exists, backupSettings }));
});

app.post('/backup-settings', (req, res) => {
  const { success, error } = updateBackupSettings(req.body);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, error }));
});

app.get('/project-settings', (req, res) => {
  const settings = getMainSettings();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ settings }));
});

app.post('/project-settings', (req, res) => {
  const { success } = updateMainSettings(req.body);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success }));
});

app.get('/baseline-species', (req, res) => {
  const data = getBaselineSpecies();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
});

app.post('/baseline-species', (req, res) => {
  const { success, error } = updateBaselineSpecies(req.body);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, error }));
});

app.post('/species-counts', (req, res) => {});

app.get('/inat-data-log', (req, res) => {
  const data = getInatDataLog();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
});

// POST /start-inat-download — fires the download in the background and returns immediately.
// Progress is tracked in inat-download-state.js so any SSE subscriber can follow along.
app.post('/start-inat-download', (req, res) => {
  const current = getDownloadState();
  if (current.status === 'running') {
    return res.json({ success: false, error: 'A download is already in progress.' });
  }

  const maxPackets = req.query.maxPackets ? parseInt(req.query.maxPackets, 10) : null;

  setDownloadState({
    status: 'running',
    startedAt: new Date().toISOString(),
    progress: null,
    result: null,
    error: null,
  });

  // Run without awaiting so the request returns immediately
  startInatDataDownload((progress) => setDownloadState({ status: 'running', progress }), { maxPackets })
    .then((result) => {
      setDownloadState({ status: 'done', result, progress: null });
      // Regenerate the curator review summary from the freshly-downloaded raw-inat-data
      if (!maxPackets) {
        try {
          generateCuratorSummary();
        } catch (e) {
          console.error('Failed to regenerate curator summary after download:', e.message);
        }
      }
    })
    .catch((e) => setDownloadState({ status: 'error', error: e.message, progress: null }));

  res.json({ success: true });
});

// GET /inat-download-progress — SSE stream of the current download state.
// Sends the current state immediately on connect, then pushes updates as they happen.
// Clients can disconnect and reconnect freely without affecting the download.
app.get('/inat-download-progress', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendState = (state) => {
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  };

  // Immediately send the current state so reconnecting clients are up to date
  sendState(getDownloadState());

  const unsubscribe = subscribeToDownload(sendState);
  req.on('close', unsubscribe);
});

// GET /curator-review-count/:taxonId — returns the number of current curator identifications for a taxon.
// Returns { count: null } if the summary file hasn't been generated yet.
app.get('/curator-review-count/:taxonId', (req, res) => {
  const count = getCuratorReviewCount(req.params.taxonId);
  res.json({ count });
});

// POST /generate-curator-summary — builds the curator-review-summary.json from raw-inat-data/.
// This is called automatically after each full iNat download, and can also be triggered manually.
app.post('/generate-curator-summary', (req, res) => {
  try {
    const summary = generateCuratorSummary();
    res.json({
      success: true,
      fileCount: summary.fileCount,
      speciesCount: Object.keys(summary.counts).length,
    });
  } catch (e) {
    res.json({ success: false, error: e.message });
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
