import { Router } from 'express';
import bro from './bro';

export default Router()
  .post('/bro', bro);
