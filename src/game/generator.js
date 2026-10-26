// KenKen puzzle generation.
//
// A puzzle is:
//   { n, solution, cages, cageMap }
// where:
//   n         — grid size (4, 6 or 9)
//   solution  — the solved Latin square used to derive cage targets
//   cages     — array of { id, cells: [[r,c],...], op, target, label: [r,c] }
//   cageMap   — n x n array mapping each cell to its cage id

import { OP_ADD, OP_SUB, OP_MUL, OP_DIV, OP_GIVEN, OP_MODE_ALL, OP_MODE_ADDSUB, OP_MODE_MULDIV } from '../constants';

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// A randomized Latin square (valid Sudoku-like solution without boxes).
function randomLatinSquare(n) {
  const grid = Array.from({ length: n }, (_, r) =>
    Array.from({ length: n }, (_, c) => ((r + c) % n) + 1)
  );

  // Relabel digits.
  const perm = shuffle(Array.from({ length: n }, (_, i) => i + 1));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      grid[r][c] = perm[grid[r][c] - 1];
    }
  }

  // Shuffle whole rows and columns (preserves the Latin property).
  const rowOrder = shuffle(Array.from({ length: n }, (_, i) => i));
  const colOrder = shuffle(Array.from({ length: n }, (_, i) => i));
  const out = Array.from({ length: n }, () => Array(n).fill(0));
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      out[r][c] = grid[rowOrder[r]][colOrder[c]];
    }
  }
  return out;
}

function neighbors(r, c, n) {
  const res = [];
  if (r > 0) res.push([r - 1, c]);
  if (r < n - 1) res.push([r + 1, c]);
  if (c > 0) res.push([r, c - 1]);
  if (c < n - 1) res.push([r, c + 1]);
  return res;
}

// Pick a cage size tuned for the grid size (bigger grids allow bigger cages).
function pickCageSize(n, opMode) {
  // Multiplication/division-only puzzles keep cages small so targets stay reasonable.
  if (opMode === OP_MODE_MULDIV) {
    const r = Math.random();
    if (r < 0.12) return 1;
    if (r < 0.72) return 2;
    return 3;
  }

  const r = Math.random();
  if (n === 4) {
    if (r < 0.12) return 1;
    if (r < 0.62) return 2;
    if (r < 0.95) return 3;
    return 4;
  }
  if (n === 6) {
    if (r < 0.1) return 1;
    if (r < 0.45) return 2;
    if (r < 0.78) return 3;
    if (r < 0.95) return 4;
    return 5;
  }
  // n = 9
  if (r < 0.08) return 1;
  if (r < 0.32) return 2;
  if (r < 0.58) return 3;
  if (r < 0.78) return 4;
  if (r < 0.94) return 5;
  return 6;
}

// Partition the grid into connected cages via randomized flood-fill growth.
function partitionCages(n, opMode) {
  const assigned = Array.from({ length: n }, () => Array(n).fill(false));
  const cages = [];
  const all = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) all.push([r, c]);
  }

  while (true) {
    const remaining = all.filter(([r, c]) => !assigned[r][c]);
    if (remaining.length === 0) break;

    const [sr, sc] = remaining[Math.floor(Math.random() * remaining.length)];
    const targetSize = Math.min(pickCageSize(n, opMode), remaining.length);
    const cage = [[sr, sc]];
    assigned[sr][sc] = true;

    while (cage.length < targetSize) {
      const seen = new Set();
      const frontier = [];
      for (const [r, c] of cage) {
        for (const [nr, nc] of neighbors(r, c, n)) {
          if (!assigned[nr][nc]) {
            const key = nr * n + nc;
            if (!seen.has(key)) {
              seen.add(key);
              frontier.push([nr, nc]);
            }
          }
        }
      }
      if (frontier.length === 0) break;
      const [nr, nc] = frontier[Math.floor(Math.random() * frontier.length)];
      cage.push([nr, nc]);
      assigned[nr][nc] = true;
    }

    cages.push(cage);
  }
  return cages;
}

// Determine an operation and target for a cage from the solved grid.
function computeCage(cage, solution, opMode) {
  if (cage.length === 1) {
    const [r, c] = cage[0];
    return { op: OP_GIVEN, target: solution[r][c] };
  }

  const vals = cage.map(([r, c]) => solution[r][c]);

  if (cage.length === 2) {
    const [a, b] = vals;
    const hi = Math.max(a, b);
    const lo = Math.min(a, b);
    const canSub = a !== b;
    const canDiv = a !== b && hi % lo === 0;

    if (opMode === OP_MODE_ADDSUB) {
      const options = [];
      if (canSub) options.push({ op: OP_SUB, target: hi - lo });
      options.push({ op: OP_ADD, target: a + b });
      return options[Math.floor(Math.random() * options.length)];
    }
    if (opMode === OP_MODE_MULDIV) {
      const options = [];
      if (canDiv) options.push({ op: OP_DIV, target: hi / lo });
      options.push({ op: OP_MUL, target: a * b });
      return options[Math.floor(Math.random() * options.length)];
    }

    // OP_MODE_ALL — mix everything.
    const options = [
      { op: OP_ADD, target: a + b },
      { op: OP_MUL, target: a * b },
    ];
    if (canSub) options.push({ op: OP_SUB, target: hi - lo });
    if (canDiv) options.push({ op: OP_DIV, target: hi / lo });
    return options[Math.floor(Math.random() * options.length)];
  }

  // 3+ cells: only addition or multiplication are valid (subtraction and
  // division cages always have exactly two cells).
  if (opMode === OP_MODE_MULDIV) {
    return { op: OP_MUL, target: vals.reduce((s, v) => s * v, 1) };
  }
  const sum = vals.reduce((s, v) => s + v, 0);
  if (opMode === OP_MODE_ALL && cage.length === 3) {
    const prod = vals.reduce((s, v) => s * v, 1);
    if (prod <= 400 && Math.random() < 0.35) {
      return { op: OP_MUL, target: prod };
    }
  }
  return { op: OP_ADD, target: sum };
}

export function generatePuzzle(n, opMode = OP_MODE_ALL) {
  const solution = randomLatinSquare(n);
  const rawCages = partitionCages(n, opMode);

  const cages = rawCages.map((cells, id) => {
    const { op, target } = computeCage(cells, solution, opMode);
    const label = cells.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1])[0];
    return { id, cells, op, target, label };
  });

  const cageMap = Array.from({ length: n }, () => Array(n).fill(-1));
  for (const cage of cages) {
    for (const [r, c] of cage.cells) cageMap[r][c] = cage.id;
  }

  return { n, solution, cages, cageMap };
}
