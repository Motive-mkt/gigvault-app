// CSV export for GigVault entries — used by the Tax screen's "Export tax
// summary" button and Settings' "Export all data" row.

import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { getAllEntries, getEntriesBetween } from '../db/database';

function escapeCsvField(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function entriesToCsv(entries) {
  const header = ['Date', 'Type', 'Platform', 'Amount', 'Hours', 'Miles', 'Note'];
  const rows = entries.map((e) => [
    new Date(e.created_at).toLocaleDateString(),
    e.type,
    e.platform_name ?? '',
    e.amount.toFixed(2),
    e.hours ?? '',
    e.miles ?? '',
    e.note ?? '',
  ]);

  const lines = [header, ...rows].map((row) => row.map(escapeCsvField).join(','));
  return lines.join('\n');
}

async function writeAndShareCsv(csvContent, filename) {
  const fileUri = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(fileUri, csvContent, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export GigVault data',
      UTI: 'public.comma-separated-values-text',
    });
  }
  return fileUri;
}

/** Exports every entry ever logged. Used by Settings > "Export all data". */
export async function exportAllDataCsv() {
  const entries = await getAllEntries();
  const csv = entriesToCsv(entries);
  const filename = `gigvault-all-data-${Date.now()}.csv`;
  return writeAndShareCsv(csv, filename);
}

/** Exports entries within a date range. Used by Tax screen's quarterly/annual export. */
export async function exportRangeCsv(startISO, endISO, label = 'summary') {
  const entries = await getEntriesBetween(startISO, endISO);
  const csv = entriesToCsv(entries);
  const filename = `gigvault-tax-${label}-${Date.now()}.csv`;
  return writeAndShareCsv(csv, filename);
}
