import { useRef } from 'react';
import { exportLeaderboard, importLeaderboard } from '../utils/leaderboardStorage';

export default function Leaderboard({ students, onEditStudent, onDeleteStudent, onImport }) {
  const fileInputRef = useRef(null);

  const sortedStudents = [...students].sort((a, b) => b.gpa - a.gpa);

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
                <td className="cell-gpa">{student.gpa !== null ? student.gpa.toFixed(4) : '—'}</td>
                <td className="cell-student-credits">{student.totalCredits.toFixed(1)}</td>
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
