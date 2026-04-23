import { describe, expect, it } from '@jest/globals';
import {
  assertHandoverJobCreatedEvent,
  assertHandoverJobHandedOver,
  assertOrderCreatedEvent,
  assertPickJobCreatedEvent,
  assertPickJobFinishedEvent,
} from '../src/controllers/common';
import { CustomError } from 'shared';

describe('Event assertion helpers', () => {
  describe('assertOrderCreatedEvent', () => {
    it('throws CustomError for a null event', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => assertOrderCreatedEvent(null as any)).toThrow(CustomError);
    });

    it('throws CustomError when payload is absent', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => assertOrderCreatedEvent({ event: 'ORDER_CREATED', eventId: '1' } as any)).toThrow(CustomError);
    });

    it('throws CustomError when event type does not match', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertOrderCreatedEvent({ event: 'ORDER_CANCELLED', eventId: '1', payload: { id: 'x' } } as any)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid ORDER_CREATED event', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertOrderCreatedEvent({ event: 'ORDER_CREATED', eventId: '1', payload: { id: 'x' } } as any)
      ).not.toThrow();
    });
  });

  describe('assertPickJobCreatedEvent', () => {
    it('throws CustomError when payload is absent', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => assertPickJobCreatedEvent({ event: 'PICK_JOB_CREATED', eventId: '1' } as any)).toThrow(CustomError);
    });

    it('throws CustomError when event type does not match', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertPickJobCreatedEvent({ event: 'PICK_JOB_ABORTED', eventId: '1', payload: { id: 'x' } } as any)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid PICK_JOB_CREATED event', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertPickJobCreatedEvent({ event: 'PICK_JOB_CREATED', eventId: '1', payload: { id: 'x' } } as any)
      ).not.toThrow();
    });
  });

  describe('assertPickJobFinishedEvent', () => {
    it('throws CustomError when event type does not match', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertPickJobFinishedEvent({ event: 'PICK_JOB_CREATED', eventId: '1', payload: { id: 'x' } } as any)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid PICK_JOB_PICKING_FINISHED event', () => {
      expect(() =>
        assertPickJobFinishedEvent({
          event: 'PICK_JOB_PICKING_FINISHED',
          eventId: '1',
          payload: { id: 'x' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      ).not.toThrow();
    });
  });

  describe('assertHandoverJobCreatedEvent', () => {
    it('throws CustomError when payload is absent', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(() => assertHandoverJobCreatedEvent({ event: 'HANDOVERJOB_CREATED', eventId: '1' } as any)).toThrow(
        CustomError
      );
    });

    it('throws CustomError when event type does not match', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertHandoverJobCreatedEvent({ event: 'ORDER_CREATED', eventId: '1', payload: { id: 'x' } } as any)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid HANDOVERJOB_CREATED event', () => {
      expect(() =>
        assertHandoverJobCreatedEvent({
          event: 'HANDOVERJOB_CREATED',
          eventId: '1',
          payload: { id: 'x' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      ).not.toThrow();
    });
  });

  describe('assertHandoverJobHandedOver', () => {
    it('throws CustomError when event type does not match', () => {
      expect(() =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        assertHandoverJobHandedOver({ event: 'HANDOVERJOB_CREATED', eventId: '1', payload: { id: 'x' } } as any)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid HANDOVERJOB_HANDED_OVER event', () => {
      expect(() =>
        assertHandoverJobHandedOver({
          event: 'HANDOVERJOB_HANDED_OVER',
          eventId: '1',
          payload: { id: 'x' },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      ).not.toThrow();
    });
  });
});
