import { createApplicationLogger } from '@commercetools-backend/loggers';
import { format } from 'logform';

export const logger = createApplicationLogger({ formatters: [format.uncolorize()] });
