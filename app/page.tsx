'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowRight, BarChart3, Check, CheckCircle2, ChevronRight,
  CircleGauge, CloudCog, Database, Download, FileCheck2, FileSpreadsheet, Fingerprint, Globe2,
  KeyRound, Layers3, LockKeyhole, Network, Play, RefreshCcw, ScanLine,
  ServerCog, ShieldCheck, Sparkles, UploadCloud, Users, Workflow, Zap, LoaderCircle,
  MousePointer2, Square, Building2, LogOut, UserRound,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

type Tier = 'high' | 'assisted';
type Region = 'us' | 'kr' | 'tw';
type PrivacyMethod = 'aggregate' | 'compute' | 'verifier' | 'zkp';
type PortalRole = 'customer' | 'hoya';

const TOUR_TOTAL = 43;

const regions: Record<Region, { name: string; factor: string; residence: string; driver: string }> = {
  us: { name: 'United States', factor: 'EPA eGRID 2023 Rev. 2', residence: 'US regional vault', driver: 'California SB 253 readiness' },
  kr: { name: 'Republic of Korea', factor: 'KEA EG-TIPS 2023', residence: 'Seoul regional vault', driver: 'PIPA-aware transfer controls' },
  tw: { name: 'Taiwan', factor: 'MOENV factor registry', residence: 'Taiwan regional vault', driver: 'Carbon-fee reduction planning' },
};

const processData = [
  { id: '01', label: 'Cleaning', value: 18, color: '#9a6cdf', detail: 'HVAC · UPW · chillers' },
  { id: '02', label: 'E-beam exposure', value: 46, color: '#7dc84f', detail: 'tool · vacuum · cooling' },
  { id: '03', label: 'Develop & etch', value: 27, color: '#f1536a', detail: 'F-gases · abatement' },
  { id: '04', label: 'Final clean & metrology', value: 9, color: '#15a9d2', detail: 'inspection · water' },
];

const stages = [
  { name: 'Collect', icon: UploadCloud, color: 'purple' },
  { name: 'Map', icon: Sparkles, color: 'lime' },
  { name: 'Validate', icon: ScanLine, color: 'blue' },
  { name: 'Protect', icon: ShieldCheck, color: 'coral' },
  { name: 'Report', icon: BarChart3, color: 'cyan' },
];

const validationRows = [
  ['Identity & authorization', 'Pass', 'Signed customer and site IDs'],
  ['Technical schema', 'Pass', 'PACT v3.0.3 compatible'],
  ['Boundary & allocation', 'Review', 'Shared cleanroom allocation: 24%'],
  ['Evidence provenance', 'Pass', '7 source records linked'],
  ['Plausibility', 'Pass', 'Within peer intensity range'],
  ['Approval & assurance', 'Queued', 'Maker-checker pending'],
];

const privacyMethods = [
  { id: 'aggregate' as const, icon: LockKeyhole, title: 'Signed aggregate', tag: 'Default', copy: 'Only the result and provenance metadata leave the customer.' },
  { id: 'compute' as const, icon: ServerCog, title: 'Confidential compute', tag: 'Sensitive', copy: 'Raw activity data is released only to attested code.' },
  { id: 'verifier' as const, icon: FileCheck2, title: 'Verifier-mediated', tag: 'Assured', copy: 'A third party checks evidence and signs the aggregate.' },
  { id: 'zkp' as const, icon: Fingerprint, title: 'Zero-knowledge proof', tag: 'Pilot', copy: 'Proves a narrow computation—not whether source readings are true.' },
];

function Metric({ label, value, note, tone = 'teal' }: { label: string; value: string; note: string; tone?: string }) {
  return <article className={`metric-card metric-${tone}`}><p>{label}</p><strong>{value}</strong><span>{note}</span></article>;
}

function JourneyCard({ tier, selected, onClick }: { tier: Tier; selected: boolean; onClick: () => void }) {
  const high = tier === 'high';
  return (
    <button className={`journey-card ${selected ? 'selected' : ''}`} onClick={onClick} aria-pressed={selected} data-tour={`journey-${tier}`}>
      <div className="journey-icon">{high ? <Network /> : <Users />}</div>
      <div>
        <div className="journey-title"><span>{high ? 'High ESG maturity' : 'Medium / Low maturity'}</span><Badge variant="outline">{high ? 'API lane' : 'Assisted lane'}</Badge></div>
        <p>{high ? 'Signed aggregate API, customer-side calculation or confidential compute.' : 'Guided files, AI-assisted mapping and transparent governed proxies.'}</p>
      </div>
      <ChevronRight className="journey-arrow" />
    </button>
  );
}

function Pipeline({ active }: { active: number }) {
  return (
    <div className="pipeline" aria-label="End-to-end data flow">
      {stages.map((stage, index) => {
        const Icon = stage.icon; const done = index < active; const current = index === active;
        return <div className="pipeline-piece" key={stage.name}>
          <div className={`pipeline-node ${stage.color} ${done ? 'done' : ''} ${current ? 'current' : ''}`}>
            <span className="node-index">0{index + 1}</span><Icon /><b>{stage.name}</b><small>{done ? 'Complete' : current ? 'In progress' : 'Ready'}</small>
          </div>
          {index < stages.length - 1 && <ArrowRight className="pipeline-arrow" />}
        </div>;
      })}
    </div>
  );
}

export default function Home() {
  const [portalRole, setPortalRole] = useState<PortalRole | null>(null);
  const [tier, setTier] = useState<Tier>('high');
  const [region, setRegion] = useState<Region>('tw');
  const [activeTab, setActiveTab] = useState('overview');
  const [activeStage, setActiveStage] = useState(2);
  const [demoComplete, setDemoComplete] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [intakeStatus, setIntakeStatus] = useState<'idle' | 'working' | 'done'>('idle');
  const [uploadedFile, setUploadedFile] = useState('');
  const [mappingAccepted, setMappingAccepted] = useState(false);
  const [validationStatus, setValidationStatus] = useState<'idle' | 'running' | 'review' | 'passed'>('idle');
  const [reportReady, setReportReady] = useState(false);
  const [privacyMethod, setPrivacyMethod] = useState<PrivacyMethod>('aggregate');
  const [notice, setNotice] = useState('');
  const [tourCursor, setTourCursor] = useState({ x: 28, y: 28, visible: false, clicking: false });
  const [tourCue, setTourCue] = useState({ visible: false, step: 0, chapter: '', title: '', body: '' });
  const tourRunRef = useRef(0);
  const regionInfo = regions[region];
  const tierData = useMemo(() => tier === 'high'
    ? { quality: '92%', effort: 'Near-zero', primary: '88%', route: 'Signed aggregate API', privacy: 'Customer-side calculation', evidence: 'Digitally sourced' }
    : { quality: '68%', effort: '< 15 min', primary: '41%', route: 'Guided portal + PDF', privacy: 'Regional evidence vault', evidence: 'Hybrid + proxy' }, [tier]);

  useEffect(() => {
    type DemoInput = { tier?: Tier; region?: Region; stage?: number };
    type ModelContext = { registerTool: (tool: Record<string, unknown>, options?: { signal?: AbortSignal }) => void | Promise<void> };
    const context = (document as Document & { modelContext?: ModelContext }).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    const validTiers = new Set(['high', 'assisted']);
    const validRegions = new Set(['us', 'kr', 'tw']);
    try {
      void Promise.resolve(context.registerTool({
        name: 'configure_hoya_scope3_demo',
        title: 'Configure HOYA Scope 3 demo',
        description: 'Set the visible customer tier, deployment region, and process stage in the HOYA Category 10 architecture demo.',
        inputSchema: {
          type: 'object',
          properties: {
            tier: { type: 'string', enum: ['high', 'assisted'] },
            region: { type: 'string', enum: ['us', 'kr', 'tw'] },
            stage: { type: 'integer', minimum: 0, maximum: 5 },
          },
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, untrustedContentHint: false },
        execute(input: unknown) {
          const next = (input ?? {}) as DemoInput;
          if (next.tier !== undefined && !validTiers.has(next.tier)) throw new Error('Invalid tier');
          if (next.region !== undefined && !validRegions.has(next.region)) throw new Error('Invalid region');
          if (next.stage !== undefined && (!Number.isInteger(next.stage) || next.stage < 0 || next.stage > 5)) throw new Error('Stage must be an integer from 0 to 5');
          if (next.tier) setTier(next.tier);
          if (next.region) setRegion(next.region);
          if (next.stage !== undefined) { setActiveStage(next.stage); setDemoComplete(next.stage === 5); }
          return { tier: next.tier ?? tier, region: next.region ?? region, stage: next.stage ?? activeStage };
        },
      }, { signal: lifecycle.signal })).catch(() => undefined);
    } catch { /* WebMCP is optional in browsers without support. */ }
    return () => lifecycle.abort();
  }, [activeStage, region, tier]);

  const pause = (milliseconds: number) => new Promise((resolve) => window.setTimeout(resolve, milliseconds));

  const resetWorkflow = () => {
    setDemoComplete(false); setActiveStage(0); setIntakeStatus('idle'); setUploadedFile('');
    setMappingAccepted(false); setValidationStatus('idle'); setReportReady(false); setPrivacyMethod('aggregate');
    setNotice('Workflow reset. Choose a customer journey to begin again.');
  };

  const prepareChapter = (role: PortalRole, nextTier: Tier) => {
    setPortalRole(role); setTier(nextTier); setActiveTab('overview'); setDemoComplete(false); setActiveStage(0);
    setIntakeStatus('idle'); setUploadedFile(''); setMappingAccepted(false); setValidationStatus('idle');
    setReportReady(false); setPrivacyMethod('aggregate'); setNotice('');
  };

  const enterWorkspace = (role: PortalRole) => {
    setPortalRole(role); setActiveTab('overview');
    setNotice(role === 'customer' ? 'Signed in to the Customer workspace.' : 'Signed in to the HOYA control room.');
  };

  const clearTourFocus = () => {
    document.querySelectorAll('.tour-focus').forEach((element) => element.classList.remove('tour-focus'));
  };

  const stopDemoTour = () => {
    tourRunRef.current += 1;
    clearTourFocus();
    setIsRunning(false);
    setTourCursor((current) => ({ ...current, visible: false, clicking: false }));
    setTourCue((current) => ({ ...current, visible: false }));
    setNotice('Guided demo stopped. You can continue manually or restart the tour.');
  };

  const runDemo = async () => {
    const runId = tourRunRef.current + 1;
    tourRunRef.current = runId;
    clearTourFocus();
    setPortalRole(null); resetWorkflow();
    setIsRunning(true); setNotice('Guided walkthrough started. Follow the animated cursor.'); setActiveTab('overview');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    const clickThrough = async (
      target: string,
      step: number,
      chapter: string,
      title: string,
      body: string,
      action: () => void | Promise<void>,
      hold = 720,
    ) => {
      if (tourRunRef.current !== runId) throw new Error('tour-cancelled');
      await pause(120);
      const element = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
      if (!element) throw new Error(`Missing tour target: ${target}`);
      clearTourFocus();
      element.classList.add('tour-focus');
      element.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
      setTourCue({ visible: true, step, chapter, title, body });
      await pause(460);
      const rect = element.getBoundingClientRect();
      setTourCursor({ x: rect.left + Math.min(rect.width * .72, rect.width - 18), y: rect.top + Math.min(rect.height * .55, rect.height - 12), visible: true, clicking: false });
      await pause(650);
      if (tourRunRef.current !== runId) throw new Error('tour-cancelled');
      setTourCursor((current) => ({ ...current, clicking: true }));
      await pause(190);
      await action();
      setTourCursor((current) => ({ ...current, clicking: false }));
      await pause(hold);
    };

    try {
      const customerHigh = '1/4 · Customer · High maturity';
      await clickThrough('signin-customer', 1, customerHigh, 'Sign in to the Customer workspace', 'Customer SSO opens a submission-focused interface; HOYA portfolio data is not shown.', () => prepareChapter('customer', 'high'));
      await clickThrough('journey-high', 2, customerHigh, 'Confirm the connected-data journey', 'A high-maturity customer uses approved API connections and digitally sourced evidence.', () => setTier('high'));
      await clickThrough('tab-collect', 3, customerHigh, 'Open Data submission', 'The customer sends only the minimum necessary aggregate and evidence metadata.', () => setActiveTab('collect'));
      await clickThrough('process-intake', 4, customerHigh, 'Synchronize approved sources', 'The sustainability, production and energy systems return a signed source bundle.', () => { setUploadedFile('Connected Q3 source bundle'); setIntakeStatus('done'); setActiveStage(1); });
      await clickThrough('approve-mappings', 5, customerHigh, 'Confirm the canonical record', 'The customer verifies that connected fields map to the correct Category 10 record.', () => { setMappingAccepted(true); setActiveStage(2); });
      await clickThrough('tab-trust', 6, customerHigh, 'Review privacy and validation', 'The customer can see every quality gate and choose how sensitive data is protected.', () => setActiveTab('trust'));
      await clickThrough('run-checks', 7, customerHigh, 'Run the validation gates', 'Automated tests isolate one allocation judgment for explicit approval.', () => { setValidationStatus('review'); setActiveStage(2); });
      await clickThrough('approve-allocation', 8, customerHigh, 'Confirm the customer allocation', 'The 24% cleanroom allocation is accepted and preserved in the audit history.', () => { setValidationStatus('passed'); setActiveStage(3); });
      await clickThrough('privacy-compute', 9, customerHigh, 'Choose confidential compute', 'Sensitive source data is processed inside attested code; only the approved result leaves.', () => { setPrivacyMethod('compute'); setActiveStage(4); });
      await clickThrough('tab-report', 10, customerHigh, 'Open My reports', 'The customer receives a reusable product-footprint package and submission receipt.', () => setActiveTab('report'));
      await clickThrough('region-us', 11, customerHigh, 'Apply the US regional control', 'US factors and the US evidence vault are attached to this submission.', () => setRegion('us'));
      await clickThrough('generate-report', 12, customerHigh, 'Generate customer outputs', 'The portal creates a PACT-style footprint file plus the governed inventory record.', () => { setReportReady(true); setActiveStage(5); setDemoComplete(true); });

      const hoyaHigh = '2/4 · HOYA · High maturity';
      await clickThrough('switch-workspace', 13, hoyaHigh, 'Return to the SSO gateway', 'The customer workspace closes before the HOYA role signs in.', () => { setPortalRole(null); setNotice(''); });
      await clickThrough('signin-hoya', 14, hoyaHigh, 'Sign in to the HOYA control room', 'HOYA SSO opens portfolio oversight, assurance and reporting controls.', () => prepareChapter('hoya', 'high'));
      await clickThrough('journey-high', 15, hoyaHigh, 'Review the API lane', 'HOYA sees the high-maturity route and its primary-data quality indicators.', () => setTier('high'));
      await clickThrough('tab-collect', 16, hoyaHigh, 'Monitor the intake', 'HOYA verifies source connectivity and mapping status without requesting unnecessary raw data.', () => { setActiveTab('collect'); setUploadedFile('Connected Q3 source bundle'); setIntakeStatus('done'); setMappingAccepted(true); setActiveStage(2); });
      await clickThrough('tab-trust', 17, hoyaHigh, 'Open the assurance desk', 'HOYA reviews exceptions, evidence strength and the selected confidentiality route.', () => { setActiveTab('trust'); setValidationStatus('passed'); });
      await clickThrough('privacy-compute', 18, hoyaHigh, 'Confirm confidential compute', 'HOYA records the approved protection mechanism without gaining access to customer raw data.', () => { setPrivacyMethod('compute'); setActiveStage(4); });
      await clickThrough('tab-report', 19, hoyaHigh, 'Open HOYA reporting', 'The control room prepares consolidated Category 10 outputs from the approved ledger.', () => setActiveTab('report'));
      await clickThrough('region-us', 20, hoyaHigh, 'Confirm the US control set', 'The factor source, residence policy and regulatory driver remain visible to HOYA.', () => setRegion('us'));
      await clickThrough('generate-report', 21, hoyaHigh, 'Generate the HOYA inventory', 'The same record produces the HOYA inventory and the customer value pack.', () => { setReportReady(true); setActiveStage(5); setDemoComplete(true); });

      const customerMedium = '3/4 · Customer · Medium / Low maturity';
      await clickThrough('switch-workspace', 22, customerMedium, 'Return to the SSO gateway', 'The tour now repeats the customer journey for an assisted-data organization.', () => { setPortalRole(null); setNotice(''); });
      await clickThrough('signin-customer', 23, customerMedium, 'Sign in as the customer', 'The Customer workspace keeps the task simple even when source data is fragmented.', () => prepareChapter('customer', 'assisted'));
      await clickThrough('journey-assisted', 24, customerMedium, 'Choose the assisted journey', 'Existing spreadsheets and PDFs can be used; the system suggests mappings and visible proxies.', () => setTier('assisted'));
      await clickThrough('tab-collect', 25, customerMedium, 'Open Data submission', 'The guided intake avoids manual re-entry and preserves each source document.', () => setActiveTab('collect'));
      await clickThrough('process-intake', 26, customerMedium, 'Load the customer dataset', 'The workbook is classified, mapped and linked to its evidence envelope.', () => { setUploadedFile('HOYA_sample_Q3.xlsx'); setIntakeStatus('done'); setActiveStage(1); });
      await clickThrough('approve-mappings', 27, customerMedium, 'Approve suggested mappings', 'The customer confirms AI suggestions and sees where a governed proxy is used.', () => { setMappingAccepted(true); setActiveStage(2); });
      await clickThrough('tab-trust', 28, customerMedium, 'Open Privacy & review', 'The interface explains every check in plain language before approval.', () => setActiveTab('trust'));
      await clickThrough('run-checks', 29, customerMedium, 'Run the validation gates', 'Technical checks pass; the allocation decision remains a named human responsibility.', () => { setValidationStatus('review'); setActiveStage(2); });
      await clickThrough('approve-allocation', 30, customerMedium, 'Approve the allocation', 'The correction history and the customer decision stay attached to the record.', () => { setValidationStatus('passed'); setActiveStage(3); });
      await clickThrough('privacy-verifier', 31, customerMedium, 'Choose verifier-mediated assurance', 'A trusted third party can review fragmented evidence and sign the resulting aggregate.', () => { setPrivacyMethod('verifier'); setActiveStage(4); });
      await clickThrough('tab-report', 32, customerMedium, 'Open My reports', 'The customer gets a useful footprint result, not just a data request.', () => setActiveTab('report'));
      await clickThrough('region-kr', 33, customerMedium, 'Apply the Korea regional control', 'The submission uses KEA/EG-TIPS factors, a Seoul vault and PIPA-aware transfer controls.', () => setRegion('kr'));
      await clickThrough('generate-report', 34, customerMedium, 'Generate the assisted-route package', 'Quality indicators make measured, hybrid and estimated values transparent.', () => { setReportReady(true); setActiveStage(5); setDemoComplete(true); });

      const hoyaMedium = '4/4 · HOYA · Medium / Low maturity';
      await clickThrough('switch-workspace', 35, hoyaMedium, 'Return to the SSO gateway', 'The final chapter shows how HOYA manages the same assisted submission.', () => { setPortalRole(null); setNotice(''); });
      await clickThrough('signin-hoya', 36, hoyaMedium, 'Sign in as HOYA', 'The HOYA control room separates method ownership and assurance from customer submission.', () => prepareChapter('hoya', 'assisted'));
      await clickThrough('journey-assisted', 37, hoyaMedium, 'Review the assisted lane', 'HOYA sees lower primary-data coverage and the controlled proxy ladder.', () => setTier('assisted'));
      await clickThrough('tab-collect', 38, hoyaMedium, 'Monitor customer intake', 'HOYA can see evidence and mapping status while the customer retains ownership of corrections.', () => { setActiveTab('collect'); setUploadedFile('HOYA_sample_Q3.xlsx'); setIntakeStatus('done'); setMappingAccepted(true); setActiveStage(2); });
      await clickThrough('tab-trust', 39, hoyaMedium, 'Open the assurance desk', 'HOYA evaluates quality, allocation and privacy as separate control decisions.', () => { setActiveTab('trust'); setValidationStatus('passed'); });
      await clickThrough('privacy-verifier', 40, hoyaMedium, 'Confirm verifier-mediated assurance', 'The selected mechanism supports external assurance without exposing all raw evidence to HOYA.', () => { setPrivacyMethod('verifier'); setActiveStage(4); });
      await clickThrough('tab-report', 41, hoyaMedium, 'Open Reporting', 'The approved assisted-route record joins the same global ledger as API submissions.', () => setActiveTab('report'));
      await clickThrough('region-tw', 42, hoyaMedium, 'Apply the Taiwan regional control', 'MOENV factors and the Taiwan vault are applied without changing the global data model.', () => setRegion('tw'));
      await clickThrough('generate-report', 43, hoyaMedium, 'Complete the HOYA package', 'HOYA receives an assurance-ready inventory and the customer receives a reusable footprint file.', () => { setReportReady(true); setActiveStage(5); setDemoComplete(true); }, 1000);
      clearTourFocus();
      setTourCue({ visible: true, step: TOUR_TOTAL, chapter: 'All four role and maturity journeys', title: 'Walkthrough complete', body: 'Customer and HOYA interfaces are separated, while both maturity routes feed the same governed ledger.' });
      setNotice('Guided demo complete: all customer, HOYA and maturity journeys finished.');
      await pause(1500);
    } catch (error) {
      if (tourRunRef.current === runId) setNotice(error instanceof Error && error.message.startsWith('Missing tour target') ? 'The tour could not find one interface step. Please restart it.' : 'Guided demo stopped.');
    } finally {
      if (tourRunRef.current === runId) {
        clearTourFocus();
        setIsRunning(false);
        setTourCursor((current) => ({ ...current, visible: false, clicking: false }));
        setTourCue((current) => ({ ...current, visible: false }));
      }
    }
  };

  const processIntake = async (fileName: string) => {
    setUploadedFile(fileName); setIntakeStatus('working'); setNotice(`Reading ${fileName}…`);
    await pause(750);
    setIntakeStatus('done'); setActiveStage(1); setNotice(`${fileName} mapped to 4 canonical fields.`);
  };

  const runValidation = async () => {
    setValidationStatus('running'); setNotice('Running six quality and evidence checks…');
    await pause(850);
    setValidationStatus('review'); setActiveStage(2); setNotice('Five checks passed. One allocation decision needs approval.');
  };

  const approveBoundary = () => {
    setValidationStatus('passed'); setActiveStage(3); setNotice('Allocation approved. Submission is ready for privacy protection.');
  };

  const generateReport = async () => {
    setNotice('Packaging the HOYA inventory and customer footprint…');
    await pause(650);
    setReportReady(true); setActiveStage(5); setDemoComplete(true);
    setNotice('Report package generated. Both downloads are ready.');
  };

  const downloadArtifact = (kind: 'csv' | 'json') => {
    const csv = 'record_id,region,tier,category10_tco2e,coverage,quality_status\nHOYA-Q3-014,' + regionInfo.name + ',' + tier + ',412,84%,approved\n';
    const json = JSON.stringify({ recordId: 'HOYA-Q3-014', region: regionInfo.name, productCarbonFootprintKg: 12.8, unit: 'kgCO2e/blank', pactVersion: '3.0.3', quality: 'approved' }, null, 2);
    const blob = new Blob([kind === 'csv' ? csv : json], { type: kind === 'csv' ? 'text/csv' : 'application/json' });
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = kind === 'csv' ? 'hoya-category10-inventory.csv' : 'customer-pact-footprint.json';
    link.click(); URL.revokeObjectURL(url); setNotice(`${link.download} downloaded.`);
  };

  const tourOverlay = <>
    {tourCursor.visible && <div className={`guided-cursor ${tourCursor.clicking ? 'clicking' : ''}`} style={{ transform: `translate3d(${tourCursor.x}px, ${tourCursor.y}px, 0)` }} aria-hidden="true"><MousePointer2 /><span /></div>}
    {tourCue.visible && <aside className="guided-caption" aria-live="polite"><div className="caption-progress"><span>{tourCue.chapter}</span><b>{tourCue.step}/{TOUR_TOTAL}</b></div><h2>{tourCue.title}</h2><p>{tourCue.body}</p><button type="button" onClick={stopDemoTour}><Square />Stop tour</button></aside>}
  </>;

  if (!portalRole) {
    return (
      <main className="sso-shell">
        <header className="sso-brand"><div className="brand-mark"><Layers3 /></div><div><strong>HOYA</strong><span>CarbonLink</span></div><Badge className="beta-badge">DEMO</Badge></header>
        <section className="sso-card" aria-labelledby="sso-title">
          <div className="sso-copy"><span>SECURE WORKSPACE ACCESS</span><h1 id="sso-title">Choose your SSO workspace</h1><p>Customer submissions and HOYA oversight are kept in clearly separated interfaces. This public prototype simulates the role handoff; production access would be assigned by the organization’s identity provider.</p></div>
          <div className="sso-options">
            <button type="button" className="sso-option customer" data-tour="signin-customer" onClick={() => enterWorkspace('customer')}><div className="sso-icon"><UserRound /></div><div><span>CUSTOMER SSO</span><h2>Customer workspace</h2><p>Submit activity data, approve mappings, select confidentiality and download the reusable footprint package.</p><b>Continue as customer <ArrowRight /></b></div></button>
            <button type="button" className="sso-option hoya" data-tour="signin-hoya" onClick={() => enterWorkspace('hoya')}><div className="sso-icon"><Building2 /></div><div><span>HOYA SSO</span><h2>HOYA control room</h2><p>Monitor portfolio coverage, govern methods, resolve assurance exceptions and generate Category 10 reporting.</p><b>Continue as HOYA <ArrowRight /></b></div></button>
          </div>
          <div className="sso-demo"><div><Play /><span><b>Want the complete story?</b> Watch all four customer and HOYA journeys with the animated cursor.</span></div><Button onClick={isRunning ? stopDemoTour : runDemo}>{isRunning ? <Square data-icon="inline-start" /> : <Play data-icon="inline-start" />}{isRunning ? 'Stop guided demo' : 'Run full guided demo'}</Button></div>
        </section>
        <footer className="sso-foot"><ShieldCheck />Role separation · Regional evidence controls · Versioned audit trail</footer>
        {tourOverlay}
      </main>
    );
  }

  const isCustomer = portalRole === 'customer';

  return (
    <main className="portal-shell">
      <header className="topbar">
        <div className="brand-lockup"><div className="brand-mark"><Layers3 /></div><div><strong>HOYA</strong><span>CarbonLink</span></div><Badge className={`workspace-badge ${portalRole}`}>{isCustomer ? <UserRound /> : <Building2 />}{isCustomer ? 'Customer workspace' : 'HOYA control room'}</Badge></div>
        <div className="topbar-actions">
          <div className="live-status"><span /> Architecture simulation</div>
          <NativeSelect value={region} onChange={(event) => setRegion(event.target.value as Region)} aria-label="Deployment region">
            <NativeSelectOption value="us">United States</NativeSelectOption><NativeSelectOption value="kr">Republic of Korea</NativeSelectOption><NativeSelectOption value="tw">Taiwan</NativeSelectOption>
          </NativeSelect>
          <Button className="run-button" onClick={isRunning ? stopDemoTour : runDemo}>{isRunning ? <Square data-icon="inline-start" /> : demoComplete ? <RefreshCcw data-icon="inline-start" /> : <Play data-icon="inline-start" />}{isRunning ? 'Stop guided demo' : demoComplete ? 'Replay guided demo' : 'Run full demo'}</Button>
          <Button variant="outline" className="switch-workspace" data-tour="switch-workspace" onClick={() => { setPortalRole(null); setNotice(''); }}><LogOut data-icon="inline-start" />Switch workspace</Button>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical" className="portal-tabs">
        <aside className="sidebar">
          <div className={`scope-block role-${portalRole}`}><span>{isCustomer ? 'CUSTOMER WORKSPACE' : 'HOYA PROGRAM'}</span><strong>{isCustomer ? 'My Category 10' : 'Category 10'}</strong><small>{isCustomer ? 'Submit · protect · reuse' : 'Portfolio · assure · report'}</small></div>
          <TabsList orientation="vertical" variant="line" className="nav-list">
            <TabsTrigger value="overview" data-tour="tab-overview"><CircleGauge />{isCustomer ? 'My submission' : 'Portfolio'}</TabsTrigger><TabsTrigger value="collect" data-tour="tab-collect"><UploadCloud />{isCustomer ? 'Data submission' : 'Intake monitor'}</TabsTrigger><TabsTrigger value="trust" data-tour="tab-trust"><ShieldCheck />{isCustomer ? 'Privacy & review' : 'Assurance desk'}</TabsTrigger><TabsTrigger value="report" data-tour="tab-report"><BarChart3 />{isCustomer ? 'My reports' : 'Reporting'}</TabsTrigger>
          </TabsList>
          <div className="sidebar-foot"><div className="mini-shield"><LockKeyhole /></div><div><b>Privacy by design</b><span>Raw evidence stays regional</span></div></div>
        </aside>

        <div className="content-shell">
          {notice && <div className="portal-notice" role="status"><CheckCircle2 /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification">×</button></div>}
          <TabsContent value="overview" className="content-panel">
            <section className="page-heading"><div><span className="eyebrow">{isCustomer ? 'CUSTOMER SUBMISSION WORKSPACE' : 'HOYA PROGRAM CONTROL ROOM'}</span><h1>{isCustomer ? 'My Category 10 submission' : 'Category 10 portfolio'}</h1><p>{isCustomer ? 'Review your submission status and complete the required actions.' : 'Review customer coverage, data quality, exceptions and regional status.'}</p></div><div className="region-card"><Globe2 /><div><span>{isCustomer ? 'Submission region' : 'Portfolio region'}</span><b>{regionInfo.name}</b><small>{regionInfo.residence}</small></div></div></section>
            <section className="metrics-grid">{isCustomer ? <><Metric label="Submission coverage" value="84%" note="required fields complete" tone="purple" /><Metric label="Primary data share" value={tierData.primary} note="measured + digital records" tone="lime" /><Metric label="Quality score" value={tierData.quality} note="current submission" tone="blue" /><Metric label="Estimated effort" value={tierData.effort} note="to finish this cycle" tone="coral" /></> : <><Metric label="Volume coverage" value="84%" note="of sold blanks mapped" tone="purple" /><Metric label="Customers onboarded" value="18" note="12 API · 6 assisted" tone="lime" /><Metric label="Approved quality" value="92%" note="weighted portfolio score" tone="blue" /><Metric label="Open reviews" value="3" note="allocation exceptions" tone="coral" /></>}</section>
            <section className="journey-layout">
              <div className="journey-panel panel">
                <div className="section-title"><div><span>{isCustomer ? 'MY DATA ROUTE' : 'CUSTOMER MATURITY VIEW'}</span><h2>{isCustomer ? 'How will you submit data?' : 'Filter by customer capability'}</h2></div><Badge variant="outline">{isCustomer ? 'Current cycle' : '18 customers'}</Badge></div>
                <div className="journey-stack"><JourneyCard tier="high" selected={tier === 'high'} onClick={() => setTier('high')} /><JourneyCard tier="assisted" selected={tier === 'assisted'} onClick={() => setTier('assisted')} /></div>
                <div className="route-detail"><div><Database /><span>Collection route</span><b>{tierData.route}</b></div><div><KeyRound /><span>Privacy route</span><b>{tierData.privacy}</b></div><div><FileCheck2 /><span>Evidence grade</span><b>{tierData.evidence}</b></div></div>
              </div>
              <div className="process-panel panel">
                <div className="section-title"><div><span>PROCESS HOTSPOTS</span><h2>{isCustomer ? 'My emissions profile' : 'Selected portfolio profile'}</h2></div><Badge className="quality-badge">92% quality</Badge></div>
                <div className="donut-wrap"><div className="donut"><div><strong>412</strong><span>tCO₂e</span></div></div><div className="process-legend">{processData.map((item) => <div key={item.id}><span className="legend-dot" style={{ background: item.color }} /><b>{item.label}</b><em>{item.value}%</em><small>{item.detail}</small></div>)}</div></div>
              </div>
            </section>
            <section className="flow-panel panel"><div className="section-title"><div><span>END-TO-END AUTOMATION</span><h2>From source record to approved ledger</h2></div><div className="flow-state">{demoComplete ? <><CheckCircle2 />Approved</> : <>Stage {Math.min(activeStage + 1, 5)} of 5</>}</div></div><Pipeline active={activeStage} /></section>
          </TabsContent>

          <TabsContent value="collect" className="content-panel">
            <section className="page-heading compact"><div><span className="eyebrow">{isCustomer ? 'DATA SUBMISSION' : 'INTAKE MONITOR'}</span><h1>{isCustomer ? 'Submit data without re-keying' : 'Monitor incoming customer data'}</h1><p>{isCustomer ? 'HOYA sales details are prefilled; add only the activity data needed for the calculation.' : 'Review source connectivity, mapping confidence and evidence status across the selected journey.'}</p></div><Badge className="secure-badge"><LockKeyhole />Encrypted workspace</Badge></section>
            <section className="collection-grid">
              <div className="panel intake-card">
                <div className="intake-top"><div className="large-icon"><CloudCog /></div><div><span>{isCustomer ? 'CURRENT ROUTE' : 'RECEIVED ROUTE'}</span><h2>{tierData.route}</h2><p>{isCustomer ? (tier === 'high' ? 'Send the approved aggregate and evidence metadata from connected systems.' : 'Upload existing records and review the proposed fields, units and process mappings.') : (tier === 'high' ? 'Monitor signed API submissions and source-system status.' : 'Review uploaded records, mapping confidence and disclosed proxy use.')}</p></div></div>
                <div className="intake-actions">
                  <Button data-tour="process-intake" onClick={() => processIntake(tier === 'high' ? 'Connected Q3 source bundle' : 'HOYA_sample_Q3.xlsx')} disabled={intakeStatus === 'working'}>{intakeStatus === 'working' ? <LoaderCircle className="spin" data-icon="inline-start" /> : isCustomer ? (tier === 'high' ? <RefreshCcw data-icon="inline-start" /> : <FileSpreadsheet data-icon="inline-start" />) : <FileCheck2 data-icon="inline-start" />}{intakeStatus === 'working' ? 'Processing…' : isCustomer ? (tier === 'high' ? 'Sync connected sources' : 'Load sample dataset') : 'Review received bundle'}</Button>
                  {isCustomer && <label className="file-picker"><UploadCloud /><span>Choose customer file</span><input type="file" accept=".csv,.xlsx,.xls,.pdf,.json" onChange={(event) => { const file = event.target.files?.[0]; if (file) void processIntake(file.name); }} /></label>}
                </div>
                {uploadedFile && <div className={`intake-result ${intakeStatus}`}><FileCheck2 /><div><b>{uploadedFile}</b><span>{intakeStatus === 'done' ? '4 fields mapped · evidence linked · ready for review' : 'Decrypting and classifying locally…'}</span></div><Badge variant="outline">{intakeStatus === 'done' ? 'Ready' : 'Working'}</Badge></div>}
                <div className="source-list">{(tier === 'high' ? [['Sustainability platform','Connected','OAuth 2.0'],['MES production record','Connected','Signed payload'],['EMS energy record','Ready','Quarterly pull']] : [['Utility statement_Q2.pdf','Mapped','97% confidence'],['Waste_manifest_June.xlsx','Mapped','91% confidence'],['Refrigerant log','Missing','Proxy suggested']]).map(([name,status,meta]) => <div key={name}><div className="file-icon"><FileCheck2 /></div><div><b>{name}</b><span>{meta}</span></div><Badge variant={status === 'Missing' ? 'destructive' : 'outline'}>{status}</Badge></div>)}</div>
              </div>
              <div className="panel mapping-card">
                <div className="section-title"><div><span>CANONICAL RECORD</span><h2>{isCustomer ? 'Review suggested mappings' : 'Mapping exception review'}</h2></div><Sparkles /></div>
                <div className="mapping-rows">{[['Tool energy','e_beam_electricity_kwh','98%'],['Output share','hoya_allocation_percent','94%'],['Facility country','geography_country','100%'],['Coolant top-up','refrigerant_leakage_kg','72%']].map(([source,target,confidence]) => <div key={source}><span>{source}</span><ArrowRight /><code>{target}</code><b>{confidence}</b></div>)}</div>
                <div className="mapping-note"><Sparkles /><p>AI suggests the mapping. Deterministic rules and a reviewer control material or low-confidence decisions.</p></div>
                <Button data-tour="approve-mappings" variant={mappingAccepted ? 'secondary' : 'default'} className="panel-action" onClick={() => { setMappingAccepted(true); setActiveStage(2); setNotice(isCustomer ? 'Four mappings accepted and sent to validation.' : 'Mapping exception approved and added to the review queue.'); }} disabled={intakeStatus !== 'done' || mappingAccepted}>{mappingAccepted ? <Check data-icon="inline-start" /> : <ArrowRight data-icon="inline-start" />}{mappingAccepted ? 'Mappings approved' : isCustomer ? 'Approve suggested mappings' : 'Approve mapping exception'}</Button>
              </div>
            </section>
            <section className="panel proxy-panel"><div><span className="eyebrow">MISSING-DATA FALLBACK</span><h2>Visible proxy, not a hidden assumption</h2><p>The customer can accept, correct or dispute each estimate. Every correction creates a successor record.</p></div><div className="proxy-steps">{['Own history','Peer process + region','Engineering model','Industry average'].map((step,i) => <div key={step}><span>{i + 1}</span><b>{step}</b>{i < 3 && <ChevronRight />}</div>)}</div></section>
          </TabsContent>

          <TabsContent value="trust" className="content-panel">
            <section className="page-heading compact"><div><span className="eyebrow">{isCustomer ? 'PRIVACY & REVIEW' : 'ASSURANCE DESK'}</span><h1>{isCustomer ? 'Understand every check and privacy choice' : 'Six gates, four privacy routes'}</h1><p>{isCustomer ? 'Confirm the calculation, resolve exceptions and choose how confidential data is protected.' : 'Calculation integrity, evidence authenticity and assurance are checked separately.'}</p></div><Badge className="secure-badge"><Fingerprint />Evidence-linked</Badge></section>
            <section className="trust-grid">
              <div className="panel validation-panel"><div className="section-title"><div><span>QUALITY GATES</span><h2>{isCustomer ? 'My submission checks' : 'Submission assurance'}</h2></div><Badge className={validationStatus === 'passed' ? 'quality-badge' : 'review-badge'}>{validationStatus === 'passed' ? '6 passed' : validationStatus === 'running' ? 'Checking' : '1 review'}</Badge></div><div className="validation-table">{validationRows.map(([gate,baseStatus,detail],index) => { const status = validationStatus === 'passed' ? 'Pass' : validationStatus === 'running' ? 'Queued' : validationStatus === 'review' ? (index === 2 ? 'Review' : 'Pass') : baseStatus; return <div key={gate}><span className={`gate-num status-${status.toLowerCase()}`}>{index + 1}</span><div><b>{gate}</b><small>{detail}</small></div><Badge variant={status === 'Pass' ? 'outline' : status === 'Review' ? 'destructive' : 'secondary'}>{status}</Badge></div>; })}</div><div className="validation-actions"><Button data-tour="run-checks" onClick={runValidation} disabled={validationStatus === 'running' || validationStatus === 'passed'}>{validationStatus === 'running' ? <LoaderCircle className="spin" data-icon="inline-start" /> : <ScanLine data-icon="inline-start" />}{validationStatus === 'running' ? 'Running checks…' : isCustomer ? 'Run submission checks' : 'Run assurance checks'}</Button>{validationStatus === 'review' && <Button data-tour="approve-allocation" variant="outline" onClick={approveBoundary}><Check data-icon="inline-start" />{isCustomer ? 'Accept 24% allocation' : 'Approve 24% allocation'}</Button>}</div></div>
              <div className="panel quality-panel"><div className="section-title"><div><span>DATA QUALITY</span><h2>Not just “primary vs estimate”</h2></div></div>{[['Primary-data share',tier === 'high' ? 88 : 41],['Technological match',92],['Geographical match',region === 'tw' ? 100 : 96],['Temporal freshness',84],['Evidence strength',tier === 'high' ? 94 : 62]].map(([label,value]) => <Progress key={label as string} value={value as number} className="quality-progress"><ProgressLabel>{label}</ProgressLabel><ProgressValue>{value}%</ProgressValue></Progress>)}</div>
            </section>
            <section className="panel privacy-panel"><div className="section-title"><div><span>{isCustomer ? 'CONFIDENTIALITY CHOICE' : 'CONFIDENTIALITY CONTROL'}</span><h2>{isCustomer ? 'Choose how your sensitive data is protected' : 'Review and approve the customer-selected method'}</h2></div><Badge variant="outline">Selected: {privacyMethods.find((method) => method.id === privacyMethod)?.title}</Badge></div><div className="privacy-grid">{privacyMethods.map(({ id, icon: Icon, title, tag, copy }) => <button type="button" key={id} className={`privacy-option ${privacyMethod === id ? 'selected' : ''}`} aria-pressed={privacyMethod === id} data-tour={`privacy-${id}`} onClick={() => { setPrivacyMethod(id); setActiveStage(4); setNotice(`${title} ${isCustomer ? 'selected' : 'approved'} for this submission.`); }}><Icon /><Badge variant="outline">{tag}</Badge><h3>{title}</h3><p>{copy}</p><span className="privacy-choice">{privacyMethod === id ? <><Check />{isCustomer ? 'Selected' : 'Approved'}</> : isCustomer ? 'Choose method' : 'Approve method'}</span></button>)}</div></section>
          </TabsContent>

          <TabsContent value="report" className="content-panel">
            <section className="page-heading compact"><div><span className="eyebrow">{isCustomer ? 'MY REPORTS' : 'HOYA REPORTING'}</span><h1>{isCustomer ? 'Product footprint and submission receipt' : 'Category 10 inventory'}</h1><p>{isCustomer ? 'Review and download the results released to your organization.' : 'Review coverage, data quality and the assurance package for the selected portfolio.'}</p></div><Badge className="quality-badge"><Check />{isCustomer ? 'Customer release' : 'Assurance ready'}</Badge></section>
            <section className="report-grid single">
              {isCustomer ? <div className="panel report-card customer-report"><div className="report-label"><div className="report-icon"><Users /></div><div><span>MY PRODUCT FOOTPRINT</span><h2>HOYA blank PCF</h2></div></div><div className="pcf-card"><span>Released result</span><strong>12.8 <small>kgCO₂e / blank</small></strong><Badge>PACT payload</Badge></div><div className="report-points"><p><Zap />Top improvement: e-beam idle load</p><p><FileCheck2 />Submission receipt and quality badge</p><p><Workflow />Category 1-ready product footprint</p><p><Activity />Privacy-safe peer benchmark</p></div>{reportReady && <Button variant="outline" className="download-button" onClick={() => downloadArtifact('json')}><Download data-icon="inline-start" />Download my PACT JSON</Button>}</div> : <div className="panel report-card hoya-report"><div className="report-label"><div className="report-icon"><BarChart3 /></div><div><span>HOYA INVENTORY</span><h2>Category 10 portfolio</h2></div></div><div className="stacked-bar" aria-label="84 percent covered"><span style={{ width: '54%' }} /><span style={{ width: '30%' }} /><span style={{ width: '16%' }} /></div><div className="bar-key"><span><i className="measured" />Measured 54%</span><span><i className="hybrid" />Hybrid 30%</span><span><i className="estimated" />Estimated 16%</span></div><div className="report-points"><p><CheckCircle2 />Reconciled to sold quantities</p><p><CheckCircle2 />Methods and factors versioned</p><p><CheckCircle2 />Restatements preserved</p><p><CheckCircle2 />Assurance evidence packaged</p></div>{reportReady && <Button variant="outline" className="download-button" onClick={() => downloadArtifact('csv')}><Download data-icon="inline-start" />Download inventory CSV</Button>}</div>}
            </section>
            <section className="report-actions panel"><div><span className="eyebrow">{isCustomer ? 'CUSTOMER RELEASE' : 'INVENTORY RUN'}</span><h2>{reportReady ? (isCustomer ? 'Your report is ready' : 'Inventory package is ready') : (isCustomer ? 'Generate my footprint package' : 'Generate inventory package')}</h2><p>{reportReady ? (isCustomer ? 'Your footprint, quality status and submission receipt are available above.' : 'The inventory totals, method versions and assurance evidence are available above.') : (isCustomer ? 'Creates the customer-visible footprint and submission receipt.' : 'Creates the HOYA inventory and assurance package for the selected portfolio.')}</p></div><Button data-tour="generate-report" onClick={generateReport} disabled={reportReady}>{reportReady ? <Check data-icon="inline-start" /> : <BarChart3 data-icon="inline-start" />}{reportReady ? 'Generated' : isCustomer ? 'Generate my report' : 'Generate inventory'}</Button></section>
            <section className="panel regional-panel"><div className="region-orbit"><Globe2 /><span>{isCustomer ? 'DATA RESIDENCY' : 'REGIONAL CONTROL'}</span></div>{Object.entries(regions).map(([key,item]) => <button key={key} data-tour={`region-${key}`} className={region === key ? 'active' : ''} onClick={() => setRegion(key as Region)}><span>{key.toUpperCase()}</span><b>{item.name}</b><small>{isCustomer ? item.residence : item.factor}</small><em>{isCustomer ? 'Evidence stored in-region' : item.driver}</em></button>)}</section>
          </TabsContent>
        </div>
      </Tabs>
      {tourOverlay}
    </main>
  );
}
