import { useRef, useState } from 'react';
import { parseReportCardPDF } from '../utils/reportCardParser';

export default function ImportButton({ onImport }) {
  const fileInputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const nonPdfFiles = files.filter((f) => f.type !== 'application/pdf');
    if (nonPdfFiles.length > 0) {
      setError('Please select only PDF files');
      e.target.value = '';
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await Promise.all(
        files.map(async (file) => {
          try {
            return await parseReportCardPDF(file);
          } catch (err) {
            console.error(`Failed to parse ${file.name}:`, err);
            return null;
          }
        })
      );

      const validResults = results.filter((r) => r && r.courses.length > 0);

      if (validResults.length === 0) {
        setError('No courses found in selected PDFs');
      } else {
        onImport(validResults);
        if (validResults.length < files.length) {
          setError(`Imported ${validResults.length} of ${files.length} files`);
        }
      }
    } catch (err) {
      console.error('PDF parsing error:', err);
      setError('Failed to parse PDFs');
    } finally {
      setLoading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="import-container">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
      <button
        onClick={handleClick}
        disabled={loading}
        className="btn-import"
      >
        {loading ? 'Parsing...' : 'Import Report Cards'}
      </button>
      {error && <span className="import-error">{error}</span>}
    </div>
  );
}
