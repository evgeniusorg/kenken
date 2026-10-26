import { useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import {
  IoMdRefresh,
  IoMdMenu,
  IoMdSettings,
  IoMdInformationCircleOutline,
  IoMdShare,
  IoMdTrophy,
  IoMdTime,
  IoMdVolumeHigh,
  IoMdColorPalette,
  IoMdGlobe,
  IoMdApps,
  IoMdCalculator,
  IoMdBulb,
  IoMdTrash,
  IoMdBackspace,
  IoMdCreate,
} from 'react-icons/io';

import {
  SIZES,
  DEFAULT_SIZE,
  OP_MODES,
  DEFAULT_OP_MODE,
  OP_MODE_ALL,
  OP_MODE_ADDSUB,
  OP_MODE_MULDIV,
  LS_BEST_KEY,
  LS_LIGHT_KEY,
  LS_HINTS_KEY,
  LS_SIZE_KEY,
  LS_OP_MODE_KEY,
  LS_INSTALL_SHOWN_KEY,
  SHARE_URL,
  GAME_STATUS,
} from '../constants';
import { INSTALL_STEPS, LANGS, t } from '../i18n';
import { isSoundEnabled, setSoundEnabled, playClick, playPlace, playErase, playWin, playMenu } from '../sound';
import { Modal } from '../Modal';
import { Fireworks } from '../Fireworks';
import { generatePuzzle } from './generator';
import { createEmptyGrid, cloneGrid, findConflicts, isSolved, formatTime, disabledDigitsForCell } from './logic';
import { Board } from './Board';
import { NumberPad } from './NumberPad';

function loadBest() {
  try {
    const raw = localStorage.getItem(LS_BEST_KEY);
    if (raw) {
      const obj = JSON.parse(raw);
      return { 4: obj['4'] || null, 6: obj['6'] || null, 9: obj['9'] || null };
    }
  } catch (e) {
    // ignore
  }
  return { 4: null, 6: null, 9: null };
}

function saveBestEntry(size, seconds) {
  const all = loadBest();
  all[size] = seconds;
  try {
    localStorage.setItem(LS_BEST_KEY, JSON.stringify(all));
  } catch (e) {
    // ignore
  }
}

function clearBest() {
  try {
    localStorage.removeItem(LS_BEST_KEY);
  } catch (e) {
    // ignore
  }
}

function loadLight() {
  try {
    return localStorage.getItem(LS_LIGHT_KEY) === '1';
  } catch (e) {
    return false;
  }
}

function saveLight(value) {
  try {
    localStorage.setItem(LS_LIGHT_KEY, value ? '1' : '0');
  } catch (e) {
    // ignore
  }
}

function loadHints() {
  try {
    return localStorage.getItem(LS_HINTS_KEY) !== '0';
  } catch (e) {
    return true;
  }
}

function saveHints(value) {
  try {
    localStorage.setItem(LS_HINTS_KEY, value ? '1' : '0');
  } catch (e) {
    // ignore
  }
}

function loadSize() {
  try {
    const v = parseInt(localStorage.getItem(LS_SIZE_KEY), 10);
    if (SIZES.includes(v)) return v;
  } catch (e) {
    // ignore
  }
  return DEFAULT_SIZE;
}

function saveSize(value) {
  try {
    localStorage.setItem(LS_SIZE_KEY, String(value));
  } catch (e) {
    // ignore
  }
}

function loadOpMode() {
  try {
    const v = localStorage.getItem(LS_OP_MODE_KEY);
    if (OP_MODES.includes(v)) return v;
  } catch (e) {
    // ignore
  }
  return DEFAULT_OP_MODE;
}

function saveOpMode(value) {
  try {
    localStorage.setItem(LS_OP_MODE_KEY, value);
  } catch (e) {
    // ignore
  }
}

const INSTALL_REMINDER_MS = 3 * 24 * 60 * 60 * 1000;

const detectDevice = () => {
  const ua = navigator.userAgent || '';
  if (/iPhone|iPad|iPod/i.test(ua)) return 'ios';
  if (/Android/i.test(ua)) return 'android';
  return 'other';
};

const isInstalled = () => {
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return true;
  if (typeof navigator.standalone === 'boolean') return navigator.standalone;
  return false;
};

const shouldShowInstall = () => {
  if (isInstalled()) return false;
  try {
    const last = parseInt(localStorage.getItem(LS_INSTALL_SHOWN_KEY) || '0', 10);
    if (Date.now() - last < INSTALL_REMINDER_MS) return false;
  } catch (e) {
    // ignore
  }
  return true;
};

const getInstallSteps = (lang) => {
  const byLang = INSTALL_STEPS[lang] || INSTALL_STEPS.en;
  return byLang[detectDevice()] || byLang.other;
};

const OP_MODE_LABEL_KEY = {
  [OP_MODE_ALL]: 'opAll',
  [OP_MODE_ADDSUB]: 'opAddSub',
  [OP_MODE_MULDIV]: 'opMulDiv',
};

const Header = ({ lang, elapsed, bestTime, menuOpen, spinCount, onNewGame, onToggleMenu, openModal, setMenuOpen }) => (
  <div className="header">
    <div className="stats">
      <div className="stats-item" title={t(lang, 'best')}>
        <IoMdTrophy size={28} />
        <span className="stats-text">{bestTime}</span>
      </div>
      <div className="stats-item" title={t(lang, 'time')}>
        <IoMdTime size={28} />
        <span className="stats-text">{formatTime(elapsed)}</span>
      </div>
    </div>
    <div className="controls">
      <button type="button" className="icon-btn" onClick={onNewGame} aria-label={t(lang, 'newGame')}>
        <IoMdRefresh size={30} className={spinCount ? 'refresh-spin' : undefined} />
      </button>
      <div className="menu-wrap">
        <button
          type="button"
          className="icon-btn"
          onClick={onToggleMenu}
          aria-label={t(lang, 'menu')}
          aria-haspopup="true"
          aria-expanded={menuOpen}
        >
          <IoMdMenu size={30} />
        </button>
        {menuOpen && (
          <>
            <div className="menu-backdrop" onClick={() => setMenuOpen(false)} />
            <div className="menu">
              <button type="button" className="menu-item" onClick={() => openModal('settings')}>
                <IoMdSettings size={22} />
                <span>{t(lang, 'settings')}</span>
              </button>
              <button type="button" className="menu-item" onClick={() => openModal('about')}>
                <IoMdInformationCircleOutline size={22} />
                <span>{t(lang, 'about')}</span>
              </button>
              <button type="button" className="menu-item" onClick={() => openModal('share')}>
                <IoMdShare size={22} />
                <span>{t(lang, 'share')}</span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  </div>
);

export const Game = ({ lang, onSetLang }) => {
  const [size, setSize] = useState(loadSize);
  const [opMode, setOpMode] = useState(loadOpMode);
  const [puzzle, setPuzzle] = useState(() => generatePuzzle(loadSize(), loadOpMode()));
  const [grid, setGrid] = useState(() => createEmptyGrid(loadSize()));
  const [selected, setSelected] = useState(null);
  const [notesMode, setNotesMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState(GAME_STATUS.PLAYING);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [sound, setSound] = useState(isSoundEnabled);
  const [light, setLight] = useState(loadLight);
  const [hints, setHints] = useState(loadHints);
  const [best, setBest] = useState(loadBest);
  const [newBest, setNewBest] = useState(false);
  const [spinCount, setSpinCount] = useState(0);

  const conflicts = useMemo(
    () => findConflicts(grid, puzzle.n, puzzle.cages),
    [grid, puzzle]
  );

  const disabledDigits = useMemo(
    () => (hints && !notesMode ? disabledDigitsForCell(grid, selected) : new Set()),
    [hints, notesMode, grid, selected]
  );

  // Timer.
  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(id);
  }, [running]);

  // Win detection.
  useEffect(() => {
    if (status !== GAME_STATUS.PLAYING) return;
    if (!isSolved(grid, puzzle.n, puzzle.cages)) return;
    setRunning(false);
    setStatus(GAME_STATUS.WON);
    playWin();
    const prev = best[puzzle.n];
    const isNewBest = prev === null || elapsed < prev;
    setNewBest(isNewBest);
    if (isNewBest) {
      setBest((b) => ({ ...b, [puzzle.n]: elapsed }));
      saveBestEntry(puzzle.n, elapsed);
    }
    setModal('won');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grid]);

  // Install reminder.
  useEffect(() => {
    if (shouldShowInstall()) {
      setModal('install');
      try {
        localStorage.setItem(LS_INSTALL_SHOWN_KEY, String(Date.now()));
      } catch (e) {
        // ignore
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startNewGame = (nextSize, nextOpMode) => {
    playMenu();
    const n = nextSize ?? size;
    const mode = nextOpMode ?? opMode;
    setSpinCount((v) => v + 1);
    setPuzzle(generatePuzzle(n, mode));
    setGrid(createEmptyGrid(n));
    setSelected(null);
    setNotesMode(false);
    setElapsed(0);
    setRunning(false);
    setStatus(GAME_STATUS.PLAYING);
    setNewBest(false);
    setModal(null);
    setMenuOpen(false);
  };

  const changeSize = (n) => {
    if (n === size) return;
    setSize(n);
    saveSize(n);
    startNewGame(n);
  };

  const changeOpMode = (mode) => {
    if (mode === opMode) return;
    setOpMode(mode);
    saveOpMode(mode);
    startNewGame(size, mode);
  };

  const onToggleMenu = () => {
    playMenu();
    setMenuOpen((v) => !v);
  };

  const closeModal = () => {
    playClick();
    setModal(null);
  };

  const openModal = (name) => {
    playMenu();
    setMenuOpen(false);
    setModal(name);
  };

  const onResetStats = () => {
    playClick();
    setBest({ 4: null, 6: null, 9: null });
    clearBest();
    setModal(null);
  };

  const onCellClick = (r, c) => {
    if (status !== GAME_STATUS.PLAYING) return;
    playClick();
    if (selected && selected[0] === r && selected[1] === c) {
      setSelected(null);
    } else {
      setSelected([r, c]);
    }
  };

  const enterNumber = (d) => {
    if (status !== GAME_STATUS.PLAYING || !selected) return;
    const [r, c] = selected;
    const cell = grid[r][c];

    if (notesMode) {
      if (cell.value !== null) return;
      playClick();
      const next = cloneGrid(grid);
      const nc = next[r][c];
      const i = nc.notes.indexOf(d);
      if (i >= 0) nc.notes.splice(i, 1);
      else nc.notes.push(d);
      nc.notes.sort((a, b) => a - b);
      setGrid(next);
      if (!running) setRunning(true);
      return;
    }

    if (cell.value === d) {
      playClick();
      return;
    }

    playPlace();
    const next = cloneGrid(grid);
    next[r][c] = { value: d, notes: [] };
    setGrid(next);
    if (!running) setRunning(true);
  };

  const eraseSelected = () => {
    if (status !== GAME_STATUS.PLAYING || !selected) return;
    const [r, c] = selected;
    const cell = grid[r][c];
    if (cell.value === null && cell.notes.length === 0) return;
    playErase();
    const next = cloneGrid(grid);
    next[r][c] = { value: null, notes: [] };
    setGrid(next);
  };

  const toggleNotes = () => {
    playMenu();
    setNotesMode((v) => !v);
  };

  const moveSelection = (key) => {
    if (!selected) {
      setSelected([0, 0]);
      return;
    }
    const [r, c] = selected;
    let nr = r;
    let nc = c;
    if (key === 'ArrowUp') nr = Math.max(0, r - 1);
    else if (key === 'ArrowDown') nr = Math.min(puzzle.n - 1, r + 1);
    else if (key === 'ArrowLeft') nc = Math.max(0, c - 1);
    else if (key === 'ArrowRight') nc = Math.min(puzzle.n - 1, c + 1);
    setSelected([nr, nc]);
  };

  // Keyboard support for desktop.
  useEffect(() => {
    const onKey = (e) => {
      if (modal || menuOpen) return;
      if (status !== GAME_STATUS.PLAYING) return;
      const k = e.key;
      if (k >= '1' && k <= '9') {
        const d = parseInt(k, 10);
        if (d <= puzzle.n && !disabledDigits.has(d)) {
          e.preventDefault();
          enterNumber(d);
        }
        return;
      }
      if (k === 'Backspace' || k === 'Delete' || k === '0') {
        e.preventDefault();
        eraseSelected();
        return;
      }
      if (k === 'ArrowUp' || k === 'ArrowDown' || k === 'ArrowLeft' || k === 'ArrowRight') {
        e.preventDefault();
        moveSelection(k);
        return;
      }
      if (k.toLowerCase() === 'n') {
        setNotesMode((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modal, menuOpen, status, puzzle, selected, grid, notesMode, disabledDigits]);

  const bestTime = best[size] === null ? '--:--' : formatTime(best[size]);

  return (
    <div className={`app ${light ? 'theme-light' : 'theme-dark'}`}>
      <div className="main">
        <Header
          lang={lang}
          elapsed={elapsed}
          bestTime={bestTime}
          menuOpen={menuOpen}
          spinCount={spinCount}
          onNewGame={() => startNewGame()}
          onToggleMenu={onToggleMenu}
          openModal={openModal}
          setMenuOpen={setMenuOpen}
        />

        <div className="play-area">
          <div className="board-controls">
            <button
              type="button"
              className={`ctrl-btn ${notesMode ? 'ctrl-btn--active' : ''}`}
              onClick={toggleNotes}
              aria-label={t(lang, 'notes')}
              title={t(lang, 'notes')}
            >
              <IoMdCreate size={20} />
            </button>
            <button
              type="button"
              className="ctrl-btn"
              onClick={eraseSelected}
              aria-label={t(lang, 'erase')}
              title={t(lang, 'erase')}
            >
              <IoMdBackspace size={22} />
            </button>
          </div>

          <div className="board-wrap">
            <Board
              puzzle={puzzle}
              grid={grid}
              selected={selected}
              conflicts={conflicts}
              onCellClick={onCellClick}
            />
          </div>

          <NumberPad
            n={puzzle.n}
            disabledDigits={disabledDigits}
            onNumber={enterNumber}
          />
        </div>
      </div>

      {modal === 'settings' && (
        <Modal title={t(lang, 'settings')} closeLabel={t(lang, 'close')} onClose={closeModal}>
          <div className="settings-group">
            <label className="settings-row">
              <IoMdVolumeHigh size={22} />
              <span className="settings-row-label">{t(lang, 'sound')}</span>
              <input
                className="switch-input"
                type="checkbox"
                checked={sound}
                onChange={() => {
                  setSound(!sound);
                  setSoundEnabled(!sound);
                }}
              />
              <span className="switch-track"><span className="switch-thumb"></span></span>
            </label>
            <label className="settings-row">
              <IoMdColorPalette size={22} />
              <span className="settings-row-label">{t(lang, 'lightBackground')}</span>
              <input
                className="switch-input"
                type="checkbox"
                checked={light}
                onChange={() => {
                  setLight(!light);
                  saveLight(!light);
                }}
              />
              <span className="switch-track"><span className="switch-thumb"></span></span>
            </label>
            <label className="settings-row">
              <IoMdBulb size={22} />
              <span className="settings-row-label">{t(lang, 'hints')}</span>
              <input
                className="switch-input"
                type="checkbox"
                checked={hints}
                onChange={() => {
                  setHints(!hints);
                  saveHints(!hints);
                }}
              />
              <span className="switch-track"><span className="switch-thumb"></span></span>
            </label>
            <div className="settings-row">
              <IoMdGlobe size={22} />
              <span className="settings-row-label">{t(lang, 'language')}</span>
              <div className="lang-toggle">
                {LANGS.map((l) => (
                  <button
                    key={l}
                    type="button"
                    className={`lang-option ${lang === l ? 'active' : ''}`}
                    onClick={() => onSetLang(l)}
                  >
                    {l.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <IoMdApps size={22} />
              <span className="settings-row-label">{t(lang, 'difficulty')}</span>
              <div className="size-toggle">
                {SIZES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`size-option ${size === s ? 'active' : ''}`}
                    onClick={() => changeSize(s)}
                  >
                    {s}×{s}
                  </button>
                ))}
              </div>
            </div>
            <div className="settings-row">
              <IoMdCalculator size={22} />
              <span className="settings-row-label">{t(lang, 'operations')}</span>
              <div className="op-toggle">
                {OP_MODES.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={`op-option ${opMode === m ? 'active' : ''}`}
                    onClick={() => changeOpMode(m)}
                  >
                    {t(lang, OP_MODE_LABEL_KEY[m])}
                  </button>
                ))}
              </div>
            </div>
            <button type="button" className="settings-row" onClick={onResetStats}>
              <IoMdTrash size={22} />
              <span className="settings-row-label">{t(lang, 'resetStats')}</span>
            </button>
          </div>
        </Modal>
      )}

      {modal === 'about' && (
        <Modal title={t(lang, 'about')} closeLabel={t(lang, 'close')} onClose={closeModal}>
          <div className="about-body">
            <p>{t(lang, 'aboutP1')}</p>
            <p>{t(lang, 'aboutHow')}</p>
            <ul>
              <li>{t(lang, 'aboutLi1')}</li>
              <li>{t(lang, 'aboutLi2')}</li>
              <li>{t(lang, 'aboutLi3')}</li>
              <li>{t(lang, 'aboutLi4')}</li>
              <li>{t(lang, 'aboutLi5')}</li>
            </ul>
          </div>
        </Modal>
      )}

      {modal === 'share' && (
        <Modal title={t(lang, 'share')} closeLabel={t(lang, 'close')} onClose={closeModal}>
          <p className="share-hint">{t(lang, 'shareHint')}</p>
          <div className="qr">
            <QRCode value={SHARE_URL} size={180} />
          </div>
          <p className="qr-url">{SHARE_URL}</p>
        </Modal>
      )}

      {modal === 'install' && (
        <Modal title={t(lang, 'installTitle')} closeLabel={t(lang, 'close')} onClose={closeModal}>
          <div className="install-steps">
            <ol>
              {getInstallSteps(lang).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          </div>
          <button type="button" className="modal-btn" onClick={closeModal}>
            {t(lang, 'installGotIt')}
          </button>
        </Modal>
      )}

      {modal === 'won' && (
        <div className="modal-overlay">
          <Fireworks />
          <div className="modal modal--celebration" role="dialog" aria-modal="true">
            <div className="modal-header modal-header--center">
              <span className="modal-title">{t(lang, 'won')}</span>
            </div>
            <div className="modal-body won-body">
              <IoMdTrophy size={64} />
              <p className="won-time">{formatTime(elapsed)}</p>
              {newBest && <p className="won-best">{t(lang, 'newBest')}</p>}
              <button type="button" className="modal-btn" onClick={() => startNewGame()}>
                {t(lang, 'newGame')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
