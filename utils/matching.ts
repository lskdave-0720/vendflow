// utils/matching.ts

interface BillItem {
  id: string;
  docNumber: string;
  amount: number;
  vendorName?: string;
  date?: string;
}

export interface MatchResult {
  lineItem: any;
  match: BillItem | null;
  confidence: number;
}

/**
 * Match a list of extracted line items to open bills.
 * Assumes openBills is an array of objects with at least DocNumber, TotalAmt, Id.
 */
export function matchLineItems(
  lineItems: any[],
  openBills: any[]
): MatchResult[] {
  const results: MatchResult[] = [];

  for (const line of lineItems) {
    const invNum = (line.invoiceNumber || '').toLowerCase().trim();
    const amount = parseFloat(line.amount) || 0;

    let bestMatch: any = null;
    let bestScore = 0;

    for (const bill of openBills) {
      const billInvNum = (bill.DocNumber || '').toLowerCase().trim();
      const billAmount = parseFloat(bill.TotalAmt) || 0;

      let score = 0;

      // Exact match on invoice number and amount
      if (invNum && invNum === billInvNum && Math.abs(amount - billAmount) < 0.01) {
        score = 1.0;
      } else if (invNum && billInvNum) {
        // Fuzzy match on invoice number
        const similarity = stringSimilarity(invNum, billInvNum);
        if (similarity > 0.8 && Math.abs(amount - billAmount) < 0.01) {
          score = similarity;
        } else if (similarity > 0.9) {
          score = similarity * 0.8; // less confident if amounts differ
        }
      } else if (amount > 0 && Math.abs(amount - billAmount) < 0.01) {
        // Amount-only match, low confidence
        score = 0.5;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMatch = bill;
      }
    }

    results.push({
      lineItem: line,
      match: bestScore >= 0.8 ? {
        id: bestMatch.Id,
        docNumber: bestMatch.DocNumber,
        amount: bestMatch.TotalAmt,
        vendorName: bestMatch.VendorRef?.name || '',
        date: bestMatch.TxnDate,
      } : null,
      confidence: bestScore,
    });
  }

  return results;
}

// Simple Levenshtein-like string similarity (0-1)
function stringSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  if (longer.length === 0) return 1.0;
  const distance = levenshteinDistance(longer, shorter);
  return (longer.length - distance) / longer.length;
}

function levenshteinDistance(s: string, t: string): number {
  const m = s.length;
  const n = t.length;
  const d: number[][] = [];
  for (let i = 0; i <= m; i++) {
    d[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    d[0][j] = j;
  }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s[i - 1] === t[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
    }
  }
  return d[m][n];
}