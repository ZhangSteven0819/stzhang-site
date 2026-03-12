export interface ClaimItem {
  id: string;
  label: string;
  value: string;
  verified: boolean;
  sourceNote: string;
}

export const claimItems: ClaimItem[] = [
  {
    id: 'licensed-care',
    label: 'Faglig ramme',
    value: 'Klinisk fysioterapi med kvinnehelse som kjerneomrade',
    verified: true,
    sourceNote: 'Innholdsstrategi for Sound of Simone',
  },
  {
    id: 'direct-access',
    label: 'Tilgjengelighet',
    value: 'Direkte kontakt via e-post og telefon',
    verified: true,
    sourceNote: 'Publisert kontaktinformasjon pa forsiden',
  },
  {
    id: 'booking-flow',
    label: 'Bookingflyt',
    value: 'Bestilling via kontakt inntil Physica er koblet',
    verified: true,
    sourceNote: 'Produktbeslutning for V1',
  },
  {
    id: 'wait-time-claim',
    label: 'Ventetid',
    value: 'Kort ventetid',
    verified: false,
    sourceNote: 'Ingen dokumentert metrikk publisert ennå',
  },
];
