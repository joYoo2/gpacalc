// Grade point values for Glen Rock High School
const GRADE_POINTS = {
  'A+': 4.3,
  'A': 4.0,
  'A-': 3.7,
  'B+': 3.3,
  'B': 3.0,
  'B-': 2.7,
  'C+': 2.3,
  'C': 2.0,
  'C-': 1.7,
  'D+': 1.3,
  'D': 1.0,
  'D-': 0.7,
  'F': 0.0,
};

// Course level weights
const LEVEL_WEIGHTS = {
  'AP': 0.5,
  'Honors': 0.3,
  'Advanced': 0.0,
  'CP': 0.0,
};

export const GRADES = Object.keys(GRADE_POINTS);
export const LEVELS = Object.keys(LEVEL_WEIGHTS);

export function getGradePoints(grade) {
  return GRADE_POINTS[grade] ?? null;
}

export function getLevelWeight(level) {
  return LEVEL_WEIGHTS[level] ?? 0;
}

export function calculateCoursePoints(course) {
  const { grade, level, credits } = course;
  const gradePoints = getGradePoints(grade);
  const levelWeight = getLevelWeight(level);
  const creditsNum = parseFloat(credits);

  if (gradePoints === null || isNaN(creditsNum) || creditsNum <= 0) {
    return null;
  }

  const weightedPoints = (gradePoints + levelWeight) * creditsNum;
  return weightedPoints;
}

export function calculateYearGPA(courses) {
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  for (const course of courses) {
    const points = calculateCoursePoints(course);
    const credits = parseFloat(course.credits);

    if (points !== null && !isNaN(credits) && credits > 0) {
      totalWeightedPoints += points;
      totalCredits += credits;
    }
  }

  if (totalCredits === 0) {
    return { gpa: null, totalCredits: 0 };
  }

  return {
    gpa: totalWeightedPoints / totalCredits,
    totalCredits,
  };
}

export function calculateCumulativeGPA(years) {
  let totalWeightedPoints = 0;
  let totalCredits = 0;

  for (const year of years) {
    for (const course of year.courses) {
      const points = calculateCoursePoints(course);
      const credits = parseFloat(course.credits);

      if (points !== null && !isNaN(credits) && credits > 0) {
        totalWeightedPoints += points;
        totalCredits += credits;
      }
    }
  }

  if (totalCredits === 0) {
    return { gpa: null, totalCredits: 0 };
  }

  return {
    gpa: totalWeightedPoints / totalCredits,
    totalCredits,
  };
}

export function calculateGPAThroughYear(years, throughIndex) {
  const yearsSubset = years.slice(0, throughIndex + 1);
  return calculateCumulativeGPA(yearsSubset);
}
