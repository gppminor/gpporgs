export class Review {
  id: string;
  organization: string;
  createdAt: number;
  address: string; // address id
  // Default vals below
  reviewer: { email: string } = { email: '' }; // reviewer object with email
  cost: number = 0;
  stipend: number = 0;
  duration: string = '';
  safety: number = 0; // 1-5 rating
  region: string = '';
  languages: Array<string> = [];
  sectors: Array<string> = [];
  otherSector: string = ''; // TODO: ui input
  evaluation: string = '';
  typicalDay: string = '';
  workDone: string = '';
  difficulties: string = '';
  responsiveness: string = ''; // 1-5 rating
  otherComments: string = '';
  anonymous: boolean = true;
}
