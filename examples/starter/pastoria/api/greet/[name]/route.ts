import express from 'express';

const router = express.Router({mergeParams: true});

router.get<'/', {name: string}>('/', (req, res) => {
  res.status(200).send(`Hello ${req.params.name}`);
});

export default router;
