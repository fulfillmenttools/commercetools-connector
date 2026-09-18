import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';

import { ServiceRouter } from './routes/serviceRouter';
import { readConfiguration, errorMiddleware, CustomError, createFftApiClient } from 'shared';

// Read env variables
const config = readConfiguration();

// setup FFT API client (logging is wired up inside the factory)
const fftApiClient = createFftApiClient();

const router = new ServiceRouter(fftApiClient);

// Create the express app
const app: Express = express();

// Define configurations
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.disable('x-powered-by');

// Define routes
if (config.featStatusupdatesActive.toLowerCase() === 'false') {
  // FeatureFlag: Disables the Status Updates from fft to ct
  app.use('*', () => {
    throw new CustomError(200, 'Service updates deactivated.');
  });
} else {
  app.use('/service', router.getRouter());
  app.use('*', () => {
    throw new CustomError(404, 'Path not found.');
  });
}

// Global error handler
app.use(errorMiddleware);

export default app;
