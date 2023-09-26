import { ValidatorFunction } from './validatorFunction';
export type Wrapper = (validator: ValidatorFunction) => (value: object) => boolean;
