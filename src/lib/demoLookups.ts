// Built-in fallback data for Case Types and Districts — mirrors the
// pattern used for courts (see aurangabadCourts.ts). Populates Settings →
// Case Type / District Management immediately, even before a real
// database is connected. The live Supabase fetch in DataContext replaces
// these with real rows the instant the corresponding tables have data.

export const DEMO_CASE_TYPE_NAMES: string[] = [
  'Civil',
  'Criminal',
  'Family',
  'Property Dispute',
  'Cheque Bounce',
  'Motor Accident Claim',
  'Consumer Complaint',
  'Labour / Employment',
  'Matrimonial',
  'Writ Petition',
  'Company / NCLT',
  'Succession / Inheritance',
  'Rent / Tenancy',
  'Arbitration',
];

export const DEMO_DISTRICT_NAMES: string[] = [
  'Aurangabad',
  'Jalna',
  'Beed',
  'Parbhani',
  'Nashik',
  'Pune',
  'Mumbai',
];

export const getFallbackCaseTypes = (): { id: string; name: string; createdAt: Date }[] =>
  DEMO_CASE_TYPE_NAMES.map((name, i) => ({
    id: `local-casetype-${i + 1}`,
    name,
    createdAt: new Date(),
  }));

export const getFallbackDistricts = (): { id: string; name: string; createdAt: Date }[] =>
  DEMO_DISTRICT_NAMES.map((name, i) => ({
    id: `local-district-${i + 1}`,
    name,
    createdAt: new Date(),
  }));
