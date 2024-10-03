import express from 'express';
import { createDataWithUrl, getAllData, getDataById, deleteData ,getDataBySid,endMeeting} from '../controllers/myDataController.js';

const router = express.Router();

router.post('/create-data', createDataWithUrl);
router.get('/', getAllData);
router.get('/:id', getDataById);
router.get('/sid/:sid', getDataBySid);
router.post('/end-meeting', endMeeting);
router.delete('/:id', deleteData);

export default router;