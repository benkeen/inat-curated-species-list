import fs from 'fs';
import path from 'path';
import { createLogger, format, transports } from 'winston';
import { sync } from 'rimraf';

const { combine, timestamp, printf } = format;

export const initLogger = (temporaryFolder: string) => {
  const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} [${level}]: ${message}`;
  });

  return createLogger({
    format: combine(timestamp(), myFormat),
    transports: [new transports.File({ filename: 'generator.log', level: 'info', dirname: temporaryFolder })],
  });
};

export const logPacket = (packetNum: number, tempFolder: string, resp: any) => {
  fs.mkdirSync(tempFolder, { recursive: true });

  const packetDataFile = path.resolve(tempFolder, `packet-${packetNum}.json`);
  fs.writeFileSync(packetDataFile, JSON.stringify(resp), 'utf-8'); // JSON.stringify(resp, null, '\t')

  return packetDataFile;
};

export const clearTempFolder = (tempFolder: string) => {
  sync(tempFolder);
};
