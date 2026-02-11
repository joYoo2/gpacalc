import { useRef, useState } from 'react';
import { exportLeaderboard, importLeaderboard } from '../utils/leaderboardStorage';
import { calculateGPAThroughYear } from '../utils/gpaCalculator';

export default function Leaderboard({ students, onEditStudent, onDeleteStudent, onImport }) {
  const fileInputRef = useRef(null);
  const [yearFilter, setYearFilter] = useState('all');

  const maxYears = Math.max(...students.map(s => s.years.length), 0);

  const studentsWithFilteredGPA = students.map(student => {
    if (yearFilter === 'all') {
      return { ...student, displayGPA: student.gpa, displayCredits: student.totalCredits };
    }
    const throughIndex = parseInt(yearFilter);
    if (throughIndex >= student.years.length) {
      return { ...student, displayGPA: student.gpa, displayCredits: student.totalCredits };
    }
    const { gpa, totalCredits } = calculateGPAThroughYear(student.years, throughIndex);
    return { ...student, displayGPA: gpa, displayCredits: totalCredits };
  });

  const sortedStudents = [...studentsWithFilteredGPA].sort((a, b) =>
    (b.displayGPA ?? 0) - (a.displayGPA ?? 0)
  );

  const handleExport = () => {
    exportLeaderboard(students);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const importedStudents = await importLeaderboard(file);
      onImport(importedStudents);
    } catch (err) {
      alert(err.message);
    }

    e.target.value = '';
  };

  return (
    <div className="leaderboard">
      <div className="leaderboard-header">
        <span className="leaderboard-title">LEADERBOARD</span>
        <div className="leaderboard-actions">
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="year-filter-select"
          >
            <option value="all">All Years</option>
            {Array.from({ length: Math.max(maxYears, 4) }, (_, i) => (
              <option key={i} value={i}>Through Year {i + 1}</option>
            ))}
          </select>
          <button onClick={handleExport} className="btn-leaderboard" disabled={students.length === 0}>
            Export
          </button>
          <button onClick={handleImportClick} className="btn-leaderboard">
            Import
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      <table className="leaderboard-table">
        <thead>
          <tr>
            <th className="th-rank">#</th>
            <th className="th-student-name">Name</th>
            <th className="th-gpa">GPA</th>
            <th className="th-student-credits">Credits</th>
            <th className="th-student-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {sortedStudents.length === 0 ? (
            <tr>
              <td colSpan="5" className="leaderboard-empty">
                No students yet. Use the Calculator to add students.
              </td>
            </tr>
          ) : (
            sortedStudents.map((student, index) => (
              <tr key={student.id} className="leaderboard-row">
                <td className="cell-rank">{index + 1}</td>
                <td className="cell-student-name">{student.name || 'Unnamed'}</td>
                <td className="cell-gpa">{student.displayGPA !== null ? student.displayGPA.toFixed(4) : '—'}</td>
                <td className="cell-student-credits">{student.displayCredits.toFixed(1)}</td>
                <td className="cell-student-actions">
                  <button onClick={() => onEditStudent(student)} className="btn-edit">
                    Edit
                  </button>
                  <button onClick={() => onDeleteStudent(student.id)} className="btn-delete">
                    Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
