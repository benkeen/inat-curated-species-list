import fs from 'fs';
import { getBackupSettings } from './backup-settings.js';

const getLogFile = (): string => {
  const { backupSettings } = getBackupSettings();
  return `${backupSettings!.backupFolder}/logs/inat-curated-observations-download.log`;
};

export const clearLog = (): void => {
  fs.writeFileSync(getLogFile(), '', 'utf-8');
};

export const log = (level: string, message: string): void => {
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}\n`;
  fs.appendFileSync(getLogFile(), line, 'utf-8');
};
