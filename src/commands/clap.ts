import { Router } from 'express';

export default Router()
  .post('/clap', (req, res) => {
    res.json({ response: 'if you\'re happy and you know it' });
  });
