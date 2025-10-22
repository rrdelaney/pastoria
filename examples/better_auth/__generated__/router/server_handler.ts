import express from 'express';
import { handleHello as e0 } from "../../src/schema/hello";

export const router = express.Router();
router.use('/hello', e0)
