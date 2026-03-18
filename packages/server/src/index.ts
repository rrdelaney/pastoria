import express from 'express';
import {readFile} from 'node:fs/promises';
import * as path from 'node:path';
import type {Manifest} from 'vite';

interface PersistedQueries {
  [hash: string]: string;
}

interface ServerEntry {
  createHandler(
    this: void,
    persistedQueries: PersistedQueries,
    manifest?: Manifest,
  ): express.Router;
}

const MANIFEST_JSON = 'dist/client/.vite/manifest.json';
const SERVER_MANIFEST_JSON = 'dist/server/.vite/manifest.json';
const QUERIES_JSON = '__generated__/router/persisted_queries.json';

export async function createHandler() {
  const [manifest, serverManifest, persistedQueries] = await Promise.all([
    readFile(MANIFEST_JSON, 'utf-8').then((f) => JSON.parse(f) as Manifest),
    readFile(SERVER_MANIFEST_JSON, 'utf-8').then(
      (f) => JSON.parse(f) as Manifest,
    ),
    readFile(QUERIES_JSON, 'utf-8').then((f) => JSON.parse(f)),
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

  return createHandler(persistedQueries, manifest);
}
