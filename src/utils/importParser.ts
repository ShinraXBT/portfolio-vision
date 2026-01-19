import { ImportedSnapshot } from '../types';

// Parse CSV content
export function parseCSV(content: string): ImportedSnapshot[] {
  const lines = content.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]);
  const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));

  if (dateIndex === -1) {
    throw new Error('CSV must have a "date" column');
  }

  // Get wallet names from headers (all columns except date and total)
  const walletHeaders = headers.filter((h, i) =>
    i !== dateIndex &&
    !h.toLowerCase().includes('total')
  );

  const snapshots: ImportedSnapshot[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 2) continue;

    const dateValue = values[dateIndex];
    const date = parseDate(dateValue);
    if (!date) continue;

    const wallets: { [walletName: string]: number } = {};
    let total = 0;

    walletHeaders.forEach(walletName => {
      const idx = headers.indexOf(walletName);
      if (idx !== -1 && values[idx]) {
        const value = parseNumber(values[idx]);
        wallets[walletName] = value;
        total += value;
      }
    });

    snapshots.push({ date, wallets, total });
  }

  return snapshots;
}

// Parse a single CSV line (handles quoted values)
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Parse date string to YYYY-MM-DD format
function parseDate(value: string): string | null {
  // Try common formats
  const formats = [
    /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD
    /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
    /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // M/D/YYYY or D/M/YYYY
  ];

  // ISO format
  if (formats[0].test(value)) {
    return value;
  }

  // DD/MM/YYYY or DD-MM-YYYY
  const match1 = value.match(formats[1]) || value.match(formats[2]);
  if (match1) {
    const [, day, month, year] = match1;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  // Try parsing with Date
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    return date.toISOString().split('T')[0];
  }

  return null;
}

// Parse number from string
function parseNumber(value: string): number {
  // Remove currency symbols, spaces, and handle different decimal separators
  const cleaned = value
    .replace(/[$€£¥]/g, '')
    .replace(/\s/g, '')
    .replace(/,/g, '.');

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

// Parse JSON import
export function parseJSON(content: string) {
  const data = JSON.parse(content);

  // Check if it's our export format
  if (data.portfolios && data.wallets && data.snapshots) {
    return {
      type: 'full' as const,
      data: {
        portfolios: data.portfolios,
        wallets: data.wallets,
        snapshots: data.snapshots
      }
    };
  }

  // Try to parse as simple snapshot array
  if (Array.isArray(data)) {
    const snapshots: ImportedSnapshot[] = data.map(item => ({
      date: parseDate(item.date) ?? '',
      wallets: item.wallets ?? {},
      total: item.total
    })).filter(s => s.date);

    return {
      type: 'snapshots' as const,
      data: snapshots
    };
  }

  throw new Error('Invalid JSON format');
}

// Generate export CSV
export function generateCSV(
  snapshots: { date: string; wallets: { name: string; value: number }[]; total: number }[]
): string {
  if (snapshots.length === 0) return '';

  // Get all unique wallet names
  const walletNames = new Set<string>();
  snapshots.forEach(s => s.wallets.forEach(w => walletNames.add(w.name)));
  const walletArray = Array.from(walletNames).sort();

  // Header
  const headers = ['Date', ...walletArray, 'Total'];

  // Rows
  const rows = snapshots.map(s => {
    const walletValues = walletArray.map(name => {
      const wallet = s.wallets.find(w => w.name === name);
      return wallet ? wallet.value.toFixed(2) : '0.00';
    });
    return [s.date, ...walletValues, s.total.toFixed(2)];
  });

  // Generate CSV
  const csvRows = [headers, ...rows];
  return csvRows.map(row => row.join(',')).join('\n');
}

// Generate export JSON
export function generateJSON(data: {
  portfolios: unknown[];
  wallets: unknown[];
  snapshots: unknown[];
}): string {
  return JSON.stringify({
    ...data,
    exportedAt: new Date().toISOString(),
    version: '1.0'
  }, null, 2);
}

// Validate imported snapshots
export function validateImportedSnapshots(snapshots: ImportedSnapshot[]): {
  valid: ImportedSnapshot[];
  errors: string[];
} {
  const valid: ImportedSnapshot[] = [];
  const errors: string[] = [];

  snapshots.forEach((snapshot, index) => {
    if (!snapshot.date) {
      errors.push(`Row ${index + 1}: Invalid date`);
      return;
    }

    const walletCount = Object.keys(snapshot.wallets).length;
    if (walletCount === 0) {
      errors.push(`Row ${index + 1}: No wallet data`);
      return;
    }

    valid.push(snapshot);
  });

  return { valid, errors };
}
