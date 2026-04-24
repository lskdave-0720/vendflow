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

    // 🔁 Temporary debug endpoint – shows raw PDF.co data
    const res = await fetch('/api/debug-upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
    } else {
      // The debug endpoint returns { success, rawParserResponse, uploadedUrl }
      // We'll display the raw JSON as a string so you can copy it directly
      setMessage('Debug: raw PDF.co data received. Copy the output below.');
      // Store the entire response so we can display it
      setResults(data); // This won't match the expected shape, but we'll show it as JSON
    }
    setUploading(false);
  };

  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-gray-900">Upload Vendor Statement (Debug Mode)</h2>
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
          {uploading ? 'Uploading...' : 'Upload & Debug'}
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>

      {/* Display the raw JSON returned by the debug endpoint */}
      {results && (
        <div className="mt-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Raw PDF.co Response</h3>
          <pre className="overflow-x-auto rounded-lg bg-gray-900 p-4 text-sm text-green-400">
            {JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}