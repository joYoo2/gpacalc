const LEADERBOARD_KEY = 'glenrock-gpa-leaderboard';

export function loadLeaderboard() {
  try {
    const saved = localStorage.getItem(LEADERBOARD_KEY);
    if (saved) {
      const data = JSON.parse(saved);
      return data.students || [];
    }
  } catch (e) {
    console.error('Failed to load leaderboard from localStorage:', e);
  }
  return [];
}

export function saveLeaderboard(students) {
  try {
    localStorage.setItem(LEADERBOARD_KEY, JSON.stringify({ students }));
  } catch (e) {
    console.error('Failed to save leaderboard to localStorage:', e);
  }
}

export function exportLeaderboard(students) {
  const data = {
    version: 1,
    exportedAt: new Date().toISOString(),
    students,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gpa-leaderboard-${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function importLeaderboard(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        if (data.students && Array.isArray(data.students)) {
          resolve(data.students);
        } else {
          reject(new Error('Invalid leaderboard file format'));
        }
      } catch (err) {
        reject(new Error('Failed to parse JSON file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
