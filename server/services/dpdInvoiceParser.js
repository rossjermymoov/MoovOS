/**
 * DPD Invoice Parser — Moov OS
 *
 * Dedicated streaming parser for DPD UK carrier invoices.
 * Supports standard 42-column format, preambles (Account/Invoice No, Nett, VAT, Gross),
 * itemized surcharges, collection postcodes, and multi-parcel consignments.
 */

/**
 * Standard DPD Invoice CSV Header Columns (42 columns)
 */
export const DPD_COLUMNS = [
  'Date',
  'Consignment',
  'Header',
  'Parcel No',
  'Product Code',
  'Product Description',
  'Service Code',
  'Service Description',
  'Depot No',
  'Collection',
  'Delivery',
  'Senders Ref',
  'Weight',
  'Items',
  'VAT Code',
  'Revenue',
  'Surcharge',
  'Fuel and Energy Charge',
  'Third Party Collection',
  'Fourth Party Collection',
  'Congestion Charge',
  'Clearance Charge',
  'Return to Consignor Charge',
  'Failed Collection Charge',
  'Scottish Delivery Zone',
  'Duties & Taxes Prepaid Admin Charge',
  'Oversized/Overweight Charge',
  'Contractual Liability',
  'Oversized Exports Charge',
  'Unsuccessful Export Charge',
  'EU Export Return Charge',
  'Carriage Charge',
  'Non Coms Handling Charge',
  'Global Energy Charge',
  'Relabel Charge',
  'Cover',
  'Country Code',
  'Country',
  'Second Ref',
  'Third Ref',
  'Delivery Address',
  'Collection Post Code',
];

/**
 * Surcharge column mapping keys
 */
export const DPD_SURCHARGE_COLUMNS = [
  { key: 'fuel_and_energy', label: 'Fuel and Energy Charge', col: 'Fuel and Energy Charge', isPercentage: true },
  { key: 'congestion', label: 'Congestion Charge', col: 'Congestion Charge', isPercentage: false },
  { key: 'fourth_party_collection', label: 'Fourth Party Collection', col: 'Fourth Party Collection', isPercentage: false },
  { key: 'third_party_collection', label: 'Third Party Collection', col: 'Third Party Collection', isPercentage: false },
  { key: 'clearance', label: 'Clearance Charge', col: 'Clearance Charge', isPercentage: false },
  { key: 'scottish_delivery_zone', label: 'Scottish Delivery Zone', col: 'Scottish Delivery Zone', isPercentage: false },
  { key: 'duties_taxes_prepaid_admin', label: 'Duties & Taxes Prepaid Admin Charge', col: 'Duties & Taxes Prepaid Admin Charge', isPercentage: false },
  { key: 'oversized_overweight', label: 'Oversized/Overweight Charge', col: 'Oversized/Overweight Charge', isPercentage: false },
  { key: 'carriage_charge', label: 'Carriage Charge', col: 'Carriage Charge', isPercentage: false },
  { key: 'global_energy_charge', label: 'Global Energy Charge', col: 'Global Energy Charge', isPercentage: false },
  { key: 'relabel_charge', label: 'Relabel Charge', col: 'Relabel Charge', isPercentage: false },
  { key: 'return_to_consignor', label: 'Return to Consignor Charge', col: 'Return to Consignor Charge', isPercentage: false },
  { key: 'failed_collection', label: 'Failed Collection Charge', col: 'Failed Collection Charge', isPercentage: false },
  { key: 'eu_export_return', label: 'EU Export Return Charge', col: 'EU Export Return Charge', isPercentage: false },
  { key: 'unsuccessful_export', label: 'Unsuccessful Export Charge', col: 'Unsuccessful Export Charge', isPercentage: false },
  { key: 'oversized_exports', label: 'Oversized Exports Charge', col: 'Oversized Exports Charge', isPercentage: false },
  { key: 'non_coms_handling', label: 'Non Coms Handling Charge', col: 'Non Coms Handling Charge', isPercentage: false },
];

/**
 * RFC-4180 compliant CSV line parser supporting quoted fields and embedded commas
 */
export function parseCSVRows(csvText) {
  const rows = [];
  let row = [];
  let cell = '';
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        row.push(cell.trim());
        cell = '';
      } else if (ch === '\r') {
        // Skip CR
      } else if (ch === '\n') {
        row.push(cell.trim());
        if (row.some(c => c !== '')) rows.push(row);
        row = [];
        cell = '';
      } else {
        cell += ch;
      }
    }
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(c => c !== '')) rows.push(row);
  }

  return rows;
}

/**
 * Convert DD/MM/YYYY to ISO YYYY-MM-DD
 */
export function parseUKDate(dateStr) {
  if (!dateStr) return null;
  const parts = String(dateStr).trim().split('/');
  if (parts.length === 3) {
    const day = parts[0].padStart(2, '0');
    const month = parts[1].padStart(2, '0');
    const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
    return `${year}-${month}-${day}`;
  }
  return dateStr;
}

/**
 * Clean monetary string to float
 */
export function parseAmount(val) {
  if (val == null || val === '') return 0;
  const cleaned = String(val).replace(/[£$,]/g, '').trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : Math.round(num * 100) / 100;
}

/**
 * Main entry point: Parse DPD CSV text into invoice metadata and structured shipment lines
 */
export function parseDPDInvoice(csvText) {
  const rawRows = parseCSVRows(csvText);
  if (!rawRows.length) {
    throw new Error('CSV file is empty');
  }

  const metadata = {
    account_no: null,
    invoice_no: null,
    carrier_company: null,
    nett_value: null,
    vat_value: null,
    gross_value: null,
    currency: 'GBP',
    total_parsed_lines: 0,
  };

  let headerRowIndex = -1;

  // Scan preamble rows for metadata & locate the column header row
  for (let r = 0; r < Math.min(10, rawRows.length); r++) {
    const row = rawRows[r];
    const rowStr = row.map(c => c.toLowerCase()).join(' ');

    if (row.includes('Date') && row.includes('Consignment') && row.includes('Parcel No')) {
      headerRowIndex = r;
      break;
    }

    // Extract preamble metadata
    for (let c = 0; c < row.length; c++) {
      const cellLower = row[c].toLowerCase();
      if (cellLower.includes('account no') && row[c + 1]) {
        metadata.account_no = row[c + 1];
      }
      if (cellLower.includes('invoice no') && row[c + 1]) {
        metadata.invoice_no = row[c + 1];
      }
      if (cellLower.includes('nett invoice value') && row[c + 2]) {
        metadata.nett_value = parseAmount(row[c + 2]);
      } else if (cellLower.includes('nett invoice value') && row[c + 1]) {
        metadata.nett_value = parseAmount(row[c + 1]);
      }
      if (cellLower === 'vat' && row[c + 2]) {
        metadata.vat_value = parseAmount(row[c + 2]);
      } else if (cellLower === 'vat' && row[c + 1]) {
        metadata.vat_value = parseAmount(row[c + 1]);
      }
      if (cellLower.includes('gross invoice value') && row[c + 2]) {
        metadata.gross_value = parseAmount(row[c + 2]);
      } else if (cellLower.includes('gross invoice value') && row[c + 1]) {
        metadata.gross_value = parseAmount(row[c + 1]);
      }
      if (row[c].includes('T/A') || row[c].includes('Moov')) {
        metadata.carrier_company = row[c];
      }
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Could not find DPD column header row (expected columns: Date, Consignment, Parcel No, Revenue)');
  }

  const headers = rawRows[headerRowIndex].map(h => h.trim());
  const headerMap = {};
  headers.forEach((h, idx) => {
    headerMap[h.toLowerCase()] = idx;
  });

  const getCol = (row, name) => {
    const idx = headerMap[name.toLowerCase()];
    return idx !== undefined ? row[idx] : '';
  };

  const lines = [];
  const linesRows = rawRows.slice(headerRowIndex + 1);

  for (let r = 0; r < linesRows.length; r++) {
    const row = linesRows[r];
    if (row.length < 5) continue; // Skip empty trailing rows

    const dateStr = getCol(row, 'Date');
    const consignment = getCol(row, 'Consignment');
    const parcelNo = getCol(row, 'Parcel No') || getCol(row, 'Header');
    const revenue = parseAmount(getCol(row, 'Revenue'));

    if (!consignment && !parcelNo && revenue === 0) continue;

    // Surcharges breakdown
    const surcharges = {};
    let totalSurcharges = 0;

    for (const sc of DPD_SURCHARGE_COLUMNS) {
      const amt = parseAmount(getCol(row, sc.col));
      if (amt > 0) {
        surcharges[sc.key] = amt;
        totalSurcharges += amt;
      }
    }

    const deliveryAddress = getCol(row, 'Delivery Address');
    const recipientName = deliveryAddress ? deliveryAddress.split(',')[0].trim() : null;

    // References parsing
    const sendersRef = getCol(row, 'Senders Ref') || null;
    const secondRef = getCol(row, 'Second Ref') || null;
    const thirdRef = getCol(row, 'Third Ref') || null;

    const allRefs = [sendersRef, secondRef, thirdRef]
      .filter(Boolean)
      .flatMap(r => r.split(',').map(s => s.trim()))
      .filter(Boolean);

    const line = {
      line_index: r + 1,
      shipment_date: parseUKDate(dateStr),
      consignment_number: String(consignment).trim(),
      tracking_number: String(parcelNo).trim(),
      header_number: String(getCol(row, 'Header')).trim() || null,
      product_code: getCol(row, 'Product Code') || null,
      product_desc: getCol(row, 'Product Description') || null,
      service_code: getCol(row, 'Service Code') || null,
      service_desc: getCol(row, 'Service Description') || null,
      depot_no: getCol(row, 'Depot No') || null,
      collection_depot: getCol(row, 'Collection') || null,
      delivery_postcode: getCol(row, 'Delivery') || null,
      senders_ref: sendersRef,
      second_ref: secondRef,
      third_ref: thirdRef,
      all_references: allRefs,
      billed_weight_kg: parseFloat(getCol(row, 'Weight')) || 0,
      parcel_count: parseInt(getCol(row, 'Items'), 10) || 1,
      vat_code: getCol(row, 'VAT Code') || 'S',
      carrier_base_amount: revenue,
      surcharge_codes: getCol(row, 'Surcharge') || null,
      surcharges,
      total_surcharges: Math.round(totalSurcharges * 100) / 100,
      total_carrier_cost: Math.round((revenue + totalSurcharges) * 100) / 100,
      country_code: getCol(row, 'Country Code') || 'GB',
      country_name: getCol(row, 'Country') || 'UNITED KINGDOM',
      delivery_address: deliveryAddress || null,
      recipient_name: recipientName,
      collection_postcode: getCol(row, 'Collection Post Code') || null,
    };

    lines.push(line);
  }

  metadata.total_parsed_lines = lines.length;

  return {
    metadata,
    lines,
  };
}

export default {
  DPD_COLUMNS,
  DPD_SURCHARGE_COLUMNS,
  parseCSVRows,
  parseUKDate,
  parseAmount,
  parseDPDInvoice,
};
