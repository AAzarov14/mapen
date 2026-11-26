import type { Request, Response } from 'express';
import * as noteService from './note.service';
import type { CreateNoteBody, UpdateNoteBody, ListNotesQuery } from './note.schema';

type IdParams = { id: string };

export async function getNotes(req: Request, res: Response) {
  const query = req.validated!.query as ListNotesQuery;
  const result = await noteService.getNotes(req.user!, query);
  res.json({ data: result.items, meta: result.meta });
}

export async function createNote(req: Request, res: Response) {
  const dto = req.validated!.body as CreateNoteBody;
  const note = await noteService.createNote(req.user!.id, dto);
  res.status(201).json({ data: note });
}

export async function getNoteById(req: Request<IdParams>, res: Response) {
  const note = await noteService.getNoteById(req.params.id, req.user!);
  res.json({ data: note });
}

export async function updateNote(req: Request<IdParams>, res: Response) {
  const dto = req.validated!.body as UpdateNoteBody;
  const note = await noteService.updateNote(req.params.id, req.user!, dto);
  res.json({ data: note });
}

export async function deleteNote(req: Request<IdParams>, res: Response) {
  await noteService.deleteNote(req.params.id, req.user!);
  res.status(204).send();
}

export async function publishNote(req: Request<IdParams>, res: Response) {
  const note = await noteService.setStatus(req.params.id, req.user!, 'PUBLISHED');
  res.json({ data: note });
}

export async function archiveNote(req: Request<IdParams>, res: Response) {
  const note = await noteService.setStatus(req.params.id, req.user!, 'ARCHIVED');
  res.json({ data: note });
}

export async function restoreNote(req: Request<IdParams>, res: Response) {
  const note = await noteService.restoreNote(req.params.id, req.user!);
  res.json({ data: note });
}