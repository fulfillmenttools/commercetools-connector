import { handlers as authHandlers } from './domains/auth';
import { handlers as customObjectsHandlers } from './domains/customObjects';
import { handlers as customTypesHandlers } from './domains/customTypes';
import { handlers as ctOrdersHandlers } from './domains/ctOrders';
import { handlers as facilityHandlers } from './domains/facilities';
import { handlers as fftOrdersHandlers } from './domains/fftOrders';
import { handlers as storeHandlers } from './domains/stores';
import { handlers as channelHandlers } from './domains/channels';
import { handlers as projectHandlers } from './domains/projects';

export const handlers = [
  ...authHandlers,
  ...customObjectsHandlers,
  ...customTypesHandlers,
  ...ctOrdersHandlers,
  ...fftOrdersHandlers,
  ...facilityHandlers,
  ...storeHandlers,
  ...channelHandlers,
  ...projectHandlers,
];
