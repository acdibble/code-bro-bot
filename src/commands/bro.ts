import { Router } from 'express';

export default Router()
  .post('/bro', (req, res) => {
    res.json({ response: 'bro' });
  });
