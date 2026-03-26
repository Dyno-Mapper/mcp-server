#!/usr/bin/env node
import * as dotenv from 'dotenv';
dotenv.config({ quiet: true });
import { DynoMapperServer } from './server.js';
const server = new DynoMapperServer();
if (process.argv.includes('--sse') || process.env.MCP_TRANSPORT === 'sse') {
    const port = parseInt(process.env.PORT || '3000', 10);
    server.runSSE(port).catch(console.error);
}
else {
    server.run().catch(console.error);
}
