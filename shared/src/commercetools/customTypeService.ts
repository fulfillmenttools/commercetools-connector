import { FieldDefinition, Type, TypeDraft } from '@commercetools/platform-sdk';

import { createApiRoot } from '../client';
import { CUSTOM_TYPE_NAME } from '../common';
import { CustomError } from '../errors';
import { logger } from '../utils';
import { statusCode } from './statusCode';
import { getConfiguration } from './customObjectService';
import customTypeDefinition from './customTypeDefinition.json';
import { addFieldDefinitionAction, updateTypeAction } from './apiFunctions';

export async function getCustomOrderType(): Promise<string | undefined> {
  try {
    const typeKey = await orderCustomTypeKey();
    if (typeKey) {
      const result = await createApiRoot().types().withKey({ key: typeKey }).get().execute();

      if (result.statusCode === 200) {
        logger.info(`Found custom order type '${typeKey}' = '${result.body.id}'`);
        return result.body.id;
      } else if (result.statusCode === 404) {
        logger.info(`CT custom order type '${typeKey}' not found`);
        return undefined;
      } else {
        const errorMessage = `Cannot read CT custom type '${typeKey}': ${JSON.stringify(result)}`;
        logger.error(errorMessage);
        throw new CustomError(result.statusCode || 500, errorMessage);
      }
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.info(`CT custom order type not found`);
      return undefined;
    }
    const errorMessage = `Cannot read CT custom type: ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(status, errorMessage);
  }
  return undefined;
}

async function getCustomTypeById(id: string): Promise<Type | undefined> {
  try {
    const result = await createApiRoot().types().withId({ ID: id }).get().execute();

    if (result.statusCode === 200) {
      return result.body;
    } else if (result.statusCode === 404) {
      logger.info(`CT custom type '${id}' not found`);
      return undefined;
    } else {
      const errorMessage = `Cannot read CT custom type '${id}': ${JSON.stringify(result)}`;
      logger.error(errorMessage);
      throw new CustomError(result.statusCode || 500, errorMessage);
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.info(`CT custom type '${id}' not found`);
      return undefined;
    }
    const errorMessage = `Cannot read CT custom type '${id}': ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(status, errorMessage);
  }
}

export async function createCustomOrderType(): Promise<string | undefined> {
  try {
    const typeKey = await orderCustomTypeKey();
    if (typeKey) {
      const fieldDefinitions = await requiredFieldDefinitions();
      const customType: TypeDraft = {
        key: typeKey,
        name: {
          en: CUSTOM_TYPE_NAME,
        },
        resourceTypeIds: ['order'],
        fieldDefinitions,
      };
      const result = await createApiRoot().types().post({ body: customType }).execute();

      if (result.statusCode === 201) {
        logger.info(`Created CT custom type '${typeKey}': '${result.body.id}'`);
        return result.body.id;
      } else {
        const errorMessage = `Cannot create CT custom type '${typeKey}': ${JSON.stringify(result)}`;
        logger.error(errorMessage);
        throw new CustomError(result.statusCode || 500, errorMessage);
      }
    }
  } catch (error) {
    const errorMessage = `Cannot create CT custom type: ${JSON.stringify(error)}`;
    logger.error(errorMessage);
    throw new CustomError(statusCode(error), errorMessage);
  }
  return undefined;
}

export async function updateCustomOrderType(id: string): Promise<string | undefined> {
  try {
    const typeKey = await orderCustomTypeKey();
    if (typeKey) {
      const customType = await getCustomTypeById(id);
      if (customType) {
        const missingFields = await listOfMissingFields(customType.fieldDefinitions);
        if (missingFields.length > 0) {
          const updateActions = missingFields.map((f) => addFieldDefinitionAction(f));
          const typeUpdate = updateTypeAction(customType, updateActions);

          const result = await createApiRoot().types().withId({ ID: id }).post({ body: typeUpdate }).execute();

          if (result.statusCode === 200) {
            logger.info(`Updated CT custom type '${typeKey}': '${result.body.id}'`);
            return result.body.id;
          } else {
            const errorMessage = `Cannot update CT custom type '${typeKey}': ${JSON.stringify(result)}`;
            logger.error(errorMessage);
            throw new CustomError(result.statusCode || 500, errorMessage);
          }
        }
      }
    }
  } catch (error) {
    const errorMessage = `Cannot update CT custom type: ${JSON.stringify(error)}`;  
    logger.error(errorMessage);
    throw new CustomError(statusCode(error), errorMessage);
  }
  return undefined;
}

export async function orderCustomTypeKey(): Promise<string | undefined> {
  let key: string | undefined;
  const configuration = await getConfiguration();
  if (configuration) {
    key = configuration.orderCustomTypeKey;
  }
  return key;
}

async function collectChannelReferenceFieldName(): Promise<string | undefined> {
  let name: string | undefined;
  const configuration = await getConfiguration();
  if (configuration) {
    name = configuration.collectChannelReferenceFieldName;
  }
  return name;
}

async function requiredFieldDefinitions(): Promise<FieldDefinition[]> {
  const requiredFieldDefinitions = customTypeDefinition.orderCustomTypeFieldDefinitions as FieldDefinition[];
  const fieldName = await collectChannelReferenceFieldName();
  if (fieldName) {
    requiredFieldDefinitions.push({
      name: fieldName,
      label: {
        en: 'FFT Click & Collect Facility',
      },
      required: false,
      type: {
        name: 'String',
      },
    });
  }
  return requiredFieldDefinitions;
}

async function listOfMissingFields(existingFields: FieldDefinition[]): Promise<FieldDefinition[]> {
  const requiredFields = await requiredFieldDefinitions();
  const requiredFieldNames = requiredFields.map((f) => f.name);
  const existingFieldNames = existingFields.map((f) => f.name);
  const missingFieldNames = requiredFieldNames.filter((f) => !existingFieldNames.includes(f));
  return requiredFields.filter((f) => missingFieldNames.includes(f.name));
}
