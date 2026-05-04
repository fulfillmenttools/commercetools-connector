import { describe, expect, it } from '@jest/globals';
import type { FieldDefinition, Order, Type } from '@commercetools/platform-sdk';

import {
  addFieldDefinitionAction,
  changeShipmentStateAction,
  setCustomFieldAction,
  setCustomTypeAction,
  updateOrderAction,
  updateTypeAction,
} from '../src/commercetools/apiFunctions';

describe('apiFunctions', () => {
  describe('setCustomTypeAction', () => {
    it('builds the action with fields mapped from KeyValue array', () => {
      const action = setCustomTypeAction('my-type', [
        { name: 'field1', value: 'val1' },
        { name: 'field2', value: 42 },
      ]);
      expect(action.action).toBe('setCustomType');
      expect(action.type?.key).toBe('my-type');
      expect(action.type?.typeId).toBe('type');
      expect(action.fields).toEqual({ field1: 'val1', field2: 42 });
    });

    it('produces empty fields for an empty array', () => {
      const action = setCustomTypeAction('k', []);
      expect(action.fields).toEqual({});
    });
  });

  describe('setCustomFieldAction', () => {
    it('builds the action with a string value', () => {
      const action = setCustomFieldAction('myField', 'hello');
      expect(action.action).toBe('setCustomField');
      expect(action.name).toBe('myField');
      expect(action.value).toBe('hello');
    });

    it('builds the action with a numeric value', () => {
      const action = setCustomFieldAction('count', 7);
      expect(action.value).toBe(7);
    });
  });

  describe('changeShipmentStateAction', () => {
    it('builds the action', () => {
      const action = changeShipmentStateAction('Shipped');
      expect(action.action).toBe('changeShipmentState');
      expect(action.shipmentState).toBe('Shipped');
    });
  });

  describe('addFieldDefinitionAction', () => {
    it('builds the action', () => {
      const definition = {
        name: 'testField',
        label: { en: 'Test' },
        required: false,
        type: { name: 'String' as const },
        inputHint: 'SingleLine' as const,
      };
      const action = addFieldDefinitionAction(definition);
      expect(action.action).toBe('addFieldDefinition');
      expect(action.fieldDefinition).toBe(definition);
    });
  });

  describe('updateOrderAction', () => {
    it('uses the order version', () => {
      const order = { version: 3 } as unknown as Order;
      const actions = [{ action: 'setCustomField' as const, name: 'f', value: 'v' }];
      const update = updateOrderAction(order, actions);
      expect(update.version).toBe(3);
      expect(update.actions).toBe(actions);
    });
  });

  describe('updateTypeAction', () => {
    it('uses the custom type version', () => {
      const customType = { version: 5 } as unknown as Type;
      const actions = [{ action: 'addFieldDefinition' as const, fieldDefinition: {} as unknown as FieldDefinition }];
      const update = updateTypeAction(customType, actions);
      expect(update.version).toBe(5);
      expect(update.actions).toBe(actions);
    });
  });
});
