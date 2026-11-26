import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware';
import { validate } from '../../middlewares/validate.middleware';
import * as controller from './note.controller';
import {
  createNoteSchema,
  updateNoteSchema,
  listNotesQuerySchema,
  noteIdParamSchema,
} from './note.schema';

export const noteRouter = Router();

noteRouter.use(requireAuth);

noteRouter.get('/', validate(listNotesQuerySchema), controller.getNotes);
noteRouter.post('/', validate(createNoteSchema), controller.createNote);

noteRouter.get('/:id', validate(noteIdParamSchema), controller.getNoteById);
noteRouter.patch('/:id', validate(updateNoteSchema), controller.updateNote);
noteRouter.delete('/:id', validate(noteIdParamSchema), controller.deleteNote);

noteRouter.post('/:id/publish', validate(noteIdParamSchema), controller.publishNote);
noteRouter.post('/:id/archive', validate(noteIdParamSchema), controller.archiveNote);
noteRouter.post('/:id/restore', validate(noteIdParamSchema), controller.restoreNote);