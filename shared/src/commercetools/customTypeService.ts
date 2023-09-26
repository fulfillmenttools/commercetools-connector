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
        logger.error(JSON.stringify(result.body));
        throw new CustomError(result.statusCode || 500, `Cannot read CT custom type '${typeKey}'`);
      }
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.info(`CT custom order type not found`);
      return undefined;
    }
    logger.error(JSON.stringify(error));
    throw new CustomError(status, `Cannot read CT custom type`);
  }
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
      logger.error(JSON.stringify(result.body));
      throw new CustomError(result.statusCode || 500, `Cannot read CT custom type '${id}'`);
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.info(`CT custom type '${id}' not found`);
      return undefined;
    }
    logger.error(JSON.stringify(error));
    throw new CustomError(status, `Cannot read CT custom type`);
  }
}

export async function createCustomOrderType(): Promise<string | undefined> {
  try {
    const typeKey = await orderCustomTypeKey();
    if (typeKey) {
      const customType: TypeDraft = {
        key: typeKey,
        name: {
          en: CUSTOM_TYPE_NAME,
        },
        resourceTypeIds: ['order'],
        fieldDefinitions: customTypeDefinition.orderCustomTypeFieldDefinitions as FieldDefinition[],
      };
      const result = await createApiRoot().types().post({ body: customType }).execute();

      if (result.statusCode === 201) {
        logger.info(`Created CT custom type '${typeKey}': '${result.body.id}'`);
        return result.body.id;
      } else {
        logger.error(JSON.stringify(result.body));
        throw new CustomError(result.statusCode || 500, `Cannot create CT custom type '${typeKey}'`);
      }
    }
  } catch (error) {
    logger.error(JSON.stringify(error));
    throw new CustomError(statusCode(error), `Cannot create CT custom type`);
  }
}

export async function updateCustomOrderType(id: string): Promise<string | undefined> {
  try {
    const typeKey = await orderCustomTypeKey();
    if (typeKey) {
      const customType = await getCustomTypeById(id);
      if (customType) {
        const missingFields = listOfMissingFields(customType.fieldDefinitions);
        if (missingFields.length > 0) {
          const updateActions = missingFields.map((f) => addFieldDefinitionAction(f));
          const typeUpdate = updateTypeAction(customType, updateActions);

          const result = await createApiRoot().types().withId({ ID: id }).post({ body: typeUpdate }).execute();

          if (result.statusCode === 200) {
            logger.info(`Updated CT custom type '${typeKey}': '${result.body.id}'`);
            return result.body.id;
          } else {
            logger.error(JSON.stringify(result.body));
            throw new CustomError(result.statusCode || 500, `Cannot update CT custom type '${typeKey}'`);
          }
        }
      }
    }
  } catch (error) {
    logger.error(JSON.stringify(error));
    throw new CustomError(statusCode(error), `Cannot update CT custom type`);
  }
}

export async function orderCustomTypeKey(): Promise<string | undefined> {
  let key: string | undefined;
  const configuration = await getConfiguration();
  if (configuration) {
    key = configuration.orderCustomTypeKey;
  }
  return key;
}

function listOfMissingFields(existingFields: FieldDefinition[]): FieldDefinition[] {
  const requiredFieldNames = customTypeDefinition.orderCustomTypeFieldDefinitions.map((f) => f.name);
  const existingFieldNames = existingFields.map((f) => f.name);
  const missingFieldNames = requiredFieldNames.filter((f) => !existingFieldNames.includes(f));
  const missingFields = customTypeDefinition.orderCustomTypeFieldDefinitions.filter((f) =>
    missingFieldNames.includes(f.name)
  );
  return missingFields as FieldDefinition[];
}
