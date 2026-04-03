import fs from 'fs';
import { getBackupSettings } from './backup-settings.js';

const getLogFile = () => {
  const { backupSettings } = getBackupSettings();
  return `${backupSettings.backupFolder}/inat-download.log`;
};

export const clearLog = () => {
  fs.writeFileSync(getLogFile(), '', 'utf-8');
};

export const log = (level, message) => {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(getLogFile(), line, 'utf-8');
};
