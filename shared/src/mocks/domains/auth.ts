import { rest } from 'msw';
import { v4 } from 'uuid';

import { ctAuth, fftAuth } from '../baseUrls';
import { readConfiguration } from '../../utils';

export const handlers = [
  rest.post(ctAuth(), (_req, res, ctx) => {
    return res(
      ctx.json({
        access_token: v4(),
        token_type: 'Bearer',
        expires_in: 172800,
        scope: readConfiguration().scope,
      })
    );
  }),
  rest.post(fftAuth(), (_req, res, ctx) => {
    return res(
      ctx.json({
        kind: 'identitytoolkit#VerifyPasswordResponse',
        localId: 'wegjwegjlwe;gjilehgi',
        email: 'mmustermann@ocff-test-git.com',
        displayName: 'Max Mustermann',
        idToken: 'idToken',
        registered: true,
        refreshToken: 'refreshToken',
        expiresIn: '3600',
      })
    );
  }),
];
