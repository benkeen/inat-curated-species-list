import fs from 'fs';
import { getBackupSettings } from './backup-settings.js';

export const getMainSettings = (): Record<string, unknown> => {
  const { exists, backupSettings } = getBackupSettings();

  if (!exists) {
    return {};
  }

  const settingsFile = `${backupSettings!.backupFolder}/project-settings.json`;
  let settings: { main?: Record<string, unknown> } = {};
  if (fs.existsSync(settingsFile)) {
    const content = fs.readFileSync(settingsFile, { encoding: 'utf8' });
    settings = JSON.parse(content) as { main?: Record<string, unknown> };
  }

  return settings.main ?? {};
};

export const updateMainSettings = (data: Record<string, unknown>): { success: boolean } => {
  const { backupSettings } = getBackupSettings();

  const settingsFile = `${backupSettings!.backupFolder}/project-settings.json`;
  let existing: Record<string, unknown> = {};
  if (fs.existsSync(settingsFile)) {
    const content = fs.readFileSync(settingsFile, { encoding: 'utf8' });
    existing = JSON.parse(content) as Record<string, unknown>;
  }
  fs.writeFileSync(settingsFile, JSON.stringify({ ...existing, main: data }, null, '  '));

  return {
    success: true,
  };
};

export type NewAdditionsSettings = {
  enabled: boolean;
};

const readSettingsFile = (backupFolder: string): Record<string, unknown> => {
  const settingsFile = `${backupFolder}/project-settings.json`;
  if (!fs.existsSync(settingsFile)) {
    return {};
  }
  const content = fs.readFileSync(settingsFile, { encoding: 'utf8' });
  return JSON.parse(content) as Record<string, unknown>;
};

export const getNewAdditionsSettings = (): NewAdditionsSettings | null => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return null;
  }
  const settings = readSettingsFile(backupSettings.backupFolder);
  return (settings.newAdditions as NewAdditionsSettings) ?? null;
};

export const updateNewAdditionsSettings = (data: NewAdditionsSettings): { success: boolean } => {
  const { backupSettings } = getBackupSettings();
  const settingsFile = `${backupSettings!.backupFolder}/project-settings.json`;
  const existing = readSettingsFile(backupSettings!.backupFolder);
  fs.writeFileSync(settingsFile, JSON.stringify({ ...existing, newAdditions: data }, null, '  '));
  return { success: true };
};

export type TaxonChangesSettings = {
  enabled: boolean;
};

export const getTaxonChangesSettings = (): TaxonChangesSettings | null => {
  const { exists, backupSettings } = getBackupSettings();
  if (!exists || !backupSettings) {
    return null;
  }
  const settings = readSettingsFile(backupSettings.backupFolder);
  return (settings.taxonChanges as TaxonChangesSettings) ?? null;
};

export const updateTaxonChangesSettings = (data: TaxonChangesSettings): { success: boolean } => {
  const { backupSettings } = getBackupSettings();
  const settingsFile = `${backupSettings!.backupFolder}/project-settings.json`;
  const existing = readSettingsFile(backupSettings!.backupFolder);
  fs.writeFileSync(settingsFile, JSON.stringify({ ...existing, taxonChanges: data }, null, '  '));
  return { success: true };
};
