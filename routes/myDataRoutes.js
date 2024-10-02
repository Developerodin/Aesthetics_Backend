import express from 'express';
import { createData, getAllData, getDataById, deleteData } from '../controllers/myDataController.js';

const router = express.Router();

router.post('/create', createData);
router.get('/', getAllData);
router.get('/:id', getDataById);
router.delete('/:id', deleteData);

export default router;