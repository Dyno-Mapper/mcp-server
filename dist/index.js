#!/usr/bin/env node
import * as dotenv from 'dotenv';
import { DynoMapperServer } from './server.js';
dotenv.config();
const server = new DynoMapperServer();
server.run().catch(console.error);
