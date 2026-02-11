import { useState, useEffect } from 'react';
import Year from './components/Year';
import Summary from './components/Summary';
import ImportButton from './components/ImportButton';
import Leaderboard from './components/Leaderboard';
import { loadLeaderboard, saveLeaderboard } from './utils/leaderboardStorage';
import { calculateCumulativeGPA } from './utils/gpaCalculator';

const STORAGE_KEY = 'glenrock-gpa-calculator';

const DEFAULT_YEARS = [
  {
    id: crypto.randomUUID(),
    name: 'Freshman Year',
    courses: [
      {
        id: crypto.randomUUID(),
        name: '',
        grade: '',
        level: 'CP',
        credits: '',
      },
    ],
  },
];

function loadFromStorage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
  }
  return null;
}

function saveToStorage(years) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(years));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
}

export default function App() {
  const [years, setYears] = useState(() => {
    return loadFromStorage() || DEFAULT_YEARS;
  });
  const [view, setView] = useState('calculator');
  const [students, setStudents] = useState(() => loadLeaderboard());
  const [currentStudentId, setCurrentStudentId] = useState(null);
  const [studentName, setStudentName] = useState('');

  useEffect(() => {
    saveToStorage(years);
  }, [years]);

  useEffect(() => {
    saveLeaderboard(students);
  }, [students]);

  const handleYearUpdate = (index, updatedYear) => {
    const newYears = [...years];
    newYears[index] = updatedYear;
    setYears(newYears);
  };

  const handleYearRemove = (index) => {
    if (years.length === 1) {
      return;
    }
    const newYears = years.filter((_, i) => i !== index);
    setYears(newYears);
  };

  const handleAddYear = () => {
    const yearNames = ['Freshman Year', 'Sophomore Year', 'Junior Year', 'Senior Year'];
    const existingNames = years.map((y) => y.name);
    const nextName = yearNames.find((n) => !existingNames.includes(n)) || `Year ${years.length + 1}`;

    const newYear = {
      id: crypto.randomUUID(),
      name: nextName,
      courses: [
        {
          id: crypto.randomUUID(),
          name: '',
          grade: '',
          level: 'CP',
          credits: '',
        },
      ],
    };
    setYears([...years, newYear]);
  };

  const handleImport = (results) => {
    const newYears = results.map((result) => ({
      id: crypto.randomUUID(),
      name: result.yearName,
      courses: result.courses,
    }));
    setYears([...years, ...newYears]);
  };

  const handleEditStudent = (student) => {
    setYears(student.years);
    setCurrentStudentId(student.id);
    setStudentName(student.name);
    setView('calculator');
  };

  const handleDeleteStudent = (studentId) => {
    if (window.confirm('Delete this student from the leaderboard?')) {
      setStudents((prev) => prev.filter((s) => s.id !== studentId));
      if (currentStudentId === studentId) {
        setCurrentStudentId(null);
        setStudentName('');
      }
    }
  };

  const handleSaveToLeaderboard = () => {
    const name = studentName.trim() || prompt('Enter student name:');
    if (!name) return;

    const { gpa, totalCredits } = calculateCumulativeGPA(years);
    const now = Date.now();

    const student = {
      id: currentStudentId || crypto.randomUUID(),
      name: name.trim(),
      years: JSON.parse(JSON.stringify(years)),
      gpa: gpa ?? 0,
      totalCredits,
      createdAt: currentStudentId
        ? students.find((s) => s.id === currentStudentId)?.createdAt || now
        : now,
      updatedAt: now,
    };

    setStudents((prev) => {
      const existingIndex = prev.findIndex((s) => s.id === student.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = student;
        return updated;
      }
      return [...prev, student];
    });

    setCurrentStudentId(student.id);
    setStudentName(student.name);
  };

  const handleNewCalculator = () => {
    setYears(DEFAULT_YEARS.map((y) => ({
      ...y,
      id: crypto.randomUUID(),
      courses: y.courses.map((c) => ({ ...c, id: crypto.randomUUID() })),
    })));
    setCurrentStudentId(null);
    setStudentName('');
  };

  const handleImportLeaderboard = (importedStudents) => {
    setStudents(importedStudents);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>GLEN ROCK HS GPA CALCULATOR</h1>
        <button
          onClick={() => setView(view === 'calculator' ? 'leaderboard' : 'calculator')}
          className="btn-view-toggle"
        >
          {view === 'calculator' ? 'Leaderboard' : 'Calculator'}
        </button>
      </header>

      {view === 'calculator' ? (
        <>
          <div className="controls">
            <button onClick={handleAddYear} className="btn-add-year">
              + Year
            </button>
            <ImportButton onImport={handleImport} />
            <div className="controls-right">
              {currentStudentId && (
                <span className="current-student">Editing: {studentName}</span>
              )}
              <input
                type="text"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Student name"
                className="input-student-name"
              />
              <button onClick={handleSaveToLeaderboard} className="btn-save-leaderboard">
                {currentStudentId ? 'Update' : 'Add to'} Leaderboard
              </button>
              {currentStudentId && (
                <button onClick={handleNewCalculator} className="btn-new-calc">
                  New
                </button>
              )}
            </div>
          </div>
          <main className="main">
            {years.map((year, index) => (
              <Year
                key={year.id}
                year={year}
                onUpdate={(updated) => handleYearUpdate(index, updated)}
                onRemove={() => handleYearRemove(index)}
              />
            ))}
            <Summary years={years} />
          </main>
        </>
      ) : (
        <main className="main">
          <Leaderboard
            students={students}
            onEditStudent={handleEditStudent}
            onDeleteStudent={handleDeleteStudent}
            onImport={handleImportLeaderboard}
          />
        </main>
      )}
    </div>
  );
}
