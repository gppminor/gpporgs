export class User {
  id?: string;
  role: Role;
  name: string;
  email: string;
  createdAt: number;
  lastAccessAt: number;
  accessCount: number;
}

export enum Role {
  NONE = 'NONE',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}
