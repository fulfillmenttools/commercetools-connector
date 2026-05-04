import { afterAll, afterEach, beforeAll, describe, expect, it, jest } from '@jest/globals';
import { FftOrderService, OrderStatus } from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
import { ResourceLockedError, FftOrderServiceMock, fftApi, ctApi, http, HttpResponse, server, getTestClient } from 'shared';
import { OrderMapper } from '../src/order/orderMapper';
import { OrderProcessor } from '../src/order/orderProcessor';

beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});
afterAll(() => server.close());

const orderMapperMock = {
  mapOrder: jest.fn(),
} as unknown as OrderMapper;

describe('OrderProcessor', () => {
  describe('processOrder', () => {
    it('throws ResourceLockedError when the same order is already being processed', async () => {
      const orderService = new FftOrderServiceMock();
      const orderProcessor = new OrderProcessor(orderService, orderMapperMock);
      orderService.freeze();
      const firstPromise = orderProcessor.processOrder('order-lock-1');
      const secondPromise = orderProcessor.processOrder('order-lock-1');
      await expect(secondPromise).rejects.toThrow(ResourceLockedError);
      orderService.continue();
      await expect(firstPromise).resolves.not.toThrow();
    });

    it('skips mapping when the FFT order already exists', async () => {
      // FftOrderServiceMock hardcodes findByTenantOrderId to return undefined, so we use
      // the real FftOrderService here and let MSW return an existing order.
      server.use(
        http.get(fftApi('/orders'), () =>
          HttpResponse.json({ total: 1, orders: [{ id: 'fft-existing', tenantOrderId: 'order-exists', version: 1 }] })
        )
      );
      const mapperSpy = { mapOrder: jest.fn() } as unknown as OrderMapper;
      const orderService = new FftOrderService(getTestClient());
      const orderProcessor = new OrderProcessor(orderService, mapperSpy);

      await orderProcessor.processOrder('order-exists');
      expect(mapperSpy.mapOrder).not.toHaveBeenCalled();
    });

    it('logs an error and continues when findByTenantOrderId throws', async () => {
      server.use(
        http.get(ctApi('/orders/:id'), () =>
          HttpResponse.json({ id: 'ct-any', version: 1, orderState: 'Cancelled' })
        )
      );
      const findMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.reject(new Error('FFT down')));
      const mockService = { findByTenantOrderId: findMock, create: jest.fn() } as unknown as FftOrderService;
      const processor = new OrderProcessor(mockService, orderMapperMock);

      await expect(processor.processOrder('ct-any')).resolves.not.toThrow();
    });

    it('logs an error and continues when fftOrderService.create throws', async () => {
      server.use(
        http.get(ctApi('/orders/:id'), () =>
          HttpResponse.json({ id: 'ct-open', version: 1, orderState: 'Open' })
        )
      );
      const findMock = jest.fn();
      const createMock = jest.fn();
      const mapperMock2 = { mapOrder: jest.fn() } as unknown as OrderMapper;
      findMock.mockImplementationOnce(() => Promise.resolve(undefined));
      createMock.mockImplementationOnce(() => Promise.reject(new Error('FFT create failed')));
      (mapperMock2.mapOrder as jest.Mock).mockImplementationOnce(() => Promise.resolve({}));
      const mockService = { findByTenantOrderId: findMock, create: createMock } as unknown as FftOrderService;
      const processor = new OrderProcessor(mockService, mapperMock2);

      await expect(processor.processOrder('ct-open')).resolves.not.toThrow();
    });

    it('skips creating an FFT order when the CT order is already Cancelled', async () => {
      server.use(
        http.get(fftApi('/orders'), () => HttpResponse.json({ total: 0, orders: [] })),
        http.get(ctApi('/orders/:id'), () =>
          HttpResponse.json({ id: 'ct-cancelled', version: 1, orderState: 'Cancelled' })
        )
      );
      const mapperSpy = { mapOrder: jest.fn() } as unknown as OrderMapper;
      const orderService = new FftOrderServiceMock();
      const orderProcessor = new OrderProcessor(orderService, mapperSpy);

      await orderProcessor.processOrder('ct-cancelled');
      expect(mapperSpy.mapOrder).not.toHaveBeenCalled();
    });
  });

  describe('cancelOrder', () => {
    it('throws ResourceLockedError when the same order is already being cancelled', async () => {
      const orderService = new FftOrderServiceMock();
      const orderProcessor = new OrderProcessor(orderService, orderMapperMock);
      orderService.freeze();
      const firstPromise = orderProcessor.cancelOrder('order-cancel-lock');
      const secondPromise = orderProcessor.cancelOrder('order-cancel-lock');
      await expect(secondPromise).rejects.toThrow(ResourceLockedError);
      orderService.continue();
      await expect(firstPromise).resolves.not.toThrow();
    });

    it('skips cancellation when no matching FFT order exists', async () => {
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(undefined));
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const orderProcessor = new OrderProcessor(mockService, orderMapperMock);

      await orderProcessor.cancelOrder('order-no-fft');
      expect(cancelMock).not.toHaveBeenCalled();
    });

    it('skips cancellation when the FFT order is already CANCELLED', async () => {
      const cancelledOrder = { id: 'fft-1', tenantOrderId: 'order-done', status: OrderStatus.CANCELLED, version: 1 };
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(cancelledOrder));
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const orderProcessor = new OrderProcessor(mockService, orderMapperMock);

      await orderProcessor.cancelOrder('order-done');
      expect(cancelMock).not.toHaveBeenCalled();
    });

    it('calls cancel on the FFT order when it exists and is not yet cancelled', async () => {
      const openOrder = { id: 'fft-open', tenantOrderId: 'order-open', status: OrderStatus.OPEN, version: 2 };
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(openOrder));
      cancelMock.mockImplementationOnce(() => Promise.resolve(undefined));
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const orderProcessor = new OrderProcessor(mockService, orderMapperMock);

      await orderProcessor.cancelOrder('order-open');
      expect(cancelMock).toHaveBeenCalledWith('fft-open', 2);
    });

    it('does not rethrow when the FFT cancel endpoint responds with HTTP 400', async () => {
      const openOrder = { id: 'fft-2', tenantOrderId: 'order-400', status: OrderStatus.OPEN, version: 1 };
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(openOrder));
      cancelMock.mockImplementationOnce(() =>
        Promise.reject({ status: 400, message: 'Cannot cancel', name: 'HttpError' })
      );
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const orderProcessor = new OrderProcessor(mockService, orderMapperMock);

      await expect(orderProcessor.cancelOrder('order-400')).resolves.not.toThrow();
    });

    it('does not rethrow when the FFT cancel endpoint responds with HTTP 404', async () => {
      const openOrder = { id: 'fft-3', tenantOrderId: 'order-404', status: OrderStatus.OPEN, version: 1 };
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(openOrder));
      cancelMock.mockImplementationOnce(() =>
        Promise.reject({ status: 404, message: 'Not found', name: 'HttpError' })
      );
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const orderProcessor = new OrderProcessor(mockService, orderMapperMock);

      await expect(orderProcessor.cancelOrder('order-404')).resolves.not.toThrow();
    });

    it('rethrows and logs error when cancel throws a non-HttpError', async () => {
      const openOrder = { id: 'fft-5', tenantOrderId: 'order-non-http', status: OrderStatus.OPEN, version: 1 };
      const nonHttpError = new Error('unexpected failure');
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(openOrder));
      cancelMock.mockImplementationOnce(() => Promise.reject(nonHttpError));
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const processor = new OrderProcessor(mockService, orderMapperMock);

      await expect(processor.cancelOrder('order-non-http')).rejects.toEqual(nonHttpError);
    });

    it('rethrows when the FFT cancel endpoint responds with an unexpected HTTP 500 error', async () => {
      const openOrder = { id: 'fft-4', tenantOrderId: 'order-500', status: OrderStatus.OPEN, version: 1 };
      const serverError = { status: 500, message: 'Internal error', name: 'HttpError' };
      const findMock = jest.fn();
      const cancelMock = jest.fn();
      findMock.mockImplementationOnce(() => Promise.resolve(openOrder));
      cancelMock.mockImplementationOnce(() => Promise.reject(serverError));
      const mockService = {
        findByTenantOrderId: findMock,
        cancel: cancelMock,
        create: jest.fn(),
      } as unknown as FftOrderService;
      const orderProcessor = new OrderProcessor(mockService, orderMapperMock);

      await expect(orderProcessor.cancelOrder('order-500')).rejects.toEqual(serverError);
    });
  });
});
