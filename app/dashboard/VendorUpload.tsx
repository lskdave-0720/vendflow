'use client';

import { useState } from 'react';

interface LineItem {
  invoiceNumber?: string;
  amount?: number;
  date?: string;
  description?: string;
}

interface Match {
  lineItem: LineItem;
  match: {
    id: string;
    docNumber: string;
    amount: number;
    vendorName?: string;
    date?: string;
  } | null;
  confidence: number;
}

export default function VendorUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState<{
    lineItems?: LineItem[];
    matches?: Match[];
  } | null>(null);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get('file') as File;

    if (!file) {
      setMessage('Please select a file.');
      return;
    }

    setUploading(true);
    setMessage('');
    setResults(null);

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
    } else {
      setMessage('File processed successfully!');
      setResults(data.result);
    }
    setUploading(false);
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Upload Vendor Statement</h2>
      <form onSubmit={handleUpload} className="mt-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Select PDF</label>
          <input
            type="file"
            name="file"
            accept="application/pdf"
            className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
        </div>
        <button
          type="submit"
          disabled={uploading}
          className="rounded-md bg-indigo-600 px-6 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {uploading ? 'Uploading...' : 'Upload & Match'}
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>

      {results && results.matches && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Matching Results</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Invoice #</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Amount</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-gray-600">Matched Bill</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {results.matches.map((matchResult, idx) => (
                  <tr key={idx} className={matchResult.match ? 'bg-green-50' : 'bg-red-50'}>
                    <td className="px-3 py-2">{matchResult.lineItem.invoiceNumber || 'N/A'}</td>
                    <td className="px-3 py-2">{matchResult.lineItem.amount?.toFixed(2) || 'N/A'}</td>
                    <td className="px-3 py-2">
                      {matchResult.match ? (
                        <span className="text-green-700 font-medium">Matched</span>
                      ) : (
                        <span className="text-red-700 font-medium">Unmatched</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      {matchResult.match
                        ? `${matchResult.match.docNumber} (${matchResult.match.amount?.toFixed(2)})`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}