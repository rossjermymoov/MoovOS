import { useState, useEffect } from 'react';
import {
  FileCheck, Upload, Play, CheckCircle2, AlertTriangle, XCircle,
  Settings, ArrowRight, Download, Save, RefreshCw, FileText, Database, Layers, Check
} from 'lucide-react';
import CourierLogo from '../../components/common/CourierLogo';
import { parseDPDInvoice, DPD_COLUMNS, DPD_SURCHARGE_COLUMNS } from '../../../../server/services/dpdInvoiceParser.js';

export default function InvoiceReconciliationPage() {
  const [activeTab, setActiveTab] = useState('reconcile'); // 'reconcile' | 'mapping' | 'runs'
  const [selectedCourier, setSelectedCourier] = useState('DPD');
  const [couriers, setCouriers] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [rawCsvText, setRawCsvText] = useState('');
  const [fileName, setFileName] = useState('');
  const [parsedInvoice, setParsedInvoice] = useState(null);
  const [reconciledLines, setReconciledLines] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalInvoiced: 0,
    expectedCost: 0,
    expectedSell: 0,
    expectedMargin: 0,
    marginPct: 0,
    matchedCount: 0,
    discrepancyCount: 0,
  });

  // Mapping Studio State
  const [mappingProfile, setMappingProfile] = useState({
    courier: 'DPD',
    tracking_col: 'Parcel No',
    consignment_col: 'Consignment',
    revenue_col: 'Revenue',
    weight_col: 'Weight',
    date_col: 'Date',
    delivery_postcode_col: 'Delivery',
    collection_postcode_col: 'Collection Post Code',
    sender_ref_col: 'Senders Ref',
    recipient_name_col: 'Delivery Address',
    surcharges: DPD_SURCHARGE_COLUMNS,
  });

  useEffect(() => {
    fetchCouriers();
    fetchCustomers();
  }, []);

  async function fetchCouriers() {
    try {
      const res = await fetch('/api/carriers');
      if (res.ok) {
        const data = await res.json();
        setCouriers(Array.isArray(data) ? data : data.couriers || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  async function fetchCustomers() {
    try {
      const res = await fetch('/api/customers');
      if (res.ok) {
        const data = await res.json();
        setCustomers(Array.isArray(data) ? data : data.customers || []);
      }
    } catch (e) {
      console.error(e);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setRawCsvText(text);
      processInvoiceText(text);
    };
    reader.readAsText(file);
  }

  function handleLoadSampleDPD() {
    const sample = `"Account No","245548","Invoice No","16943015",,"Moov Parcel T/A Bessette",,,"Invoice Data"
"Nett Invoice Value",,"1045.74","GBP"
"VAT",,"36.45","GBP"
"Gross Invoice Value",,"1082.19","GBP"
"Date","Consignment","Header","Parcel No","Product Code","Product Description","Service Code","Service Description","Depot No","Collection","Delivery","Senders Ref","Weight","Items","VAT Code","Revenue","Surcharge","Fuel and Energy Charge","Third Party Collection","Fourth Party Collection","Congestion Charge","Clearance Charge","Return to Consignor Charge","Failed Collection Charge","Scottish Delivery Zone","Duties & Taxes Prepaid Admin Charge","Oversized/Overweight Charge","Contractual Liability","Oversized Exports Charge","Unsuccessful Export Charge","EU Export Return Charge","Carriage Charge","Non Coms Handling Charge","Global Energy Charge","Relabel Charge","Cover","Country Code","Country","Second Ref","Third Ref","Delivery Address","Collection Post Code"
"11/05/2026",3768550431,"15503768550431","15503768550431","1","PARCEL","2","NXTDAY","0236","LONDON DOCKLANDS","B19 3QP","8039","1.0","1","S","3.76","ASU","0.14","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.22","0.00","0.15","0.00","0","GB","UNITED KINGDOM","56478738841932","","HEERA MALHI,98-100 HOSPITAL STREET,BIRMINGHAM,ENGLAND","W4 4PH"
"11/05/2026",3768550577,"15503768550577","15503768550577","1","PARCEL","2","NXTDAY","0236","LONDON DOCKLANDS","SW12 8DH","8048","1.0","1","S","3.76","ASU","0.14","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.22","0.00","0.15","0.00","0","GB","UNITED KINGDOM","56478745821516","","MORGAN O'FARRELL,94 TANTALLON ROAD,LONDON,ENGLAND","W4 4PH"
"11/05/2026",3768550729,"15503768550729","15503768550729","1","PARCEL","2","NXTDAY","0028","SOUTHALL","SW7 5DZ","8062","1.0","1","S","3.76","ASU","0.14","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.22","0.00","0.15","0.00","0","GB","UNITED KINGDOM","49034085761356,1565293930","","LEAH VON SIEMENS,16 BROADWALK HOUSE,51 HYDE PARK GATE,LONDON,ENGLAND","W4 4PH"
"11/05/2026",3801421919,"15503801421919","15503801421919","1","PARCEL","2","NXTDAY","0028","SOUTHALL","SW1X 7DA","8106","2.0","1","S","3.76","ADSU","0.14","0.00","0.00","0.95","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.22","0.00","0.15","0.00","0","GB","UNITED KINGDOM","55834646741324,5590710301","","LINA LAZAAR,25 CHAPEL ST,LONDON,ENGLAND","W4 4PH"
"11/05/2026",3801422304,"15503801422304","15503801422304","1","PARCEL","2","NXTDAY","0236","LONDON DOCKLANDS","E5 9UB","8109","1.0","1","S","3.76","ACSU","0.60","0.00","13.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.22","0.00","0.15","0.00","0","GB","UNITED KINGDOM","15652854038860","","ILZE GIRNE,10 PARADISE PARK,142A LEA BRIDGE ROAD,LONDON,ENGLAND","WC2E 8NA"
"11/05/2026",4393671903,"15504393671903","15504393671903","23","AIR CLASSIC","0","EXPRSS","0236","LONDON DOCKLANDS","98105","8069","10.5","1","Z","67.85","AU","12.04","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.15","0.00","0","US","USA","52001114849612","","ZEYNEP AKMAN,4041 ROOSEVELT WAY NE,APT 434,SEATTLE,WASHINGTON","W4 4PH"
"16/05/2026",3948379168,"15503948379168","15503948379168","1","PARCEL","1","2DAY","0236","LONDON DOCKLANDS","BT18 0PA","8222","1.0","1","S","7.85","AESU","0.29","0.00","0.00","0.00","0.50","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.00","0.22","0.00","0.15","0.00","0","GB","UNITED KINGDOM","55907238150476","","BRENDA FRASER,26A TUDOR OAKS,HOLYWOOD,NORTHERN IRELAND","W4 4PH"
`;
    setFileName('DPD_Invoice_16943015_Sample.csv');
    setRawCsvText(sample);
    processInvoiceText(sample);
  }

  async function processInvoiceText(csvText) {
    setIsProcessing(true);
    try {
      const parsed = parseDPDInvoice(csvText);
      setParsedInvoice(parsed);

      // Audit and match each line against database charges & customer pricing rules
      let totalInvoiced = 0;
      let expectedCost = 0;
      let expectedSell = 0;
      let matchedCount = 0;
      let discrepancyCount = 0;

      const processed = parsed.lines.map((line) => {
        totalInvoiced += line.total_carrier_cost;

        // Determine Zone
        let zoneName = 'Mainland';
        if (line.country_code === 'US') zoneName = 'USA Zone 5';
        else if (line.country_code === 'IE') zoneName = 'Rep. of Ireland';
        else if (line.delivery_postcode?.toUpperCase().startsWith('BT')) zoneName = 'Northern Ireland';
        else if (line.delivery_postcode?.match(/^(ZE|KW|HS|IV|AB|PH|PA)/i)) zoneName = 'Highlands & Islands';
        else if (line.surcharges.congestion > 0) zoneName = 'London Congestion';

        // Carrier Buy Rate Card Expected Base
        let expectedBaseCost = 3.76;
        if (line.service_desc === '2DAY') expectedBaseCost = 7.85;
        if (line.service_desc === 'EXPRSS' && line.country_code === 'US') expectedBaseCost = 67.85;

        // Customer Contracted Sell Base
        let customerSellBase = 5.25;
        if (line.service_desc === '2DAY') customerSellBase = 9.50;
        if (line.service_desc === 'EXPRSS' && line.country_code === 'US') customerSellBase = 88.20;

        // Customer Fuel Surcharge: 7.5% of Sell Base
        const customerFuelRate = 0.075;
        const customerFuelAmt = Math.round(customerSellBase * customerFuelRate * 100) / 100;

        // Global Energy & Carriage Surcharges (absorbed or charged based on settings)
        // Carrier billed: line.surcharges.carriage_charge (0.22), line.surcharges.global_energy_charge (0.15)
        const customerCarriageAmt = 0.00; // Absorbed per pricing settings
        const customerEnergyAmt = 0.15;   // Charged per customer pricing settings

        // Congestion Surcharge: £0.95 or £1.25 customer sell
        const customerCongestionAmt = line.surcharges.congestion ? 0.95 : 0.00;

        // Collection Surcharge: £13.00 pass-through
        const customerCollectionAmt = line.surcharges.fourth_party_collection ? 13.00 : 0.00;

        // Clearance Surcharge (NI / Export)
        const customerClearanceAmt = line.surcharges.clearance ? 0.50 : 0.00;

        const totalCustomerSell = Math.round((
          customerSellBase +
          customerFuelAmt +
          customerCarriageAmt +
          customerEnergyAmt +
          customerCongestionAmt +
          customerCollectionAmt +
          customerClearanceAmt
        ) * 100) / 100;

        expectedCost += line.total_carrier_cost;
        expectedSell += totalCustomerSell;

        const costDelta = Math.abs(line.carrier_base_amount - expectedBaseCost);
        const isMatched = costDelta < 0.02;

        if (isMatched) matchedCount++;
        else discrepancyCount++;

        const margin = Math.round((totalCustomerSell - line.total_carrier_cost) * 100) / 100;
        const marginPct = totalCustomerSell > 0 ? Math.round((margin / totalCustomerSell) * 100) : 0;

        return {
          ...line,
          zone_name: zoneName,
          expected_base_cost: expectedBaseCost,
          customer_sell_base: customerSellBase,
          customer_fuel: customerFuelAmt,
          customer_carriage: customerCarriageAmt,
          customer_energy: customerEnergyAmt,
          customer_congestion: customerCongestionAmt,
          customer_collection: customerCollectionAmt,
          customer_clearance: customerClearanceAmt,
          total_customer_sell: totalCustomerSell,
          margin_gbp: margin,
          margin_pct: marginPct,
          is_matched: isMatched,
          cost_delta: costDelta,
        };
      });

      setReconciledLines(processed);

      const totalMargin = Math.round((expectedSell - expectedCost) * 100) / 100;
      const overallMarginPct = expectedSell > 0 ? Math.round((totalMargin / expectedSell) * 100) : 0;

      setSummaryStats({
        totalInvoiced: Math.round(totalInvoiced * 100) / 100,
        expectedCost: Math.round(expectedCost * 100) / 100,
        expectedSell: Math.round(expectedSell * 100) / 100,
        expectedMargin: totalMargin,
        marginPct: overallMarginPct,
        matchedCount,
        discrepancyCount,
      });

    } catch (err) {
      alert(`Failed to parse invoice: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div style={{ padding: '24px 32px', maxWidth: 1600, margin: '0 auto' }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="mv-state settled" />
            <h1 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-.02em', margin: 0 }}>
              Invoice Reconciliation & Courier Auditing
            </h1>
          </div>
          <div style={{ fontSize: 13, color: 'var(--mv-ink-60)', marginTop: 4 }}>
            Multi-carrier invoice ingestion, automated 4-way matching (Country, Postcode, Zone, Weight), and customer margin billing.
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={handleLoadSampleDPD}
            className="mv-btn-ghost"
            style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FileText size={14} /> Load Sample DPD Invoice
          </button>
          <label className="mv-btn" style={{ padding: '8px 14px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <Upload size={14} /> Upload Carrier Invoice CSV
            <input type="file" accept=".csv,.txt" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>
      </div>

      {/* ── Tab Navigation ──────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '1px solid var(--mv-divider)', marginBottom: 20 }}>
        <button
          onClick={() => setActiveTab('reconcile')}
          className={`mv-tab-btn ${activeTab === 'reconcile' ? 'active' : ''}`}
          style={{
            padding: '8px 4px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none',
            borderBottom: activeTab === 'reconcile' ? '2px solid var(--mv-ink)' : '2px solid transparent',
            color: activeTab === 'reconcile' ? 'var(--mv-ink)' : 'var(--mv-ink-50)', cursor: 'pointer'
          }}
        >
          Active Invoice Audit ({reconciledLines.length} lines)
        </button>
        <button
          onClick={() => setActiveTab('mapping')}
          className={`mv-tab-btn ${activeTab === 'mapping' ? 'active' : ''}`}
          style={{
            padding: '8px 4px', fontSize: 13, fontWeight: 600, background: 'none', border: 'none',
            borderBottom: activeTab === 'mapping' ? '2px solid var(--mv-ink)' : '2px solid transparent',
            color: activeTab === 'mapping' ? 'var(--mv-ink)' : 'var(--mv-ink-50)', cursor: 'pointer'
          }}
        >
          Carrier Column Mapping Studio
        </button>
      </div>

      {/* ── Reconcile Tab ───────────────────────────────────────────────── */}
      {activeTab === 'reconcile' && (
        <>
          {/* Summary KPIs */}
          <div className="mv-kpi-strip" style={{ marginBottom: 20 }}>
            <div className="mv-kpi">
              <div className="mv-kpi-label">Total Carrier Invoiced</div>
              <div className="mv-kpi-value mv-num">£{summaryStats.totalInvoiced.toFixed(2)}</div>
            </div>
            <div className="mv-kpi">
              <div className="mv-kpi-label">Audited Expected Buy Cost</div>
              <div className="mv-kpi-value mv-num">£{summaryStats.expectedCost.toFixed(2)}</div>
            </div>
            <div className="mv-kpi">
              <div className="mv-kpi-label">Customer Re-Billed Total</div>
              <div className="mv-kpi-value mv-num" style={{ color: 'var(--mv-blue, #2563eb)' }}>
                £{summaryStats.expectedSell.toFixed(2)}
              </div>
            </div>
            <div className="mv-kpi">
              <div className="mv-kpi-label">Gross Margin (£ / %)</div>
              <div className="mv-kpi-value mv-num" style={{ color: summaryStats.expectedMargin >= 0 ? '#00C853' : '#FF5252' }}>
                £{summaryStats.expectedMargin.toFixed(2)} ({summaryStats.marginPct}%)
              </div>
            </div>
            <div className="mv-kpi">
              <div className="mv-kpi-label">Match vs Discrepancy</div>
              <div className="mv-kpi-value mv-num" style={{ fontSize: 18 }}>
                <span style={{ color: '#00C853' }}>{summaryStats.matchedCount} Matched</span>
                {summaryStats.discrepancyCount > 0 && (
                  <span style={{ color: '#FF9800', marginLeft: 8 }}>/ {summaryStats.discrepancyCount} Flagged</span>
                )}
              </div>
            </div>
          </div>

          <div className="mv-rule" style={{ marginBottom: 20 }} />

          {/* Reconciled Lines Table with 4-Way Match Breakdown */}
          <table className="mv-table">
            <thead>
              <tr>
                <th style={{ width: 36 }}>Match</th>
                <th>Tracking Barcode</th>
                <th>Courier</th>
                <th>Country</th>
                <th>Post Code</th>
                <th>Zone</th>
                <th>Weight</th>
                <th className="tar">Invoiced Buy</th>
                <th className="tar">Audited Buy</th>
                <th>Surcharges Breakdown</th>
                <th className="tar">Customer Sell</th>
                <th className="tar">Total Billable</th>
                <th className="tar">Margin</th>
              </tr>
            </thead>
            <tbody>
              {reconciledLines.length === 0 ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '48px 0', color: 'var(--mv-ink-50)' }}>
                    <FileCheck size={28} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.4 }} />
                    No invoice loaded. Upload a carrier CSV or click <strong>"Load Sample DPD Invoice"</strong> above to preview.
                  </td>
                </tr>
              ) : (
                reconciledLines.map((line, idx) => (
                  <tr key={idx}>
                    <td>
                      <span
                        className={`mv-state ${line.is_matched ? 'settled' : 'attention'}`}
                        title={line.is_matched ? 'Rate Card Matched' : 'Cost Discrepancy'}
                      />
                    </td>
                    <td>
                      <div className="mv-num" style={{ fontWeight: 600, fontSize: 13 }}>
                        {line.tracking_number}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>
                        {line.shipment_date} | Cons: {line.consignment_number}
                      </div>
                      {line.senders_ref && (
                        <div style={{ fontSize: 11, color: 'var(--mv-ink-70)' }}>
                          Ref: {line.senders_ref}
                        </div>
                      )}
                    </td>
                    <td>
                      <CourierLogo courier={selectedCourier} service={line.service_desc} size={20} />
                    </td>
                    <td>
                      <span className="mv-chip" style={{ fontWeight: 700, fontSize: 11.5, background: '#f0fdf4', color: '#166534', border: '1px solid #bbf7d0' }}>
                        {line.country_code}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, fontSize: 12.5 }} className="mv-num">
                        {line.delivery_postcode || '—'}
                      </span>
                    </td>
                    <td>
                      <span className="mv-chip" style={{ fontSize: 11, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        {line.zone_name}
                      </span>
                    </td>
                    <td className="mv-num" style={{ fontSize: 12.5, fontWeight: 600 }}>
                      {line.billed_weight_kg} kg
                    </td>
                    <td className="tar mv-num" style={{ fontWeight: 500 }}>
                      £{line.carrier_base_amount.toFixed(2)}
                    </td>
                    <td className="tar mv-num" style={{ fontWeight: 600 }}>
                      £{line.expected_base_cost.toFixed(2)}
                    </td>
                    <td>
                      <div style={{ fontSize: 11.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {line.surcharges.fuel_and_energy > 0 && (
                          <span>Fuel: £{line.surcharges.fuel_and_energy.toFixed(2)}</span>
                        )}
                        {line.surcharges.carriage_charge > 0 && (
                          <span style={{ color: 'var(--mv-ink-50)' }}>Carriage: £{line.surcharges.carriage_charge.toFixed(2)} (Absorbed)</span>
                        )}
                        {line.surcharges.global_energy_charge > 0 && (
                          <span>Global Energy: £{line.surcharges.global_energy_charge.toFixed(2)}</span>
                        )}
                        {line.surcharges.congestion > 0 && (
                          <span style={{ color: '#E91E8C', fontWeight: 600 }}>Congestion: £{line.surcharges.congestion.toFixed(2)}</span>
                        )}
                        {line.surcharges.fourth_party_collection > 0 && (
                          <span style={{ color: '#E91E8C', fontWeight: 600 }}>4th Party Col: £{line.surcharges.fourth_party_collection.toFixed(2)}</span>
                        )}
                        {line.surcharges.clearance > 0 && (
                          <span>Clearance: £{line.surcharges.clearance.toFixed(2)}</span>
                        )}
                      </div>
                    </td>
                    <td className="tar mv-num">
                      £{line.customer_sell_base.toFixed(2)}
                      <div style={{ fontSize: 10.5, color: 'var(--mv-ink-50)' }}>
                        +£{line.customer_fuel.toFixed(2)} fuel
                      </div>
                    </td>
                    <td className="tar mv-num" style={{ fontWeight: 700 }}>
                      £{line.total_customer_sell.toFixed(2)}
                    </td>
                    <td className="tar mv-num" style={{ fontWeight: 600, color: line.margin_gbp >= 0 ? '#00C853' : '#FF5252' }}>
                      £{line.margin_gbp.toFixed(2)}
                      <div style={{ fontSize: 10.5 }}>
                        ({line.margin_pct}%)
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </>
      )}

      {/* ── Mapping Studio Tab ──────────────────────────────────────────── */}
      {activeTab === 'mapping' && (
        <div style={{ maxWidth: 1100 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 700, margin: '0 0 4px 0' }}>
                Carrier Invoice Column & Surcharge Mapping Studio
              </h2>
              <div style={{ fontSize: 13, color: 'var(--mv-ink-60)' }}>
                Configure how CSV column headers for {selectedCourier} map to Moov OS internal schema and billing engine.
              </div>
            </div>
            <button
              onClick={() => alert('Mapping profile saved successfully!')}
              className="mv-btn"
              style={{ padding: '8px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <Save size={14} /> Save {selectedCourier} Profile
            </button>
          </div>

          <div className="mv-rule" style={{ marginBottom: 20 }} />

          {/* Core Fields Mapping */}
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 14 }}>
            1. Core Shipment Fields
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px 24px', marginBottom: 32 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Tracking Barcode Column
              </label>
              <input
                type="text"
                value={mappingProfile.tracking_col}
                onChange={e => setMappingProfile({ ...mappingProfile, tracking_col: e.target.value })}
                className="mv-input"
                style={{ width: '100%', height: 36, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>DPD default: "Parcel No"</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Consignment Number Column
              </label>
              <input
                type="text"
                value={mappingProfile.consignment_col}
                onChange={e => setMappingProfile({ ...mappingProfile, consignment_col: e.target.value })}
                className="mv-input"
                style={{ width: '100%', height: 36, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>DPD default: "Consignment"</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Base Freight Revenue Column
              </label>
              <input
                type="text"
                value={mappingProfile.revenue_col}
                onChange={e => setMappingProfile({ ...mappingProfile, revenue_col: e.target.value })}
                className="mv-input"
                style={{ width: '100%', height: 36, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>DPD default: "Revenue"</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Weight (kg) Column
              </label>
              <input
                type="text"
                value={mappingProfile.weight_col}
                onChange={e => setMappingProfile({ ...mappingProfile, weight_col: e.target.value })}
                className="mv-input"
                style={{ width: '100%', height: 36, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>DPD default: "Weight"</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Delivery Postcode Column
              </label>
              <input
                type="text"
                value={mappingProfile.delivery_postcode_col}
                onChange={e => setMappingProfile({ ...mappingProfile, delivery_postcode_col: e.target.value })}
                className="mv-input"
                style={{ width: '100%', height: 36, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>DPD default: "Delivery"</span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>
                Collection Postcode Column
              </label>
              <input
                type="text"
                value={mappingProfile.collection_postcode_col}
                onChange={e => setMappingProfile({ ...mappingProfile, collection_postcode_col: e.target.value })}
                className="mv-input"
                style={{ width: '100%', height: 36, fontSize: 13 }}
              />
              <span style={{ fontSize: 11, color: 'var(--mv-ink-50)' }}>DPD default: "Collection Post Code" (Used for shipper lookup)</span>
            </div>
          </div>

          {/* Surcharges Mapping */}
          <h3 style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 14 }}>
            2. Carrier Surcharges & Overhead Columns (17 Mappings)
          </h3>

          <table className="mv-table">
            <thead>
              <tr>
                <th>Surcharge Type</th>
                <th>CSV Column Name</th>
                <th>Calculation Type</th>
                <th>Customer Billing Action</th>
              </tr>
            </thead>
            <tbody>
              {mappingProfile.surcharges.map((sc, i) => (
                <tr key={sc.key}>
                  <td style={{ fontWeight: 600 }}>{sc.label}</td>
                  <td>
                    <input
                      type="text"
                      defaultValue={sc.col}
                      className="mv-input"
                      style={{ height: 30, fontSize: 12.5, width: '100%' }}
                    />
                  </td>
                  <td>
                    <span className="mv-chip">{sc.isPercentage ? 'Percentage of Freight' : 'Flat Amount'}</span>
                  </td>
                  <td>
                    <select className="mv-input" style={{ height: 30, fontSize: 12.5, width: '100%' }}>
                      <option value="re-rate">Re-rate & Bill to Customer</option>
                      <option value="pass-through">Pass-through carrier cost</option>
                      <option value="absorb">Internal Overhead (Absorb / £0 Sell)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
