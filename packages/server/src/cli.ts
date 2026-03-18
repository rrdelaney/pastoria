#!/usr/bin/env node

import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import express from 'express';
import pc from 'picocolors';
import {createHandler} from './index.js';

async function createServer() {
  dotenv.config();

  const handler = await createHandler();

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
