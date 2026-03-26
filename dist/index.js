#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { DynoMapperServer } from './server.js';
const server = new DynoMapperServer();
server.run().catch(console.error);
