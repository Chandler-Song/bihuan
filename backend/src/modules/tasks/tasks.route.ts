import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { postCreate, getList, getOne, patchOne, deleteOne, getTags } from './tasks.controller';

const router = Router();

router.use(requireAuth);
router.post('/', postCreate);
router.get('/', getList);
router.get('/tags', getTags);
router.get('/:id', getOne);
router.patch('/:id', patchOne);
router.delete('/:id', deleteOne);

export default router;
