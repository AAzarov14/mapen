import type { Request, Response } from 'express';
import * as adminService from './admin.service';
import type { ListUsersQuery, ChangeRoleBody, UpdateUserBody } from './admin.schema';

type IdParams = { id: string };

export async function getUsers(req: Request, res: Response) {
  const query = req.validated!.query as ListUsersQuery;
  const result = await adminService.getUsers(query);
  res.json({ data: result.items, meta: result.meta });
}

export async function getUserById(req: Request<IdParams>, res: Response) {
  const user = await adminService.getUserById(req.params.id);
  res.json({ data: user });
}

export async function updateUser(req: Request<IdParams>, res: Response) {
  const dto = req.validated!.body as UpdateUserBody;
  const user = await adminService.updateUser(req.params.id, req.user!, dto);
  res.json({ data: user });
}

export async function changeRole(req: Request<IdParams>, res: Response) {
  const dto = req.validated!.body as ChangeRoleBody;
  const user = await adminService.changeRole(req.params.id, req.user!, dto);
  res.json({ data: user });
}

export async function activateUser(req: Request<IdParams>, res: Response) {
  const user = await adminService.toggleActive(req.params.id, req.user!, true);
  res.json({ data: user });
}

export async function deactivateUser(req: Request<IdParams>, res: Response) {
  const user = await adminService.toggleActive(req.params.id, req.user!, false);
  res.json({ data: user });
}