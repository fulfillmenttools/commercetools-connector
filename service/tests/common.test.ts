import { describe, expect, it } from '@jest/globals';
import type {
  HandoverJobCreatedWebHookEvent,
  HandoverJobHandedOverWebHookEvent,
  OrderCreatedWebHookEvent,
  PickjobCreatedWebHookEvent,
  PickjobPickingFinishedWebHookEvent,
} from '@fulfillmenttools/fulfillmenttools-sdk-typescript';
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
      expect(() => assertOrderCreatedEvent(null as unknown as OrderCreatedWebHookEvent)).toThrow(CustomError);
    });

    it('throws CustomError when payload is absent', () => {
      expect(() => assertOrderCreatedEvent({ event: 'ORDER_CREATED', eventId: '1' } as unknown as OrderCreatedWebHookEvent)).toThrow(CustomError);
    });

    it('throws CustomError when event type does not match', () => {
      expect(() =>
        assertOrderCreatedEvent({ event: 'ORDER_CANCELLED', eventId: '1', payload: { id: 'x' } } as unknown as OrderCreatedWebHookEvent)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid ORDER_CREATED event', () => {
      expect(() =>
        assertOrderCreatedEvent({ event: 'ORDER_CREATED', eventId: '1', payload: { id: 'x' } } as unknown as OrderCreatedWebHookEvent)
      ).not.toThrow();
    });
  });

  describe('assertPickJobCreatedEvent', () => {
    it('throws CustomError when payload is absent', () => {
      expect(() => assertPickJobCreatedEvent({ event: 'PICK_JOB_CREATED', eventId: '1' } as unknown as PickjobCreatedWebHookEvent)).toThrow(CustomError);
    });

    it('throws CustomError when event type does not match', () => {
      expect(() =>
        assertPickJobCreatedEvent({ event: 'PICK_JOB_ABORTED', eventId: '1', payload: { id: 'x' } } as unknown as PickjobCreatedWebHookEvent)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid PICK_JOB_CREATED event', () => {
      expect(() =>
        assertPickJobCreatedEvent({ event: 'PICK_JOB_CREATED', eventId: '1', payload: { id: 'x' } } as unknown as PickjobCreatedWebHookEvent)
      ).not.toThrow();
    });
  });

  describe('assertPickJobFinishedEvent', () => {
    it('throws CustomError when event type does not match', () => {
      expect(() =>
        assertPickJobFinishedEvent({ event: 'PICK_JOB_CREATED', eventId: '1', payload: { id: 'x' } } as unknown as PickjobPickingFinishedWebHookEvent)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid PICK_JOB_PICKING_FINISHED event', () => {
      expect(() =>
        assertPickJobFinishedEvent({
          event: 'PICK_JOB_PICKING_FINISHED',
          eventId: '1',
          payload: { id: 'x' },
        } as unknown as PickjobPickingFinishedWebHookEvent)
      ).not.toThrow();
    });
  });

  describe('assertHandoverJobCreatedEvent', () => {
    it('throws CustomError when payload is absent', () => {
      expect(() => assertHandoverJobCreatedEvent({ event: 'HANDOVERJOB_CREATED', eventId: '1' } as unknown as HandoverJobCreatedWebHookEvent)).toThrow(
        CustomError
      );
    });

    it('throws CustomError when event type does not match', () => {
      expect(() =>
        assertHandoverJobCreatedEvent({ event: 'ORDER_CREATED', eventId: '1', payload: { id: 'x' } } as unknown as HandoverJobCreatedWebHookEvent)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid HANDOVERJOB_CREATED event', () => {
      expect(() =>
        assertHandoverJobCreatedEvent({
          event: 'HANDOVERJOB_CREATED',
          eventId: '1',
          payload: { id: 'x' },
        } as unknown as HandoverJobCreatedWebHookEvent)
      ).not.toThrow();
    });
  });

  describe('assertHandoverJobHandedOver', () => {
    it('throws CustomError when event type does not match', () => {
      expect(() =>
        assertHandoverJobHandedOver({ event: 'HANDOVERJOB_CREATED', eventId: '1', payload: { id: 'x' } } as unknown as HandoverJobHandedOverWebHookEvent)
      ).toThrow(CustomError);
    });

    it('does not throw for a valid HANDOVERJOB_HANDED_OVER event', () => {
      expect(() =>
        assertHandoverJobHandedOver({
          event: 'HANDOVERJOB_HANDED_OVER',
          eventId: '1',
          payload: { id: 'x' },
        } as unknown as HandoverJobHandedOverWebHookEvent)
      ).not.toThrow();
    });
  });
});
