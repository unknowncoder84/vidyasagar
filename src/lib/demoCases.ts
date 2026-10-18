// Built-in demo case data — lets you test the full Cases flow (stage
// grouping, IR Favor/Against, Circulated/Non-circulated filters, and the
// "Browse by Court" search) without a real database connected.
//
// These show up only as a fallback (see DataContext) when there is no
// real tenant/login, i.e. while running against placeholder Supabase
// credentials. The moment a real account logs in against a real
// database, this demo data disappears and the tenant's real cases load
// instead — no further code changes needed.
//
// `court` values reference the fallback Aurangabad court ids from
// aurangabadCourts.ts (local-court-N), so selecting a court in "Browse by
// Court" actually returns matching demo cases.

import { Case, CaseStage } from '../types';

type DemoCaseSeed = {
  clientName: string;
  partiesName: string;
  fileNo: string;
  regNo: string;
  stampNo: string;
  courtIndex: number; // 1-based index into AURANGABAD_COURT_NAMES / local-court-N
  caseTypeIndex: number; // 1-based index into DEMO_CASE_TYPE_NAMES / local-casetype-N
  district: string;
  stage: CaseStage;
  status: Case['status'];
  interimRelief: '' | 'favor' | 'against';
  circulationStatus: string;
  nextDateOffsetDays: number; // relative to today, can be negative (past)
  feesQuoted: number;
};

const SEEDS: DemoCaseSeed[] = [
  { clientName: 'Shri Ambika Printers and Publications', partiesName: 'Shri Ambika Printers Vs Gunwant Nilkanth Deshpande', fileNo: 'S.C.C./3763/2018', regNo: 'S.C.C./3763/2018', stampNo: 'ST-1001', courtIndex: 28, caseTypeIndex: 1, district: 'Aurangabad', stage: 'admitted', status: 'active', interimRelief: 'favor', circulationStatus: 'circulated', nextDateOffsetDays: 16, feesQuoted: 25000 },
  { clientName: 'Devashish Sanjaykumar Pradhan', partiesName: 'Devashish Pradhan Vs Anil Maganrao Gaikwad', fileNo: 'S.C.C./2182/2020', regNo: 'S.C.C./2182/2020', stampNo: 'ST-1002', courtIndex: 28, caseTypeIndex: 5, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: 12, feesQuoted: 18000 },
  { clientName: 'The State of Maharashtra', partiesName: 'State of Maharashtra Vs Devendra Rajendrsing Patil', fileNo: 'R.C.C./2543/2022', regNo: 'R.C.C./2543/2022', stampNo: 'ST-1003', courtIndex: 1, caseTypeIndex: 2, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: 'against', circulationStatus: 'circulated', nextDateOffsetDays: 15, feesQuoted: 30000 },
  { clientName: 'Chetan Kumar Chavan', partiesName: 'Chetan Chavan Vs State of Maharashtra', fileNo: 'S.C.C./9981/2021', regNo: 'S.C.C./9981/2021', stampNo: 'ST-1004', courtIndex: 2, caseTypeIndex: 2, district: 'Aurangabad', stage: 'notice', status: 'pending', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: 20, feesQuoted: 15000 },
  { clientName: 'The State of Maharashtra', partiesName: 'State of Maharashtra Vs Kunjbhihari Jugalkishor Agrawal', fileNo: 'R.C.C./301451/2010', regNo: 'R.C.C./301451/2010', stampNo: 'ST-1005', courtIndex: 23, caseTypeIndex: 2, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: 'favor', circulationStatus: 'circulated', nextDateOffsetDays: 25, feesQuoted: 22000 },
  { clientName: 'The State of Maharashtra', partiesName: 'State of Maharashtra Vs Indumati Ramchandra Landage', fileNo: 'R.C.C./300259/2014', regNo: 'R.C.C./300259/2014', stampNo: 'ST-1006', courtIndex: 23, caseTypeIndex: 2, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: -5, feesQuoted: 20000 },
  { clientName: 'The State of Maharashtra', partiesName: 'State of Maharashtra Vs Prakash Dadarao Suryawanshi', fileNo: 'R.C.C./301040/2015', regNo: 'R.C.C./301040/2015', stampNo: 'ST-1007', courtIndex: 1, caseTypeIndex: 2, district: 'Jalna', stage: 'evidence' as CaseStage, status: 'active', interimRelief: 'against', circulationStatus: 'circulated', nextDateOffsetDays: 9, feesQuoted: 17500 },
  { clientName: 'Ms Rucha Engineers Pvt Ltd', partiesName: 'Rucha Engineers Pvt Ltd Vs Umesh Shahapurkar', fileNo: 'S.C.C./13261/2023', regNo: 'S.C.C./13261/2023', stampNo: 'ST-1008', courtIndex: 4, caseTypeIndex: 11, district: 'Aurangabad', stage: 'drafting', status: 'pending', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: 30, feesQuoted: 45000 },
  { clientName: 'Mohd. Aazam Shaikh', partiesName: 'Shaikh Aazam Vs Azam Haider Shaikh', fileNo: 'Appln./515/2025', regNo: 'Appln./515/2025', stampNo: 'ST-1009', courtIndex: 5, caseTypeIndex: 3, district: 'Beed', stage: 'pre-admission', status: 'pending', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: 44, feesQuoted: 12000 },
  { clientName: 'The State of Maharashtra', partiesName: 'State of Maharashtra Vs Shaikh Nasir Shaikh Lala Amir', fileNo: 'R.C.C./611/2020', regNo: 'R.C.C./611/2020', stampNo: 'ST-1010', courtIndex: 23, caseTypeIndex: 2, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: 'favor', circulationStatus: 'circulated', nextDateOffsetDays: 22, feesQuoted: 19000 },
  { clientName: 'Rahul Arjunrao Darunkar', partiesName: 'State of Maharashtra Vs Rahul Arjunrao Darunkar', fileNo: 'R.C.C./1026/2022', regNo: 'R.C.C./1026/2022', stampNo: 'ST-1011', courtIndex: 23, caseTypeIndex: 2, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: 10, feesQuoted: 21000 },
  { clientName: 'Mo. Mustfa Mo. Mastan', partiesName: 'State of Maharashtra Vs Mo. Mustfa Mo. Mastan', fileNo: 'R.C.C./2411/2022', regNo: 'R.C.C./2411/2022', stampNo: 'ST-1012', courtIndex: 23, caseTypeIndex: 2, district: 'Aurangabad', stage: 'final-hearing', status: 'active', interimRelief: 'against', circulationStatus: 'circulated', nextDateOffsetDays: 30, feesQuoted: 23000 },
  { clientName: 'Sharad Jagnnath Bavaskar', partiesName: 'State of Maharashtra Vs Sharad Jagnnath Bavaskar', fileNo: 'R.C.C./302075/2014', regNo: 'R.C.C./302075/2014', stampNo: 'ST-1013', courtIndex: 1, caseTypeIndex: 2, district: 'Aurangabad', stage: 'evidence' as CaseStage, status: 'active', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: 7, feesQuoted: 16000 },
  { clientName: 'Salman Khan Rashid Khan', partiesName: 'State of Maharashtra Vs Salman Khan Rashid Khan', fileNo: 'R.C.C./1081/2018', regNo: 'R.C.C./1081/2018', stampNo: 'ST-1014', courtIndex: 1, caseTypeIndex: 2, district: 'Aurangabad', stage: 'evidence' as CaseStage, status: 'active', interimRelief: 'favor', circulationStatus: 'circulated', nextDateOffsetDays: 18, feesQuoted: 24000 },
  { clientName: 'Mahmood Ilahi Khan Manzoor Ilahi Khan', partiesName: 'Abdul Vs Mahmood Ilahi Khan Manzoor Ilahi Khan', fileNo: 'R.C.C./792/2018', regNo: 'R.C.C./792/2018', stampNo: 'ST-1015', courtIndex: 1, caseTypeIndex: 2, district: 'Aurangabad', stage: 'disposed', status: 'closed', interimRelief: '', circulationStatus: 'non-circulated', nextDateOffsetDays: -40, feesQuoted: 14000 },
];

// "evidence" isn't in the official CaseStage union — map any ad-hoc demo
// stage values down to a real CaseStage so the grouping on CasesPage
// never silently drops a row. Keeps demo data honest to the real type.
const normalizeStage = (s: CaseStage | string): CaseStage => {
  const valid: CaseStage[] = [
    'consultation', 'drafting', 'filing', 'circulation', 'notice',
    'pre-admission', 'admitted', 'final-hearing', 'reserved', 'disposed',
  ];
  return (valid as string[]).includes(s) ? (s as CaseStage) : 'final-hearing';
};

export const getDemoCases = (): Case[] => {
  const today = new Date();
  return SEEDS.map((s, i) => {
    const nextDate = new Date(today);
    nextDate.setDate(nextDate.getDate() + s.nextDateOffsetDays);
    const filingDate = new Date(today);
    filingDate.setDate(filingDate.getDate() - 180);

    return {
      id: `demo-case-${i + 1}`,
      clientName: s.clientName,
      clientEmail: '',
      clientMobile: '',
      fileNo: s.fileNo,
      stampNo: s.stampNo,
      regNo: s.regNo,
      partiesName: s.partiesName,
      district: s.district,
      caseType: `local-casetype-${s.caseTypeIndex}`,
      court: `local-court-${s.courtIndex}`,
      onBehalfOf: 'petitioner',
      noResp: '1',
      opponentLawyer: '',
      additionalDetails: 'Demo data for testing — not a real case.',
      feesQuoted: s.feesQuoted,
      status: s.status,
      stage: normalizeStage(s.stage),
      nextDate,
      filingDate,
      circulationStatus: s.circulationStatus,
      interimRelief: s.interimRelief,
      createdBy: 'demo',
      createdAt: today,
      updatedAt: today,
    } as Case;
  });
};
