import { Request, Response, NextFunction } from 'express';
import { JwtPayload } from 'jsonwebtoken';

import { AUTHORIZATION } from '../common';
import { validateToken } from '../jwt';
import { logger } from '../utils/loggerUtils';

// The CustomRequest interface enables us to provide JWTs to our controllers.
export interface CustomRequest extends Request {
  token: JwtPayload;
}

export const checkJwt = (req: Request, res: Response, next: NextFunction) => {
  // Get the JWT from the request header.
  const token = req.get(AUTHORIZATION) as string;
  try {
    // Validate the token and retrieve its data.
    const jwtPayload = validateToken(token?.split(' ')[1]);
    // Add the payload to the request so controllers may access it.
    (req as CustomRequest).token = jwtPayload;
  } catch (error) {
    logger.info('Error validating JWT', error);
    res
      .status(401)
      .type('json')
      .send(JSON.stringify({ message: 'Missing or invalid token' }));
    return;
  }

  next();
};
