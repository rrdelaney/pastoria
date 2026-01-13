import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  console.log(req.url);
  res.status(200).send('Hello!');
});

export default router;
