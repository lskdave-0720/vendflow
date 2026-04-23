'use client';

import { useState } from 'react';

export default function VendorUpload() {
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');

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

    const res = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    const data = await res.json();
    if (data.error) {
      setMessage(data.error);
    } else {
      setMessage('File uploaded! Processing started. Check the result below.');
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
          {uploading ? 'Uploading...' : 'Upload & Extract'}
        </button>
        {message && <p className="text-sm text-gray-600">{message}</p>}
      </form>
    </div>
  );
}