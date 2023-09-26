import { CustomError } from '../errors';
import { getValidateMessages } from '../validators/helpersValidators';
import envValidators from '../validators/envValidators';

interface Configuration {
  clientId: string;
  clientSecret: string;
  projectKey: string;
  scope: string | undefined;
  region: string;
  fftProjectId: string;
  fftApiKey: string;
  fftApiUser: string;
  fftApiPassword: string;
  jwtSecret: string;
  jwtIssuer: string;
  jwtAudience: string;
  jwtSubject: string;
}

/**
 * Read the configuration env vars
 *
 * @returns The configuration with the correct env vars
 */
export const readConfiguration = (() => {
  let envVars: Configuration | undefined = undefined;
  return () =>
    (envVars =
      envVars ||
      (() => {
        return validateConfiguration();
      })());
})();

const validateConfiguration = () => {
  const envVars: Configuration = {
    clientId: process.env.CTP_CLIENT_ID as string,
    clientSecret: process.env.CTP_CLIENT_SECRET as string,
    projectKey: process.env.CTP_PROJECT_KEY as string,
    scope: process.env.CTP_SCOPE,
    region: process.env.CTP_REGION as string,
    fftProjectId: process.env.FFT_PROJECT_ID as string,
    fftApiKey: process.env.FFT_API_KEY as string,
    fftApiUser: process.env.FFT_API_USER as string,
    fftApiPassword: process.env.FFT_API_PASSWORD as string,
    jwtSecret: process.env.JWT_SECRET as string,
    jwtIssuer: process.env.JWT_ISSUER as string,
    jwtAudience: process.env.JWT_AUDIENCE as string,
    jwtSubject: process.env.JWT_SUBJECT as string,
  };

  const validationErrors = getValidateMessages(envValidators, envVars);

  if (validationErrors.length) {
    throw new CustomError(500, 'Invalid Environment Variables please check your .env file', validationErrors);
  }

  return envVars;
};
