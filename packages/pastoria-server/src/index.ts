#!/usr/bin/env node

import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import pc from 'picocolors';
import pino from 'pino';
import {pinoHttp} from 'pino-http';
import type {Manifest} from 'vite';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
});

const httpLogger = pinoHttp({logger});

interface PersistedQueries {
  [hash: string]: string;
}

interface ServerEntry {
  createHandler(
    persistedQueries: PersistedQueries,
    manifest?: Manifest,
  ): express.Router;
}

const MANIFEST_JSON = 'dist/client/.vite/manifest.json';
const SERVER_MANIFEST_JSON = 'dist/server/.vite/manifest.json';
const QUERIES_JSON = '__generated__/router/persisted_queries.json';

async function createServer() {
  dotenv.config();

  const [manifest, serverManifest, persistedQueries] = await Promise.all([
    JSON.parse(await readFile(MANIFEST_JSON, 'utf-8')) as Manifest,
    JSON.parse(await readFile(SERVER_MANIFEST_JSON, 'utf-8')) as Manifest,
    JSON.parse(await readFile(QUERIES_JSON, 'utf-8')),
  ]);

  const serverEntry = serverManifest['virtual:pastoria-entry-server.tsx']?.file;
  if (serverEntry == null) {
    throw new Error(
      'Could not load entry for virtual:pastoria-entry-server.tsx',
    );
  }

  const {createHandler} = (await import(
    path.join(process.cwd(), 'dist/server', serverEntry)
  )) as ServerEntry;

  const handler = createHandler(persistedQueries, manifest);

  const app = express();
  app.use(httpLogger);
  app.use(cookieParser());
  app.use(handler);
  app.use(express.static('dist/client'));

  // Debug: Log active handles every 30 seconds to detect accumulation
  setInterval(() => {
    const handles = (process as any)._getActiveHandles() as any[];
    const handleTypes: Record<string, number> = {};
    for (const h of handles) {
      const type = h.constructor?.name || 'unknown';
      handleTypes[type] = (handleTypes[type] || 0) + 1;
    }
    logger.info({handleCount: handles.length, handleTypes}, 'Active handles');
  }, 30000);

  app.listen(8000, (err) => {
    if (err) {
      logger.error(err, 'Failed to start server');
    } else {
      logger.info('Listening on port 8000');
      console.log(pc.cyan('Listening on port 8000!'));
    }
  });
}

createServer().catch(console.error);
