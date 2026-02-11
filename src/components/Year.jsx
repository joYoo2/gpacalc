import CourseRow from './CourseRow';
import { calculateYearGPA } from '../utils/gpaCalculator';

export default function Year({ year, onUpdate, onRemove, onMoveUp, onMoveDown, canMoveUp, canMoveDown }) {
  const { gpa, totalCredits } = calculateYearGPA(year.courses);

  const handleNameChange = (e) => {
    onUpdate({ ...year, name: e.target.value });
  };

  const handleCourseUpdate = (index, updatedCourse) => {
    const newCourses = [...year.courses];
    newCourses[index] = updatedCourse;
    onUpdate({ ...year, courses: newCourses });
  };

  const handleCourseRemove = (index) => {
    const newCourses = year.courses.filter((_, i) => i !== index);
    onUpdate({ ...year, courses: newCourses });
  };

  const handleAddCourse = () => {
    const newCourse = {
      id: crypto.randomUUID(),
      name: '',
      grade: '',
      level: 'CP',
      credits: '',
    };
    onUpdate({ ...year, courses: [...year.courses, newCourse] });
  };

  return (
    <div className="year-section">
      <div className="year-header">
        <div className="year-reorder-buttons">
          <button onClick={onMoveUp} disabled={!canMoveUp} className="btn-move-year" title="Move up">↑</button>
          <button onClick={onMoveDown} disabled={!canMoveDown} className="btn-move-year" title="Move down">↓</button>
        </div>
        <input
          type="text"
          value={year.name}
          onChange={handleNameChange}
          className="year-name-input"
        />
        <div className="year-stats">
          <span className="stat">{totalCredits.toFixed(1)} cr</span>
          <span className="stat">
            GPA: {gpa !== null ? gpa.toFixed(4) : '—'}
          </span>
          <button onClick={onRemove} className="btn-remove-year" title="Remove year">
            ×
          </button>
        </div>
      </div>
      <table className="course-table">
        <thead>
          <tr>
            <th className="th-name">Course</th>
            <th className="th-grade">Grade</th>
            <th className="th-level">Level</th>
            <th className="th-credits">Credits</th>
            <th className="th-points">Points</th>
            <th className="th-action"></th>
          </tr>
        </thead>
        <tbody>
          {year.courses.map((course, index) => (
            <CourseRow
              key={course.id}
              course={course}
              onUpdate={(updated) => handleCourseUpdate(index, updated)}
              onRemove={() => handleCourseRemove(index)}
            />
          ))}
        </tbody>
      </table>
      <button onClick={handleAddCourse} className="btn-add-course">
        + Course
      </button>
    </div>
  );
}
