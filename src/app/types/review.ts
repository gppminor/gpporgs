export class Review {
  id: string;
  organization: string;
  createdAt: number;
  reviewer: string; // email of reviewer
  address: string; // address id
  // Default vals below
  cost: number = 0; // TODO: currency input
  stipend: number = 0; // TODO: currency input
  duration: string = ''; // TODO: select input
  safety: number = 0; // TODO: rating select input
  region: string = '';
  languages: Array<string> = [];
  sectors: Array<string> = [];
  otherSector: string = ''; // TODO: ui input
  evaluation: string = '';
  typicalDay: string = '';
  workDone: string = '';
  difficulties: string = '';
  responsiveness: string = ''; // TODO: select input
  otherComments: string = '';
  anonymous: boolean = true; // TODO: checkbox input
}
