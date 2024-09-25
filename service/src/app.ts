import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';

import { ServiceRouter } from './routes/serviceRouter';
import { readConfiguration, errorMiddleware, CustomError } from 'shared';
import { FftApiClient } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';

// Read env variables
const config = readConfiguration();

// setup FFT API client
const fftApiClient = new FftApiClient(
  config.fftProjectId || '',
  config.fftApiUser || '',
  config.fftApiPassword || '',
  config.fftApiKey || ''
);

const router = new ServiceRouter(fftApiClient);

// Create the express app
const app: Express = express();

// Define configurations
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.disable('x-powered-by');

// Define routes
app.use('/service', router.getRouter());
app.use('*', () => {
  throw new CustomError(404, 'Path not found.');
});

// Global error handler
app.use(errorMiddleware);

export default app;
