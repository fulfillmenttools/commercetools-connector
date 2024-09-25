import * as dotenv from 'dotenv';
dotenv.config();

import app from './app';

import { logger } from 'shared';

const PORT = process.env.PORT || 8080;

// Listen the application
const server = app.listen(PORT, () => {
  logger.info(`⚡️ fulfillmenttools service application listening on port ${PORT}`);
});

export default server;
