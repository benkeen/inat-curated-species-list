import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { getBackupSettings, updateBackupSettings } from './backup-settings.js';
import {
  getMainSettings,
  updateMainSettings,
  getNewAdditionsSettings,
  updateNewAdditionsSettings,
  getTaxonChangesSettings,
  updateTaxonChangesSettings,
} from './project-settings.js';
import {
  getBaselineSpecies,
  updateBaselineSpecies,
  patchCuratorReviewCounts,
  appendBaselineSpecies,
} from './baseline-species.js';
import { startInatDataDownload, getInatDataLog } from './observation-data.js';
import { log } from './inat-download-logger.js';
import { getDownloadState, setDownloadState, subscribeToDownload } from './inat-download-state.js';
import { generateCuratorSummary, getCuratorReviewCount } from './curator-summary.js';
import { generateChecklistFiles, getIsGenerating } from './generate-checklist.js';
import {
  startUnconfirmedSpeciesCheck,
  getUnconfirmedSpecies,
  removeUnconfirmedSpecies,
} from './unconfirmed-species.js';
import {
  getUnconfirmedCheckState,
  setUnconfirmedCheckState,
  subscribeToUnconfirmedCheck,
} from './unconfirmed-species-state.js';
import cors from 'cors';
import nocache from 'nocache';
import bodyParser from 'body-parser';

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(nocache());

app.get('/backup-settings', (_req: Request, res: Response) => {
  const { exists, backupSettings } = getBackupSettings();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ exists, backupSettings }));
});

app.post('/backup-settings', (req: Request, res: Response) => {
  const { success, error } = updateBackupSettings(req.body as { backupFolder: string });
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, error }));
});

app.get('/project-settings', (_req: Request, res: Response) => {
  const settings = getMainSettings();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ settings }));
});

app.post('/project-settings', (req: Request, res: Response) => {
  const { success } = updateMainSettings(req.body as Record<string, unknown>);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success }));
});

app.get('/baseline-species', (_req: Request, res: Response) => {
  const data = getBaselineSpecies();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
});

app.post('/baseline-species', (req: Request, res: Response) => {
  const { success, error } = updateBaselineSpecies(req.body);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, error }));
});

app.post('/baseline-species/append', (req: Request, res: Response) => {
  const { success, error } = appendBaselineSpecies(req.body);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ success, error }));
});

app.post('/species-counts', (_req: Request, _res: Response) => {});

app.get('/inat-data-log', (_req: Request, res: Response) => {
  const data = getInatDataLog();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
});

// POST /start-inat-download — fires the download in the background and returns immediately.
// Progress is tracked in inat-download-state.ts so any SSE subscriber can follow along.
app.post('/start-inat-download', (req: Request, res: Response) => {
  const current = getDownloadState();
  if (current.status === 'running') {
    return res.json({ success: false, error: 'A download is already in progress.' });
  }

  const maxPackets = req.query['maxPackets'] ? parseInt(req.query['maxPackets'] as string, 10) : null;

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
        let curatorPatch: { taxaCount: number; totalIdents: number } | { error: string };
        try {
          const summary = generateCuratorSummary();
          const taxaCount = Object.keys(summary.counts).length;
          const totalIdents = Object.values(summary.counts).reduce((a, b) => a + b, 0);
          log('info', `[curator-summary] Generated: ${taxaCount} taxa, ${totalIdents} total curator identifications.`);
          patchCuratorReviewCounts(summary.counts);
          log('info', '[curator-summary] baseline-species.json patched with curator review counts.');
          curatorPatch = { taxaCount, totalIdents };
        } catch (e) {
          log('error', `[curator-summary] Failed: ${(e as Error).message}`);
          curatorPatch = { error: (e as Error).message };
        }
        setDownloadState({ result: { ...result, curatorPatch } });
      }
    })
    .catch((e: Error) => setDownloadState({ status: 'error', error: e.message, progress: null }));

  res.json({ success: true });
});

// GET /inat-download-progress — SSE stream of the current download state.
// Sends the current state immediately on connect, then pushes updates as they happen.
// Clients can disconnect and reconnect freely without affecting the download.
app.get('/inat-download-progress', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendState = (state: ReturnType<typeof getDownloadState>): void => {
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  };

  // Immediately send the current state so reconnecting clients are up to date
  sendState(getDownloadState());

  const unsubscribe = subscribeToDownload(sendState);
  req.on('close', unsubscribe);
});

// POST /generate-checklist — runs checklist file generation using already-downloaded raw iNat data.
// Synchronous (awaited inline) since generation is local I/O and completes quickly.
app.post('/generate-checklist', async (_req: Request, res: Response) => {
  if (getIsGenerating()) {
    return res.json({ success: false, error: 'Checklist generation is already in progress.' });
  }
  try {
    const result = generateChecklistFiles();
    res.json({ success: true, ...result });
  } catch (e) {
    res.json({ success: false, error: (e as Error).message });
  }
});

// GET /curator-review-count/:taxonId — returns the number of current curator identifications for a taxon.
// Returns { count: null } if the summary file hasn't been generated yet.
app.get('/curator-review-count/:taxonId', (req: Request, res: Response) => {
  const count = getCuratorReviewCount(String(req.params['taxonId']));
  res.json({ count });
});

// POST /generate-curator-summary — builds the curator-review-summary.json from raw-inat-data/.
// This is called automatically after each full iNat download, and can also be triggered manually.
app.post('/generate-curator-summary', (_req: Request, res: Response) => {
  try {
    const summary = generateCuratorSummary();
    res.json({
      success: true,
      fileCount: summary.fileCount,
      speciesCount: Object.keys(summary.counts).length,
    });
  } catch (e) {
    res.json({ success: false, error: (e as Error).message });
  }
});

// GET /new-additions-settings — returns the newAdditions root config from project-settings.json.
app.get('/new-additions-settings', (_req: Request, res: Response) => {
  const settings = getNewAdditionsSettings();
  res.json({ settings });
});

// POST /new-additions-settings — updates the newAdditions root config in project-settings.json.
app.post('/new-additions-settings', (req: Request, res: Response) => {
  const { success } = updateNewAdditionsSettings(req.body as { enabled: boolean });
  res.json({ success });
});

// GET /new-additions-data — returns the contents of new-additions-data.json from the backup folder.
app.get('/new-additions-data', (_req: Request, res: Response) => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return res.status(404).json({ error: 'Backup settings not configured.' });
  }
  const filePath = path.join(backupSettings.backupFolder, 'new-additions-data.json');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'new-additions-data.json not found. Run checklist generation first.' });
  }
  try {
    const content = fs.readFileSync(filePath, { encoding: 'utf8' });
    res.setHeader('Content-Type', 'application/json');
    res.end(content);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read new-additions-data.json.' });
  }
});

// GET /species-data — returns the contents of species-data.json from the backup folder.
app.get('/species-data', (_req: Request, res: Response) => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return res.status(404).json({ error: 'Backup settings not configured.' });
  }
  const filePath = path.join(backupSettings.backupFolder, 'species-data.json');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'species-data.json not found. Run checklist generation first.' });
  }
  try {
    const content = fs.readFileSync(filePath, { encoding: 'utf8' });
    res.setHeader('Content-Type', 'application/json');
    res.end(content);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read species-data.json.' });
  }
});

// GET /taxon-changes-data — returns the contents of taxon-changes-data.json from the backup folder.
app.get('/taxon-changes-data', (_req: Request, res: Response) => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return res.status(404).json({ error: 'Backup settings not configured.' });
  }
  const filePath = path.join(backupSettings.backupFolder, 'taxon-changes-data.json');
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'taxon-changes-data.json not found. Run checklist generation first.' });
  }
  try {
    const content = fs.readFileSync(filePath, { encoding: 'utf8' });
    res.setHeader('Content-Type', 'application/json');
    res.end(content);
  } catch (e) {
    res.status(500).json({ error: 'Failed to read taxon-changes-data.json.' });
  }
});

// GET /taxon-changes-settings — returns the taxonChanges root config from project-settings.json.
app.get('/taxon-changes-settings', (_req: Request, res: Response) => {
  const settings = getTaxonChangesSettings();
  res.json({ settings });
});

// POST /taxon-changes-settings — updates the taxonChanges root config in project-settings.json.
app.post('/taxon-changes-settings', (req: Request, res: Response) => {
  const { success } = updateTaxonChangesSettings(req.body as { enabled: boolean });
  res.json({ success });
});

// GET /unconfirmed-species — returns the contents of unconfirmed-species.json, or { exists: false } if not yet generated.
app.get('/unconfirmed-species', (_req: Request, res: Response) => {
  const result = getUnconfirmedSpecies();
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
});

// DELETE /unconfirmed-species/:taxonId — removes a single entry from unconfirmed-species.json.
app.delete('/unconfirmed-species/:taxonId', (req: Request, res: Response) => {
  const { taxonId } = req.params;
  const result = removeUnconfirmedSpecies(taxonId);
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(result));
});

// POST /start-unconfirmed-species-check — fires the check in the background and returns immediately.
// Progress is tracked in unconfirmed-species-state.ts so any SSE subscriber can follow along.
app.post('/start-unconfirmed-species-check', (_req: Request, res: Response) => {
  const current = getUnconfirmedCheckState();
  if (current.status === 'running') {
    return res.json({ success: false, error: 'A check is already in progress.' });
  }

  setUnconfirmedCheckState({ status: 'running', progress: null, result: null, error: null });

  startUnconfirmedSpeciesCheck((progress) => setUnconfirmedCheckState({ status: 'running', progress }))
    .then((result) => setUnconfirmedCheckState({ status: 'done', result, progress: null }))
    .catch((e: Error) => setUnconfirmedCheckState({ status: 'error', error: e.message, progress: null }));

  res.json({ success: true });
});

// GET /unconfirmed-species-progress — SSE stream of the current unconfirmed species check state.
app.get('/unconfirmed-species-progress', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendState = (state: ReturnType<typeof getUnconfirmedCheckState>): void => {
    res.write(`data: ${JSON.stringify(state)}\n\n`);
  };

  sendState(getUnconfirmedCheckState());

  const unsubscribe = subscribeToUnconfirmedCheck(sendState);
  req.on('close', unsubscribe);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
