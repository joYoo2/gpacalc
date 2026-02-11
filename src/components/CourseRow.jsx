import { GRADES, LEVELS, calculateCoursePoints } from '../utils/gpaCalculator';

export default function CourseRow({ course, onUpdate, onRemove }) {
  const points = calculateCoursePoints(course);

  const handleChange = (field, value) => {
    onUpdate({ ...course, [field]: value });
  };

  return (
    <tr className="course-row">
      <td className="cell cell-name">
        <input
          type="text"
          value={course.name}
          onChange={(e) => handleChange('name', e.target.value)}
          placeholder="Course name"
          className="input-text"
        />
      </td>
      <td className="cell cell-grade">
        <select
          value={course.grade}
          onChange={(e) => handleChange('grade', e.target.value)}
          className="input-select"
        >
          <option value="">--</option>
          {GRADES.map((grade) => (
            <option key={grade} value={grade}>
              {grade}
            </option>
          ))}
        </select>
      </td>
      <td className="cell cell-level">
        <select
          value={course.level}
          onChange={(e) => handleChange('level', e.target.value)}
          className="input-select"
        >
          {LEVELS.map((level) => (
            <option key={level} value={level}>
              {level}
            </option>
          ))}
        </select>
      </td>
      <td className="cell cell-credits">
        <input
          type="number"
          value={course.credits}
          onChange={(e) => handleChange('credits', e.target.value)}
          placeholder="0"
          min="0"
          step="0.5"
          className="input-number"
        />
      </td>
      <td className="cell cell-points">
        {points !== null ? points.toFixed(4) : '—'}
      </td>
      <td className="cell cell-action">
        <button onClick={onRemove} className="btn-remove" title="Remove course">
          ×
        </button>
      </td>
    </tr>
  );
}
