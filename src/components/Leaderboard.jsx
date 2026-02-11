import { useMemo, useRef, useState } from 'react';
import { exportLeaderboard, importLeaderboard } from '../utils/leaderboardStorage';
import { calculateGPAThroughYear } from '../utils/gpaCalculator';

export default function Leaderboard({ students, onEditStudent, onDeleteStudent, onImport }) {
  const fileInputRef = useRef(null);
  const [yearFilter, setYearFilter] = useState('3');
  const [showRankChange, setShowRankChange] = useState(false);

  const maxYears = Math.max(...students.map(s => s.years.length), 0);

  const studentsWithFilteredGPA = students.map(student => {
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

  // Calculate previous year rankings for comparison
  const previousYearRankings = useMemo(() => {
    if (yearFilter === '0') return {};

    const prevIndex = parseInt(yearFilter) - 1;
    const studentsWithPrevGPA = students.map(student => {
      if (prevIndex >= student.years.length) {
        return { id: student.id, gpa: student.gpa };
      }
      const { gpa } = calculateGPAThroughYear(student.years, prevIndex);
      return { id: student.id, gpa: gpa ?? 0 };
    });

    const sorted = [...studentsWithPrevGPA].sort((a, b) => (b.gpa ?? 0) - (a.gpa ?? 0));
    const rankings = {};
    sorted.forEach((s, i) => { rankings[s.id] = i + 1; });
    return rankings;
  }, [students, yearFilter]);

  // Add rank change to each student
  const studentsWithRankChange = sortedStudents.map((student, currentRank) => {
    const prevRank = previousYearRankings[student.id];
    const rankChange = prevRank ? prevRank - (currentRank + 1) : null;
    return { ...student, rankChange };
  });

  // Get arrow color based on rank change magnitude
  const getArrowColor = (change) => {
    if (change === null || change === 0) return '#888';
    const magnitude = Math.min(Math.abs(change), 5); // Cap at 5 for color scaling
    // Saturation: 30% for small changes, 90% for big changes
    const saturation = 30 + (magnitude * 12); // 42% to 90%
    if (change > 0) {
      return `hsl(120, ${saturation}%, 35%)`;
    } else {
      return `hsl(0, ${saturation}%, 40%)`;
    }
  };

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
          <div className="year-timeline">
            {Array.from({ length: Math.max(maxYears, 4) }, (_, i) => (
              <button
                key={i}
                className={`timeline-segment ${yearFilter === String(i) ? 'active' : ''}`}
                onClick={() => setYearFilter(String(i))}
              >
                Y{i + 1}
              </button>
            ))}
          </div>
          <label className="rank-change-toggle">
            <input
              type="checkbox"
              checked={showRankChange}
              onChange={(e) => setShowRankChange(e.target.checked)}
            />
            Show rank changes
          </label>
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
            {showRankChange && <th className="th-rank-change">Δ</th>}
            <th className="th-student-name">Name</th>
            <th className="th-gpa">GPA</th>
            <th className="th-student-credits">Credits</th>
            <th className="th-student-actions">Actions</th>
          </tr>
        </thead>
        <tbody>
          {studentsWithRankChange.length === 0 ? (
            <tr>
              <td colSpan={showRankChange ? 6 : 5} className="leaderboard-empty">
                No students yet. Use the Calculator to add students.
              </td>
            </tr>
          ) : (
            studentsWithRankChange.map((student, index) => (
              <tr key={student.id} className="leaderboard-row">
                <td className="cell-rank">{index + 1}</td>
                {showRankChange && (
                  <td className="cell-rank-change" style={{ color: getArrowColor(student.rankChange) }}>
                    {student.rankChange === null ? '—' :
                     student.rankChange > 0 ? `↑${student.rankChange}` :
                     student.rankChange < 0 ? `↓${Math.abs(student.rankChange)}` : '—'}
                  </td>
                )}
                <td className="cell-student-name">
                  {student.name || 'Unnamed'}
                  {student.years.length < Math.max(maxYears, 4) && (
                    <span className="year-badge">(Y{student.years.length})</span>
                  )}
                </td>
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
