// utils/parse-extraction.ts

interface LineItem {
  invoiceNumber?: string;
  amount?: number;
  date?: string;
  description?: string;
}

/**
 * Parse the raw PDF.co document parser result into an array of line items.
 * Expects data.objects[] with possible tables.
 */
export function parseExtractedData(extractedData: any): LineItem[] {
  const items: LineItem[] = [];

  // PDF.co returns a JSON with an "objects" array
  const objects = extractedData?.objects || [];
  for (const obj of objects) {
    if (obj?.type === 'table' && obj?.rows) {
      // Try to find header row
      let headerRow: any = null;
      let headerIndex = -1;
      for (let i = 0; i < obj.rows.length; i++) {
        const cells = obj.rows[i]?.cells || [];
        const cellTexts = cells.map((c: any) => (c?.text || '').toLowerCase());
        if (
          cellTexts.some(
            (t: string) =>
              t.includes('invoice') ||
              t.includes('inv') ||
              t.includes('bill') ||
              t.includes('amount') ||
              t.includes('total') ||
              t.includes('date')
          )
        ) {
          headerRow = obj.rows[i];
          headerIndex = i;
          break;
        }
      }
      // If no header row, treat first row as header
      if (!headerRow && obj.rows.length > 0) {
        headerRow = obj.rows[0];
        headerIndex = 0;
      }
      // Parse rows after header
      for (let i = headerIndex + 1; i < obj.rows.length; i++) {
        const row = obj.rows[i];
        if (!row?.cells) continue;
        const cells = row.cells;
        // Build a map from header to cell value
        const map: { [key: string]: string } = {};
        for (let j = 0; j < headerRow.cells.length; j++) {
          const header = (headerRow.cells[j]?.text || '').toLowerCase().trim();
          const value = cells[j]?.text?.trim() || '';
          map[header] = value;
        }
        // Extract fields
        const invoiceNumber =
          map['invoice #'] ||
          map['inv #'] ||
          map['invoice'] ||
          map['doc number'] ||
          map['reference'] ||
          map['ref #'] ||
          '';
        const amountStr =
          map['amount'] ||
          map['total'] ||
          map['total amount'] ||
          map['sum'] ||
          '0';
        const dateStr =
          map['date'] ||
          map['invoice date'] ||
          map['inv date'] ||
          '';
        const description =
          map['description'] ||
          map['details'] ||
          map['item'] ||
          '';

        const amount = parseFloat(amountStr.replace(/[^0-9.-]+/g, ''));
        if (!isNaN(amount) || invoiceNumber) {
          items.push({
            invoiceNumber: invoiceNumber || undefined,
            amount: isNaN(amount) ? undefined : amount,
            date: dateStr || undefined,
            description: description || undefined,
          });
        }
      }
      // Only process first table for now
      break;
    }
  }

  // Fallback: if no table, try plain text or other objects?
  return items;
}