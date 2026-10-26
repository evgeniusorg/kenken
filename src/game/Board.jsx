import { OP_GIVEN } from '../constants';

// Renders the KenKen grid: cage boundaries are drawn with per-cell top/left
// borders (the outer frame comes from .ken-board), labels show the target and
// operation in each cage's top-left cell.
export const Board = ({ puzzle, grid, selected, conflicts, onCellClick }) => {
  const { n, cageMap, cages } = puzzle;

  const sel = selected;
  const selCageId = sel ? cageMap[sel[0]][sel[1]] : -1;
  const selValue = sel ? grid[sel[0]][sel[1]].value : null;

  const labelByCage = new Map();
  for (const cage of cages) labelByCage.set(cage.id, cage);

  const cells = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const cageId = cageMap[r][c];
      const topThick = r > 0 && cageMap[r - 1][c] !== cageId;
      const leftThick = c > 0 && cageMap[r][c - 1] !== cageId;

      const style = {
        borderTopWidth: r === 0 ? 0 : topThick ? 2 : 1,
        borderTopColor: topThick ? 'var(--thick-line)' : 'var(--thin-line)',
        borderLeftWidth: c === 0 ? 0 : leftThick ? 2 : 1,
        borderLeftColor: leftThick ? 'var(--thick-line)' : 'var(--thin-line)',
      };

      const isSelected = sel && sel[0] === r && sel[1] === c;
      const cell = grid[r][c];
      const isPeerRowCol = sel && !isSelected && (r === sel[0] || c === sel[1]);
      const isPeerCage = sel && !isSelected && cageId === selCageId;
      const isSameValue =
        !isSelected &&
        cell.value !== null &&
        selValue !== null &&
        cell.value === selValue;
      const isConflict = conflicts.has(r * n + c);

      const cls = [
        'ken-cell',
        isSelected && 'selected',
        isPeerRowCol && 'peer-rowcol',
        isPeerCage && 'peer-cage',
        isSameValue && 'same-value',
        isConflict && 'conflict',
      ]
        .filter(Boolean)
        .join(' ');

      const cage = labelByCage.get(cageId);
      const isLabel = cage && cage.label[0] === r && cage.label[1] === c;

      cells.push(
        <div key={r * n + c} className={cls} style={style} onClick={() => onCellClick(r, c)}>
          {isLabel && (
            <span className="cage-label">
              <span className="cage-target">{cage.target}</span>
              {cage.op !== OP_GIVEN && <span className="cage-op">{cage.op}</span>}
            </span>
          )}
          {cell.value !== null ? (
            <span className="cell-value">{cell.value}</span>
          ) : cell.notes.length > 0 ? (
            <Notes notes={cell.notes} n={n} />
          ) : null}
        </div>
      );
    }
  }

  return (
    <div className="ken-board" data-size={n}>
      {cells}
    </div>
  );
};

const Notes = ({ notes, n }) => {
  const cols = n === 4 ? 2 : 3;
  const digits = Array.from({ length: n }, (_, i) => i + 1);
  return (
    <span className="notes" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {digits.map((d) => (
        <span key={d} className={notes.includes(d) ? 'note-on' : 'note-empty'}>
          {d}
        </span>
      ))}
    </span>
  );
};
