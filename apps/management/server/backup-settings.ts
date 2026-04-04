import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const backupSettingsFile = path.resolve(__dirname, './generated/backup-settings.json');

export type BackupSettings = {
  backupFolder: string;
};

export type GetBackupSettingsResult = {
  exists: boolean;
  backupSettings?: BackupSettings;
};

export const getBackupSettings = (): GetBackupSettingsResult => {
  let backupSettings: BackupSettings | undefined;
  let exists = false;

  try {
    const content = fs.readFileSync(backupSettingsFile, { encoding: 'utf8' });
    backupSettings = JSON.parse(content) as BackupSettings;
    exists = true;
  } catch (e) {
    console.log('error: ', backupSettingsFile, e);
  }

  return {
    exists,
    backupSettings,
  };
};

export const updateBackupSettings = (data: { backupFolder: string }): { success: boolean; error?: string } => {
  const { backupFolder } = data;

  // verify the folder exists
  if (!fs.existsSync(backupFolder)) {
    return { success: false, error: 'The backup folder does not exist. Please try again.' };
  }

  // if the folder exists, check it's a git repo
  if (!fs.existsSync(`${backupFolder}/.git`)) {
    return {
      success: false,
      error:
        'The backup folder exist but it is not a git repo. This script is designed to store data backups and commit the changes to the repo.',
    };
  }

  try {
    fs.writeFileSync(backupSettingsFile, JSON.stringify({ backupFolder }, null, '  '));
    return { success: true };
  } catch (e) {
    return { success: false };
  }
};
