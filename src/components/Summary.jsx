import { calculateCumulativeGPA } from '../utils/gpaCalculator';

export default function Summary({ years }) {
  const { gpa, totalCredits } = calculateCumulativeGPA(years);

  return (
    <div className="summary">
      <span className="summary-label">CUMULATIVE</span>
      <div className="summary-stats">
        <span className="stat">{totalCredits.toFixed(1)} cr</span>
        <span className="stat">
          GPA: {gpa !== null ? gpa.toFixed(4) : '—'}
        </span>
      </div>
    </div>
  );
}
