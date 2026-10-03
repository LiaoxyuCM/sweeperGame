import "./style.scss";

const colors: Record<string, [string, string, string, string, string, string, string, string]> = {
  classic: ['blue', 'green', 'red', 'darkblue', 'brown', 'cyan', 'black', 'gray'],
  modern: ['#005ec9', '#00c06d', '#a39e07', '#f58e19', '#f12711', '#c471ed', '#8E2DE2', '#4A00E0'],
  gray: ['#888', '#777', '#666', '#555', '#444', '#333', '#222', '#111']
}
let colorScheme: string = "modern";
let MINES: number = 10;
let CHEAT: {showMines: boolean; flagJudgement: boolean} = {
  showMines: false,
  flagJudgement: false
};
const ROWS: number = 10;
const COLS: number = 10;
let board: {mine: boolean; revealed: boolean; flagged: boolean; count: number}[][] = [];
let gameOver: boolean = false;
let flags: number = 0;
let revealed: number = 0;
let isFirstClick: boolean = true; // 标记第一次点击
let longPressTimer: null | number = null;
const LONG_PRESS_TIME: number = 250;

document.addEventListener("DOMContentLoaded", () => {
  const boardElement = document.getElementById('board')!;
  const statusElement = document.getElementById('status')!;
  const resetButton = document.getElementById('reset')!;
  function revealColor() {
    document.querySelectorAll("#testb .cell.revealed")!.forEach(cell => {
      if (cell.textContent) {
        cell.style.color = (colors[colorScheme] || colors.modern)[parseInt(cell.textContent.trim()) - 1];
      }
    })
  }
  revealColor();
  // 移动端长按
  function initGame() {
    function startLongPress(r: number, c: number) {
      longPressTimer = setTimeout(() => {
        flagCell(r, c);
        longPressTimer = null;
      }, LONG_PRESS_TIME);
    }
    function cancelLongPress(r: number, c: number, j: boolean = true) {
      if (longPressTimer !== null) {
        clearTimeout(longPressTimer);
        if (j) {revealCell(r, c)};
        longPressTimer = null;
      }
    }
    // 初始化只创建空棋盘，不埋雷
    board = [];
    gameOver = false;
    flags = 0;
    revealed = 0;
    isFirstClick = true; // 标记第一次点击
    boardElement.innerHTML = '';
    boardElement.classList.remove("win", "lose");
    statusElement.textContent = `💣 ${MINES}`;
    for (let r = 0; r < ROWS; r++) {
      board[r] = [];
      for (let c = 0; c < COLS; c++) {
        board[r][c] = { mine: false, revealed: false, flagged: false, count: 0 };
      }
    }
    // 渲染格子
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = String(r);
        cell.dataset.col = String(c);
        cell.addEventListener('click', () => revealCell(r, c));
        cell.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          flagCell(r, c);
        });
        cell.addEventListener('touchstart', (e) => {
          e.preventDefault();
          startLongPress(r, c);
        });
        cell.addEventListener('touchend', () => {cancelLongPress(r, c)});
        cell.addEventListener('touchmove', () => {cancelLongPress(r, c, false)});
        boardElement.appendChild(cell);
      }
    }
  }
  function generateMines(firstR: number, firstC: number) {
    let minesPlaced: number = 0;
    while (minesPlaced < MINES) {
      const r: number = Math.floor(Math.random() * ROWS);
      const c: number = Math.floor(Math.random() * COLS);
      // 避开第一次点击的格子
      if (r === firstR && c === firstC) continue;
      if (!board[r][c].mine) {
        board[r][c].mine = true;
        minesPlaced++;
      }
    }
    // 计算数字
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!board[r][c].mine) {
          let count = 0;
          for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
              if (i === 0 && j === 0) continue;
              const nr = r + i;
              const nc = c + j;
              if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && board[nr][nc].mine) count++;
            }
          }
          board[r][c].count = count;
        }
      }
    }
  }
  // 翻开格子
  function revealCell(r: number, c: number) {
    if (gameOver || board[r][c].revealed || board[r][c].flagged) return;
    // 第一次点击：先生成雷，保证不是雷
    if (isFirstClick) {
      generateMines(r, c);
      if (CHEAT.showMines) {
        for (let r_ = 0; r_ < ROWS; r_++) {
          for (let c_ = 0; c_ < COLS; c_++) {
            if (board[r_][c_].mine) {
              updateCell(r_, c_);
            }
          }
        }
      }
      isFirstClick = false;
    }
    if (board[r][c].mine) {
      gameOver = true;
      boardElement.classList.add("lose");
      showAllMines();
      document.querySelector(`#board [data-row="${r}"][data-col="${c}"]`)!.textContent = '💥';
      return;
    }
    board[r][c].revealed = true;
    revealed++;
    updateCell(r, c);
    if (board[r][c].count === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          if (i === 0 && j === 0) continue;
          const nr = r + i;
          const nc = c + j;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) revealCell(nr, nc);
        }
      }
    }
    if (revealed === ROWS * COLS - MINES) {
      gameOver = true;
      boardElement.classList.add("win");
      statusElement.textContent = '💣 0';
    }
  }
  // 插旗
  function flagCell(r: number, c: number) {
    if (gameOver || board[r][c].revealed) return;
    board[r][c].flagged = !board[r][c].flagged;
    flags += board[r][c].flagged ? 1 : -1;
    statusElement.textContent = `💣 ${MINES - flags}`;
    updateCell(r, c);
  }
  function updateAllFlags() {
    const cells = document.querySelectorAll("#board .cell.flagged")!;
    cells.forEach(cell => {
      if (!cell.classList.contains("mine")) {
        cell.textContent = '❌';
      }
    })
  }
  // 更新显示
  function updateCell(r: number, c: number) {
    const cell = document.querySelector(`#board [data-row="${r}"][data-col="${c}"]`)!;
    cell.classList.remove('revealed', 'flagged', 'mine');
    if (board[r][c].revealed) {
      cell.classList.add('revealed');
      if (board[r][c].mine) {
        cell.classList.add('mine');
        if ((cell.textContent != '💥') && (cell.textContent != '🚩')) {
          cell.textContent = '💣'
        }
      } else if (board[r][c].count > 0) {
        cell.textContent = String(board[r][c].count);
        cell.style.color = colors[colorScheme][board[r][c].count - 1];
      }
    } else if (board[r][c].flagged) {
      cell.classList.add('flagged');
      cell.textContent = '🚩';
      if (CHEAT.flagJudgement && !(board[r][c].mine)) {
        cell.textContent = '❌';
      }
    } else {
      cell.textContent = '';
      if (CHEAT.showMines && board[r][c].mine) {
        cell.textContent = '💣';
      }
    }
  }
  // 游戏结束展示所有雷
  function showAllMines() {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c].mine) {
          board[r][c].revealed = true;
          updateCell(r, c);
        }
      }
    }
    updateAllFlags();
  }

  const minesSet = document.querySelector('.minesset')!;
  const schemeSet = document.querySelector('.schemeset')!;
  const minesSpan = document.querySelector('.show_mines')!;
  const showSetElem = document.querySelector(".showsettings")!;
  const coverboard = document.querySelector(".coverboard")!;
  const settingsContainer = document.querySelector(".settings-container")!;
  // 实时更新显示
  minesSet.addEventListener("input", () => {
    minesSpan.textContent = minesSet.value || "0";
  })
  const cheatControl = {
    showMines: document.querySelector('.cheat_showMines')!,
    flagJudgement: document.querySelector('.cheat_flagJudgement')!,
  }
  function showSettings() {
    minesSet.value = MINES;
    schemeSet.value = colorScheme;
    cheatControl.showMines.checked = CHEAT.showMines;
    cheatControl.flagJudgement.checked = CHEAT.flagJudgement;
    minesSpan.textContent = minesSet.value || "0";
    showSetElem.style.display = "none";
    coverboard.style.display = "flex";
    settingsContainer.style.display = "flex";
  }
  function hideSettings() {
    showSetElem.style.display = "inline-block";
    settingsContainer.style.display = "none";
    coverboard.style.display = "none";
  }
  function submit() {
    MINES = parseInt(minesSet.value || "0");
    colorScheme = schemeSet.value || "modern";
    CHEAT.showMines = cheatControl.showMines.checked || false;
    CHEAT.flagJudgement = cheatControl.flagJudgement.checked || false;
    hideSettings();
    initGame();
    revealColor();
  }

  resetButton.addEventListener('click', initGame);

  showSetElem.addEventListener("click", showSettings);
  document.querySelector(".cancel")!.addEventListener("click", hideSettings);
  document.querySelector(".submit")!.addEventListener("click", submit);

  colorScheme = schemeSet.value || "modern";
  revealColor();

  initGame();
});
