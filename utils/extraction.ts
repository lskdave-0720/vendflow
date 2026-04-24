// utils/extraction.ts (temporary mock – returns data matching your sandbox bills)
export async function extractPDF(_arrayBuffer: ArrayBuffer, _fileName: string) {
  return {
    objects: [
      {
        type: 'table',
        rows: [
          {
            cells: [
              { text: 'Invoice #' },
              { text: 'Date' },
              { text: 'Amount' },
              { text: 'Description' },
            ],
          },
          {
            cells: [
              { text: 'INV-1001' },
              { text: '2026-04-24' },
              { text: '$150.00' },
              { text: 'Test office supplies' },
            ],
          },
          {
            cells: [
              { text: 'INV-1002' },
              { text: '2026-04-24' },
              { text: '$200.00' },
              { text: 'Test shipping materials' },
            ],
          },
        ],
      },
    ],
  };
}