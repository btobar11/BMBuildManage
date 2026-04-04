export interface IUser {
  id: string;
  email?: string;
  company_id: string;
  role: string;
}

export interface IRequestWithUser extends Request {
  user: IUser;
  token?: string;
}
