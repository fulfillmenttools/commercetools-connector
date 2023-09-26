import { createApiRoot } from '../client';
import { CUSTOM_OBJECT_CONTAINER, CUSTOM_OBJECT_KEY } from '../common';
import { CustomError } from '../errors';
import { Configuration } from '../types';
import { logger } from '../utils';
import { statusCode } from './statusCode';

async function getConfigurationObject(): Promise<unknown> {
  try {
    const result = await createApiRoot()
      .customObjects()
      .withContainerAndKey({ container: CUSTOM_OBJECT_CONTAINER, key: CUSTOM_OBJECT_KEY })
      .get()
      .execute();

    if (result.statusCode === 200) {
      return result.body.value;
    } else {
      throw new CustomError(
        result.statusCode || 500,
        `Cannot read CT custom object ${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`
      );
    }
  } catch (error) {
    const status = statusCode(error);
    if (status === 404) {
      logger.warn(`CT custom object ${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY} not found`);
      return undefined;
    }
    logger.error(JSON.stringify(error));
    throw new CustomError(status, `Cannot read CT custom object ${CUSTOM_OBJECT_CONTAINER}/${CUSTOM_OBJECT_KEY}`);
  }
}

export async function getConfiguration(): Promise<Configuration | undefined> {
  let configuration;
  const configurationObj = await getConfigurationObject();
  if (typeof configurationObj === 'object' && configurationObj !== null) {
    configuration = configurationObj as Configuration;
  }
  return configuration;
}
