import { Router } from 'express';
import bro from './bro';
import { CodeBro } from '../../types';

export default Router()
  .post(CodeBro.Command.bro, bro);
