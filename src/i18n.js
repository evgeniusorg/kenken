import { LS_LANG_KEY } from './constants';

export const LANGS = ['en', 'ru'];

const STRINGS = {
  en: {
    newGame: 'New game',
    menu: 'Menu',
    close: 'Close',
    settings: 'Settings',
    about: 'About',
    share: 'Share',
    time: 'Time',
    best: 'Best',
    sound: 'Sound',
    language: 'Language',
    lightBackground: 'Light background',
    hints: 'Hints',
    difficulty: 'Grid size',
    operations: 'Operations',
    opAll: 'All',
    opAddSub: '+/−',
    opMulDiv: '×/÷',
    resetStats: 'Reset statistics',
    notes: 'Notes',
    erase: 'Erase',
    won: 'Solved!',
    wonTime: 'Time',
    newBest: 'New best time!',
    shareHint: 'Scan the QR code to open the game',
    installTitle: 'Install the app',
    installGotIt: 'Got it',
    aboutP1: 'KenKen is a logic puzzle that combines Sudoku with arithmetic.',
    aboutHow: 'How to play:',
    aboutLi1: 'Fill the grid so that every row and every column contains each digit exactly once.',
    aboutLi2: 'Each bold-outlined block (cage) must combine its digits to reach the target shown in its corner.',
    aboutLi3: 'Use the operation (+, −, ×, ÷) to hit the cage target.',
    aboutLi4: 'Digits may repeat inside a cage, as long as they are not in the same row or column.',
    aboutLi5: 'Tap a cell, then tap a digit. Use Notes to mark candidates and Erase to clear a cell.',
  },
  ru: {
    newGame: 'Новая игра',
    menu: 'Меню',
    close: 'Закрыть',
    settings: 'Настройки',
    about: 'О проекте',
    share: 'Поделиться',
    time: 'Время',
    best: 'Рекорд',
    sound: 'Звук',
    language: 'Язык',
    lightBackground: 'Светлый фон',
    hints: 'Подсказки',
    difficulty: 'Размер поля',
    operations: 'Операции',
    opAll: 'Все',
    opAddSub: '+/−',
    opMulDiv: '×/÷',
    resetStats: 'Сбросить статистику',
    notes: 'Заметки',
    erase: 'Стереть',
    won: 'Решено!',
    wonTime: 'Время',
    newBest: 'Новый рекорд времени!',
    shareHint: 'Отсканируйте QR-код, чтобы открыть игру',
    installTitle: 'Установите приложение',
    installGotIt: 'Понятно',
    aboutP1: 'КенКен — логическая головоломка, сочетающая судоку и арифметику.',
    aboutHow: 'Как играть:',
    aboutLi1: 'Заполните поле так, чтобы в каждой строке и каждом столбце цифры встречались ровно по одному разу.',
    aboutLi2: 'В каждом блоке, обведённом жирной линией, цифры должны давать число в его углу.',
    aboutLi3: 'Используйте знак действия (+, −, ×, ÷), чтобы получить число блока.',
    aboutLi4: 'Внутри блока цифры могут повторяться, если они не стоят в одной строке или столбце.',
    aboutLi5: 'Коснитесь клетки, затем цифры. «Заметки» — чтобы отметить кандидатов, «Стереть» — чтобы очистить клетку.',
  },
};

export const INSTALL_STEPS = {
  en: {
    ios: [
      'Open this page in Safari.',
      'Tap the Share button — the square with an up arrow.',
      'Choose "Add to Home Screen".',
      'Tap "Add".',
    ],
    android: [
      'Open the browser menu — the "⋮" button in the corner.',
      'Choose "Install app" or "Add to Home screen".',
      'Confirm the installation.',
    ],
    other: [
      'Tap the install icon in the browser address bar.',
      'Confirm the installation.',
    ],
  },
  ru: {
    ios: [
      'Откройте эту страницу в браузере Safari.',
      'Нажмите кнопку «Поделиться» — квадрат со стрелкой вверх.',
      'Выберите «На экран "Домой"».',
      'Нажмите «Добавить».',
    ],
    android: [
      'Откройте меню браузера — кнопка «⋮» в углу.',
      'Выберите «Установить приложение» или «Добавить на главный экран».',
      'Подтвердите установку.',
    ],
    other: [
      'Нажмите значок установки в адресной строке браузера.',
      'Подтвердите установку приложения.',
    ],
  },
};

export function detectLang() {
  try {
    const nav = (navigator.language || navigator.userLanguage || '').toLowerCase();
    return nav.startsWith('ru') ? 'ru' : 'en';
  } catch (e) {
    return 'en';
  }
}

export function loadLang() {
  try {
    const saved = localStorage.getItem(LS_LANG_KEY);
    if (saved === 'en' || saved === 'ru') {
      return saved;
    }
  } catch (e) {
    // ignore storage errors
  }
  return detectLang();
}

export function saveLang(lang) {
  try {
    localStorage.setItem(LS_LANG_KEY, lang);
  } catch (e) {
    // ignore storage errors
  }
}

export function t(lang, key) {
  return (STRINGS[lang] && STRINGS[lang][key]) || STRINGS.en[key] || key;
}
