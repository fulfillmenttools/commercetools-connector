import { CUSTOM_OBJECT_CONTAINER, CUSTOM_OBJECT_KEY, CUSTOM_TYPE_NAME } from '../common';
import errors from './fixtures/errors.json';
import { Channel } from '@commercetools/platform-sdk';

export function mockCtOrder(initialValue = {}) {
  return {
    type: 'Order',
    id: 'f2a5dc23-e032-4320-bc84-b3d5e1d38b7e',
    version: 1,
    ...initialValue,
  };
}

export function mockCustomObject(initialValue = {}) {
  return {
    id: '1ea87c3d-0e92-4bc8-aa65-1e6b1c075354',
    version: 1,
    container: CUSTOM_OBJECT_CONTAINER,
    key: CUSTOM_OBJECT_KEY,
    value: {},
    ...initialValue,
  };
}

export function mockCustomType(initialValue = {}) {
  return {
    id: '509e9063-75f5-49b4-886a-c1bc10ffc3fb',
    version: 1,
    key: CUSTOM_TYPE_NAME,
    name: {
      en: 'My Custom Type',
    },
    description: {
      en: 'A very nice custom type',
    },
    resourceTypeIds: ['order'],
    fieldDefinitions: [],
    ...initialValue,
  };
}

export function mockError(initialValue = {}) {
  return { ...errors, ...initialValue };
}

export function mockStore(initialValue = {}) {
  return {
    countries: [],
    createdAt: '2023-05-09T09:09:20.487Z',
    id: '1123456789',
    key: 'store_02',
    languages: [],
    lastModifiedAt: '',
    productSelections: [],
    distributionChannels: [],
    version: 1,
    ...initialValue,
  };
}

export const channelCologne: Channel = {
  createdAt: '2023-05-09T09:09:20.487Z',
  id: '12345',
  key: 'store_cologne',
  lastModifiedAt: '',
  roles: [],
  version: 1,
};
export const channelHamburg: Channel = {
  createdAt: '2023-05-09T09:09:20.487Z',
  id: '54321',
  key: 'store_hamburg',
  lastModifiedAt: '',
  roles: [],
  version: 1,
};
export const channelMunich: Channel = {
  createdAt: '2023-05-09T09:09:20.487Z',
  id: '55469',
  key: 'store_munich',
  lastModifiedAt: '',
  roles: [],
  version: 1,
};
