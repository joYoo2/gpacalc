import * as pdfjsLib from 'pdfjs-dist';

// Set up the worker
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.mjs',
  import.meta.url
).toString();

// Course level detection patterns
const LEVEL_PATTERNS = [
  { pattern: /^AP\s/i, level: 'AP' },
  { pattern: /\bAP\b/, level: 'AP' },
  { pattern: /^Hon\s/i, level: 'Honors' },
  { pattern: /\bHonors?\b/i, level: 'Honors' },
  { pattern: /^H\s/i, level: 'Honors' },
  { pattern: /\bAdv\b/i, level: 'Advanced' },
  { pattern: /\bAdvanced\b/i, level: 'Advanced' },
];

// Valid letter grades
const VALID_GRADES = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F'];

// Skip these non-letter grades
const SKIP_GRADES = ['P', 'W', 'I', 'AUD', 'MED', 'CD', 'XMT', 'N', 'O', 'S'];

function detectLevel(courseName) {
  for (const { pattern, level } of LEVEL_PATTERNS) {
    if (pattern.test(courseName)) {
      return level;
    }
  }
  return 'CP';
}

export async function parseReportCardPDF(file) {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const courses = [];
  let yearName = null;
  let gradeLevel = null;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Extract text items with positions
    const items = textContent.items.map(item => ({
      text: item.str.trim(),
      x: Math.round(item.transform[4]),
      y: Math.round(item.transform[5]),
      width: item.width,
    })).filter(item => item.text.length > 0);

    // Sort by y position (top to bottom), then x (left to right)
    items.sort((a, b) => {
      const yDiff = b.y - a.y;
      if (Math.abs(yDiff) > 3) return yDiff;
      return a.x - b.x;
    });

    // Group items into rows (items within 5 units of y are same row)
    const rows = [];
    let currentRow = [];
    let currentY = null;

    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) > 5) {
        if (currentRow.length > 0) {
          rows.push(currentRow);
        }
        currentRow = [item];
        currentY = item.y;
      } else {
        currentRow.push(item);
      }
    }
    if (currentRow.length > 0) {
      rows.push(currentRow);
    }

    // Sort items within each row by x position
    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
    }

    // Find year and grade level from report card
    for (const row of rows) {
      const rowText = row.map(r => r.text).join(' ');

      // Look for year pattern like "2024-25"
      const yearMatch = rowText.match(/(\d{4}-\d{2})\b/);
      if (yearMatch && !yearName) {
        yearName = yearMatch[1] + ' School Year';
      }

      // Look for grade level (09, 10, 11, 12)
      // Usually appears after student name in format "Grade ... 11" or just "11" near homeroom
      if (!gradeLevel) {
        const gradeLevelMatch = rowText.match(/\b(09|10|11|12)\b/);
        if (gradeLevelMatch && rowText.includes('Grade')) {
          gradeLevel = parseInt(gradeLevelMatch[1]);
        }
      }
    }

    // Parse course rows
    for (const row of rows) {
      const course = parseCourseRow(row);
      if (course) {
        courses.push(course);
      }
    }
  }

  // Convert grade level to year name if we found it
  if (gradeLevel && yearName) {
    const yearNames = { 9: 'Freshman', 10: 'Sophomore', 11: 'Junior', 12: 'Senior' };
    const yearLabel = yearNames[gradeLevel] || `Grade ${gradeLevel}`;
    yearName = `${yearLabel} Year (${yearName.replace(' School Year', '')})`;
  }

  return {
    yearName: yearName || 'Imported Year',
    courses,
  };
}

function parseCourseRow(row) {
  const texts = row.map(r => r.text).filter(t => t.length > 0);
  const rowText = texts.join(' ');

  // Skip non-course rows
  const skipPatterns = [
    /Subject/i,
    /Report Card/i,
    /Student No/i,
    /Student Name/i,
    /Grading System/i,
    /Attendance/i,
    /Comments/i,
    /Glen Rock/i,
    /Parent\/Guardian/i,
    /Total Credits/i,
    /Additional Information/i,
    /Congratulations/i,
    /Phone/i,
    /School\s+Phone/i,
    /Counselor/i,
    /Homeroom/i,
    /^\d+\s+(Shows|Should|Is a|Works|Takes|Displays|Strong|Active|Consistent|Demonstrates|Excellent|Enthusiastic|Highly|Good|Not enough|Needs|Pleasure|Outstanding)/i,
    /^[A-Z][+-]?\s*=\s*\d/,  // Grading scale like "A+ = 97-100"
    /Earned\s+Credits/i,
    /^#$/,
    /^\d{6}$/,  // Student ID
    /Iris Circle/i,  // Address
    /07452/,  // Zip code
  ];

  for (const pattern of skipPatterns) {
    if (pattern.test(rowText)) {
      return null;
    }
  }

  // Course name detection - must start with a recognizable course pattern
  const courseNamePatterns = [
    /^(AP\s+[\w\s&:.\/]+)/i,
    /^(Hon\s+[\w\s&:.\/]+)/i,
    /^(H\s+[\w\s&:.\/]+)/i,
    /^(Adv[.\s]+[\w\s&:.\/]+)/i,
    /^(Physical\s+Ed[.\s]*\d*)/i,
    /^(Health\s*\d*)/i,
    /^(Drivers\s+Ed[.\s]*\d*)/i,
    /^(English\s*\d*)/i,
    /^(French\s+[IVX\d]+)/i,
    /^(Spanish\s+[IVX\d]+)/i,
    /^(Latin\s+[IVX\d]+)/i,
    /^(Algebra\s+[\w\s]+)/i,
    /^(Geometry[\w\s]*)/i,
    /^(Pre-?Calc[\w\s]*)/i,
    /^(Calculus[\w\s]*)/i,
    /^(Chemistry[\w\s]*)/i,
    /^(Biology[\w\s]*)/i,
    /^(Physics[\w\s]*)/i,
    /^(World\s+Hist[\w\s]*)/i,
    /^(US\s+Hist?[\w\s]*)/i,
    /^(Intro\s+to[\w\s.]+)/i,
    /^(Economics)/i,
    /^(Comp\s+Sci[\w\s]*)/i,
    /^(Web\s+Design)/i,
    /^(Pre-Eng[\w\s]*)/i,
    /^(Photo\s*[IV\d]*)/i,
    /^(Art\s+History)/i,
    /^(Drawing\s*[&\w\s]*)/i,
    /^(Sculpture)/i,
    /^([\w\s&:.\/]+)/,  // Fallback: any text
  ];

  let courseName = null;
  let courseNameEndIndex = 0;

  // Try to find course name from the beginning of the row
  const firstText = texts[0];

  // Check if first item looks like a course name (not a number, not a grade, not a course code)
  if (firstText &&
      !/^\d{4}-\d+$/.test(firstText) &&  // Not a course code like 5730-1
      !/^\d+\.\d+$/.test(firstText) &&   // Not a decimal number
      !/^\d+$/.test(firstText) &&        // Not just a number
      !VALID_GRADES.includes(firstText) &&
      !SKIP_GRADES.includes(firstText) &&
      firstText.length > 1) {

    for (const pattern of courseNamePatterns) {
      const match = firstText.match(pattern);
      if (match) {
        courseName = match[1];
        courseNameEndIndex = 1;
        break;
      }
    }
  }

  if (!courseName) return null;

  // Clean up course name - remove course codes and trailing numbers
  courseName = courseName
    .replace(/\s+\d{4}-\d+.*$/, '')  // Remove course codes like "5730-1"
    .replace(/\s+\d+\s*$/, '')       // Remove trailing numbers
    .trim();

  // Skip if course name is too short or looks invalid
  if (courseName.length < 2) return null;

  // Find all valid letter grades in the row
  const grades = [];
  for (let i = courseNameEndIndex; i < texts.length; i++) {
    const text = texts[i];
    if (VALID_GRADES.includes(text)) {
      grades.push({ grade: text, index: i });
    }
  }

  // Require at least 2 grades — S2 courses with only 1 MP grade should be skipped
  if (grades.length < 2) return null;

  // Determine which grade to use:
  // - If there's a "Final Grade" (typically the last grade before credits), use it
  // - Otherwise, use the most recent marking period grade
  //
  // In Glen Rock format, grades appear in order:
  // 1st MP, 2nd MP, ME, S1, 3rd MP, 4th MP, Final Exam, Final Grade
  // So we generally want the last grade that appears

  let selectedGrade = grades[grades.length - 1].grade;

  // Find credits - look for decimal numbers like 5.000, 7.000, 3.750
  // Credits should be near the end of the row
  let credits = null;
  for (let i = texts.length - 1; i >= 0; i--) {
    const text = texts[i];
    // Match decimal numbers with 1-3 decimal places
    const match = text.match(/^(\d+\.\d{3})$/);
    if (match) {
      const num = parseFloat(match[1]);
      // Credits are typically between 1 and 10
      if (num >= 1 && num <= 10) {
        credits = num;
        break;
      }
    }
  }

  // If no credits found, assign defaults (S1 reports may lack earned credits)
  if (!credits) {
    if (/Physical\s*Ed/i.test(courseName)) credits = 3.75;
    else if (/^Health/i.test(courseName)) credits = 1.25;
    else if (/Drivers?\s*Ed/i.test(courseName)) credits = 1.25;
    else credits = 5;
  }

  // Detect course level from name
  const level = detectLevel(courseName);

  return {
    id: crypto.randomUUID(),
    name: courseName,
    grade: selectedGrade,
    level,
    credits: credits.toString(),
  };
}
