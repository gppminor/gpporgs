export type User = {
  id?: string;
  role: Role;
  name: string;
  email: string;
  createdAt: number;
  lastAccessAt: number;
  loginCount: number;
};

export enum Role {
  NONE = 'NONE',
  STUDENT = 'STUDENT',
  ADMIN = 'ADMIN',
}
