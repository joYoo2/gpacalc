# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev      # Start Vite dev server with hot reload
npm run build    # Production build
npm run preview  # Preview production build
```

## Architecture Overview

React + Vite single-page application for calculating weighted GPAs and tracking student rankings. Uses localStorage for persistence (no backend).

### State Management

All state lives in `App.jsx` and flows down to components:
- `years` - Array of year objects containing courses
- `students` - Leaderboard data (separate localStorage key)
- `view` - Toggle between 'calculator' and 'leaderboard'
- `currentStudentId` - For editing existing students

### Key Components

- **App.jsx** - Root state, view switching, localStorage sync
- **Year.jsx** - Year section with course list, reordering controls
- **CourseRow.jsx** - Individual course entry (name, grade, level, credits)
- **Leaderboard.jsx** - Student rankings with year filtering and rank change indicators
- **ImportButton.jsx** - PDF report card importer

### Utilities

- **gpaCalculator.js** - GPA calculation with Glen Rock HS weighting (AP +0.5, Honors +0.3)
- **reportCardParser.js** - PDF text extraction for Glen Rock report cards using pdfjs-dist
- **leaderboardStorage.js** - localStorage persistence and JSON import/export

### GPA Calculation

Weighted GPA formula: `(gradePoints + levelWeight) × credits` summed across courses, divided by total credits.

Grade scale: A+=4.3 down to F=0.0
Level weights: AP=+0.5, Honors=+0.3, Advanced/CP=0.0

### Storage Keys

- `glenrock-gpa-calculator` - Year/course data
- `glenrock-gpa-leaderboard` - Student leaderboard
