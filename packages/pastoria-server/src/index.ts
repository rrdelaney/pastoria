#!/usr/bin/env node

import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import {loadConfig, PastoriaConfig} from 'pastoria-config';
import pc from 'picocolors';
import type {Manifest} from 'vite';

interface PersistedQueries {
  [hash: string]: string;
}

interface ServerEntry {
  createHandler(
    persistedQueries: PersistedQueries,
    config: Required<PastoriaConfig>,
    manifest?: Manifest,
  ): express.Router;
}

const MANIFEST_JSON = 'dist/client/.vite/manifest.json';
const SERVER_MANIFEST_JSON = 'dist/server/.vite/manifest.json';
const QUERIES_JSON = '__generated__/router/persisted_queries.json';

async function createServer() {
  dotenv.config();

  const [manifest, serverManifest, persistedQueries, config] =
    await Promise.all([
      JSON.parse(await readFile(MANIFEST_JSON, 'utf-8')) as Manifest,
      JSON.parse(await readFile(SERVER_MANIFEST_JSON, 'utf-8')) as Manifest,
      JSON.parse(await readFile(QUERIES_JSON, 'utf-8')),
      loadConfig(),
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

  const handler = createHandler(persistedQueries, config, manifest);

  const app = express();
  app.use(cookieParser());
  app.use(handler);
  app.use(express.static('dist/client'));

  app.listen(8000, (err) => {
    if (err) {
      console.error(err);
    } else {
      console.log(pc.cyan('Listening on port 8000!'));
    }
  });
}

createServer().catch(console.error);
