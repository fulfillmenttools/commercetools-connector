import {
  FieldContainer,
  FieldDefinition,
  Order,
  OrderChangeShipmentStateAction,
  OrderSetCustomFieldAction,
  OrderSetCustomTypeAction,
  OrderUpdate,
  OrderUpdateAction,
  ShipmentState,
  Type,
  TypeAddFieldDefinitionAction,
  TypeUpdate,
} from '@commercetools/platform-sdk';
import { KeyValue } from '../types/common';

export function setCustomTypeAction(typeKey: string, fieldsToSet: KeyValue[]): OrderSetCustomTypeAction {
  const fields: FieldContainer = {};
  for (const field of fieldsToSet) {
    fields[field.name] = field.value;
  }
  return {
    action: 'setCustomType',
    type: {
      key: typeKey,
      typeId: 'type',
    },
    fields: fields,
  };
}

export function setCustomFieldAction(name: string, value: string | number): OrderSetCustomFieldAction {
  return {
    action: 'setCustomField',
    name: name,
    value: value,
  };
}

export function changeShipmentStateAction(shipmentState: ShipmentState): OrderChangeShipmentStateAction {
  return {
    action: 'changeShipmentState',
    shipmentState,
  };
}

export function addFieldDefinitionAction(definition: FieldDefinition): TypeAddFieldDefinitionAction {
  return {
    action: 'addFieldDefinition',
    fieldDefinition: definition,
  };
}

export function updateOrderAction(order: Order, updateActions: OrderUpdateAction[]): OrderUpdate {
  return {
    version: order.version,
    actions: updateActions,
  };
}

export function updateTypeAction(customType: Type, updateActions: TypeAddFieldDefinitionAction[]): TypeUpdate {
  return {
    version: customType.version,
    actions: updateActions,
  };
}
