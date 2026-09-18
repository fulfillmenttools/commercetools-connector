import * as dotenv from 'dotenv';
dotenv.config();

import express, { Express } from 'express';
import bodyParser from 'body-parser';

import { EventRouter } from './routes/eventRouter';
import { readConfiguration, errorMiddleware, CustomError, createFftApiClient } from 'shared';

// Read env variables
readConfiguration();

// setup FFT API client (logging is wired up inside the factory)
const fftApiClient = createFftApiClient();

const router = new EventRouter(fftApiClient);

// Create the express app
const app: Express = express();

// Define configurations
app.use(bodyParser.json({ limit: '1mb' }));
app.use(bodyParser.urlencoded({ limit: '1mb', extended: true }));
app.disable('x-powered-by');

// Define routes
app.use('/event', router.getRouter());
app.use('*', () => {
  throw new CustomError(404, 'Path not found.');
});

// Global error handler
app.use(errorMiddleware);

export default app;
