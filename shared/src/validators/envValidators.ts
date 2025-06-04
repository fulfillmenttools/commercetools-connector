import { optional, standardString, standardKey, region, standardEmail, standardBoolean } from './helpersValidators';

/**
 * Create here your own validators
 */
const envValidators = [
  standardString(
    ['clientId'],
    {
      code: 'InvalidClientId',
      message: 'Client id should be 24 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 24, max: 24 }
  ),

  standardString(
    ['clientSecret'],
    {
      code: 'InvalidClientSecret',
      message: 'Client secret should be 32 characters.',
      referencedBy: 'environmentVariables',
    },
    { min: 32, max: 32 }
  ),

  standardKey(['projectKey'], {
    code: 'InvalidProjectKey',
    message: 'Project key should be a valid string.',
    referencedBy: 'environmentVariables',
  }),

  optional(standardString)(
    ['scope'],
    {
      code: 'InvalidScope',
      message: 'Scope should be at least 2 characters long.',
      referencedBy: 'environmentVariables',
    },
    { min: 2, max: undefined }
  ),

  region(['region'], {
    code: 'InvalidRegion',
    message: 'Not a valid region.',
    referencedBy: 'environmentVariables',
  }),

  standardKey(['fftProjectId'], {
    code: 'InvalidProjectId',
    message: 'FFT Project ID must be specified.',
    referencedBy: 'environmentVariables',
  }),

  standardString(
    ['fftApiKey'],
    {
      code: 'InvalidApiKey',
      message: 'FFT API Key must be specified.',
      referencedBy: 'environmentVariables',
    },
    { min: 16, max: 64 }
  ),

  standardEmail(['fftApiUser'], {
    code: 'InvalidApiUser',
    message: 'FFT API User must be specified.',
    referencedBy: 'environmentVariables',
  }),

  standardString(
    ['fftApiPassword'],
    {
      code: 'InvalidApiPassword',
      message: 'FFT API Password must be specified.',
      referencedBy: 'environmentVariables',
    },
    { min: 8, max: 64 }
  ),

  standardString(
    ['jwtSecret'],
    {
      code: 'InvalidJwtSecret',
      message: 'JWT secret must be specified.',
      referencedBy: 'environmentVariables',
    },
    { min: 32, max: undefined }
  ),

  standardString(
    ['jwtIssuer'],
    {
      code: 'InvalidJwtIssuer',
      message: 'JWT issuer must be specified.',
      referencedBy: 'environmentVariables',
    },
    { min: 4, max: undefined }
  ),

  standardString(
    ['jwtAudience'],
    {
      code: 'InvalidJwtAudience',
      message: 'JWT audience must be specified.',
      referencedBy: 'environmentVariables',
    },
    { min: 4, max: undefined }
  ),

  standardString(
    ['jwtSubject'],
    {
      code: 'InvalidJwtSubject',
      message: 'JWT subject must be specified.',
      referencedBy: 'environmentVariables',
    },
    { min: 4, max: undefined }
  ),

  standardBoolean(
    ['featStatusupdatesActive'],
    {
      code: 'InvalidfeatStatusupdatesActive',
      message: 'featStatusupdatesActive must be true or false.',
      referencedBy: 'environmentVariables',
    },
    { min: 4, max: 5 }
  ),

  standardBoolean(
    ['featChannelsyncActive'],
    {
      code: 'InvalidfeatChannelsyncActive',
      message: 'featChannelsyncActive must be true or false.',
      referencedBy: 'environmentVariables',
    }
  ),

  standardBoolean(
    ['featOrdersyncActive'],
    {
      code: 'InvalidfeatOrdersyncActive',
      message: 'featOrdersyncActive must be true or false.',
      referencedBy: 'environmentVariables',
    }
  ),
];

export default envValidators;
