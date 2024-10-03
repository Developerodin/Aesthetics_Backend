import express from 'express';
import { createDataWithUrl, getAllData, getDataById, deleteData } from '../controllers/myDataController.js';

const router = express.Router();

router.post('/create-data', createDataWithUrl);
router.get('/', getAllData);
router.get('/:id', getDataById);
router.delete('/:id', deleteData);

export default router;