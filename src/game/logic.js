// Validation and state helpers for the KenKen board.

import { OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_GIVEN } from '../constants';

// A cell is { value: number|null, notes: number[] }.
export function createEmptyGrid(n) {
  return Array.from({ length: n }, () =>
    Array.from({ length: n }, () => ({ value: null, notes: [] }))
  );
}

export function cloneGrid(grid) {
  return grid.map((row) => row.map((cell) => ({ value: cell.value, notes: cell.notes.slice() })));
}

// Does a cage's set of values satisfy its operation?
export function cageSatisfied(op, target, vals) {
  if (op === OP_GIVEN) return vals[0] === target;
  if (op === OP_ADD) return vals.reduce((s, v) => s + v, 0) === target;
  if (op === OP_MUL) return vals.reduce((s, v) => s * v, 1) === target;
  if (op === OP_SUB) {
    const [a, b] = vals;
    return Math.abs(a - b) === target;
  }
  if (op === OP_DIV) {
    const [a, b] = vals;
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    return lo !== 0 && hi % lo === 0 && hi / lo === target;
  }
  return false;
}

// Returns a Set of cell keys ("r*c+... ") — actually "r,c" index r*n+c — that
// are currently wrong: row/column duplicates, and fully-filled cages that
// violate their operation.
export function findConflicts(grid, n, cages) {
  const conflicts = new Set();

  const markDuplicates = (positionsByValue) => {
    for (const cells of positionsByValue.values()) {
      if (cells.length > 1) {
        for (const [r, c] of cells) conflicts.add(r * n + c);
      }
    }
  };

  // Rows.
  for (let r = 0; r < n; r++) {
    const pos = new Map();
    for (let c = 0; c < n; c++) {
      const v = grid[r][c].value;
      if (v !== null) {
        if (!pos.has(v)) pos.set(v, []);
        pos.get(v).push([r, c]);
      }
    }
    markDuplicates(pos);
  }

  // Columns.
  for (let c = 0; c < n; c++) {
    const pos = new Map();
    for (let r = 0; r < n; r++) {
      const v = grid[r][c].value;
      if (v !== null) {
        if (!pos.has(v)) pos.set(v, []);
        pos.get(v).push([r, c]);
      }
    }
    markDuplicates(pos);
  }

  // Cages: only flag when the cage is fully filled.
  for (const cage of cages) {
    const vals = cage.cells.map(([r, c]) => grid[r][c].value);
    if (vals.some((v) => v === null)) continue;
    if (!cageSatisfied(cage.op, cage.target, vals)) {
      for (const [r, c] of cage.cells) conflicts.add(r * n + c);
    }
  }

  return conflicts;
}

export function isSolved(grid, n, cages) {
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (grid[r][c].value === null) return false;
    }
  }
  return findConflicts(grid, n, cages).size === 0;
}

// Digits that can no longer be placed in the selected cell because they already
// appear in its row or column (a Sudoku-style elimination hint).
export function disabledDigitsForCell(grid, selected) {
  const disabled = new Set();
  if (!selected) return disabled;
  const [r, c] = selected;
  const n = grid.length;
  for (let i = 0; i < n; i++) {
    const rv = grid[r][i].value;
    if (rv !== null && i !== c) disabled.add(rv);
    const cv = grid[i][c].value;
    if (cv !== null && i !== r) disabled.add(cv);
  }
  return disabled;
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
