
/**
 * Ячейка игрового поля
 */
class PlaygroundCell {
  /**
   * Конструктор
   * @param {Playground} pg Игровое поле
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца
   */
  constructor(pg, row, col) {
    this.playground = pg;
    this.col = col;
    this.row = row;
    this.id = `${pg.id}-cell-${row}-${col}`;
    this.ship = null;
    this.adjacentShipSet = new Set();
    this._adjacentCells = null;
    this.tested = false;
  }

  /**
   * Признак пустой ячейки
   */
  get empty() {
    return !this.ship;
  }

  /**
   * Признак свободной ячейки
   */
  get free() {
    return this.empty && !this.adjacentShipSet.size;
  }

  /**
   * Признак свободной ячейки для перетаскивания
   * @param {Ship} ship Корабль
   */
  freeToDrop(ship) {
    return (!this.ship || (this.ship == ship)) &&
      ((!this.adjacentShipSet.size) || 
       (this.adjacentShipSet.has(ship) && (this.adjacentShipSet.size == 1))
      );
  }

  /**
   * Соседние ячейки
   */
  get adjacentCells() {
    if (!this._adjacentCells) {
      this._adjacentCells = 
        this.playground.getAdjacentCells(this.row, this.col);
    }
    return this._adjacentCells;
  }

  /**
   * Попадание
   */
  hit() {
    const svg = doc.get("flame").cloneNode(true);
    setTimeout(() => { 
      svg.style.display = "block"; 
      this.ship.hit();
    }, 500);
    svg.id = "flame-" + this.id;
    this.element.appendChild(svg);
  }

  /**
   * Промах
   */
  miss() {
    const div = doc.get("circle-waves").cloneNode(true);
    setTimeout(() => div.style.display = "block", 500);
    div.id = "waves-" + this.id;
    this.element.appendChild(div);
  }

  /**
   * Выстрел в ячейку
   */
  shoot() {
    if (this.tested) {
      return 0;
    }
    this.tested = true;

    // если корабль
    if (this.empty) {
      // попадание
      this.miss();
      return -1;
    }

    // промах
    this.hit();
    return 1;
  }

  /**
   * Добавить ячейку в элемент
   * @param {HTMLElement|String} el 
   */
  addToDoc(el) {
    return doc.add({dst: el, tag: "div", id: this.id});
  }

  /**
   * Обработчик события нахождения на элементе
   * @param {DragEvent} ev 
   */
  dragOver = (ev) => {
    const svg = doc.get("drag-ghost");
    const ship = game.userShipMap.get(svg.dataset.id);
 
    if (this.playground.freeToDrop(this.row, this.col, ship)) {
      ev.preventDefault();
    } else {
    }
  }

  /**
   * Обработчик события попадания на элемент
   * @param {DragEvent} ev 
   */
  dragEnter = (ev) => {
    const svg = doc.get("drag-ghost");
    const ship = game.userShipMap.get(svg.dataset.id);
    const cellEl = this.element;

    if (this.playground.freeToDrop(this.row, this.col, ship)) {
      cellEl.classList.remove("game-cell-drop-dis");
      cellEl.classList.add("game-cell-drop-en");
    } else {
      cellEl.classList.remove("game-cell-drop-en");
      cellEl.classList.add("game-cell-drop-dis");
    }
  }

  /**
   * Обработчик события покидания элемента
   * @param {DragEvent} ev 
   */
  dragLeave = (ev) => {
    const cellEl = this.element;
    cellEl.classList.remove("game-cell-drop-en", "game-cell-drop-dis");
  }  

  /**
   * Обработчик события перетаскивания
   * @param {DragEvent} ev 
   */
  drop = (ev) => {
    ev.preventDefault();
    this.dragLeave(ev);
    const id = ev.dataTransfer.getData("data");
    const ship = game.userShipMap.get(id);
    ship.moveToCell(this);
  }

  /**
   * Разрешение перетаскивания
   */
  dropEn() {
    this.element.addEventListener("dragover", this.dragOver, false);
    this.element.addEventListener("dragenter", this.dragEnter, false);
    this.element.addEventListener("dragleave", this.dragLeave, false);
    this.element.addEventListener("drop", this.drop, false);
  }

  /**
   * Запрет перетаскивания
   */
  dropDis() {
    this.element.removeEventListener("dragover", this.dragOver);
    this.element.removeEventListener("dragenter", this.dragEnter);
    this.element.removeEventListener("dragleave", this.dragLeave);
    this.element.removeEventListener("drop",  this.drop);
  }

  /**
   * Плучить элемент
   */
  get element() {
    return doc.get(this.id);
  }
}

/**
 * Игровое поле
 */
class Playground {
  /**
   * Конструктор
   * @param {String} id Идентификатор
   * @param {String} type Тип (user | comp)
   */
  constructor(id, type) {
    this.id = id;
    this.type = type;
    this.cellMap = new Map();

    // создаем ячейки поля
    this.cells = [];
    for (let row = 0; row < 10; row++) {
      this.cells.push([]);
      for (let col = 0; col < 10; col++) {
        const cell = new PlaygroundCell(this, row, col);
        this.cellMap.set(cell.id, cell);
        this.cells[row].push(cell);
      }
    }
    // для удобство созадем инвертированный массив
    this.cellsInvert = [];
    for (let col = 0; col < 10; col++) {
      this.cellsInvert.push([]);
      for (let row = 0; row < 10; row++) {
        this.cellsInvert[col].push(this.cells[row][col]);
      }
    }
  }

  /**
   * Проверка координат
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца 
   */ 
  static checkCoord(row, col) {
    return (row >= 0) && (row < 10) && (col >= 0) && (col < 10);
  }

  /**
   * Получить ячейки
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца 
   * @param {Number} len Количество элементов
   * @param {String} dir Направление (w | h)
   * @returns {PlaygroundCell[]} Ячейки, возможно < len
   */
  getCells(row, col, len, dir) {
    if (!Playground.checkCoord(row, col)) {
      return [];
    }

    return (dir == "h") ? 
        this.cellsInvert[col].slice(row, row + len)
      : this.cells[row].slice(col, col + len)
      ;
  }

  /**
   * Смещения к соседним ячейкам
   */
  static get adjacentCellShifts() {
    if (!Playground._adjacentCellShifts) {
      Playground._adjacentCellShifts = [
        [-1, -1], [-1, 0], [-1, 1], 
        [ 0, -1],          [ 0, 1], 
        [ 1, -1], [ 1, 0], [ 1, 1]
      ];
    }
    return Playground._adjacentCellShifts;
  } 

  /**
   * Соседние ячейки
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца
   * @returns {PlaygroundCell[]} Соседние ячейки
   */
  getAdjacentCells(row, col, shifts = Playground.adjacentCellShifts) {
    if (!Playground.checkCoord(row, col)) {
      return [];
    } 

    const cells = [];
    for (const [dr, dc] of shifts) {
      if (Playground.checkCoord(row + dr, col + dc)) {
        cells.push(this.cells[row + dr][col + dc]);
      }      
    }

    return cells;
  }

  /**
   * Признак пустых ячеек
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца 
   * @param {Number} len Количество элементов
   * @param {String} dir Направление (w | h) 
   */
  empty(row, col, len, dir) {
    const cells = this.getCells(row, col, len, dir);
    return (cells.length == len) && cells.every(cell => cell.empty);
  }

  /**
   * Признак совободных ячеек
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца 
   * @param {Number} len Количество элементов
   * @param {String} dir Направление (w | h) 
   */
  free(row, col, len, dir) {
    const cells = this.getCells(row, col, len, dir);
    return (cells.length == len) && cells.every(cell => cell.free);
  }

  /**
   * Получить свободные ячейки
   * @param {Number} len Количество элементов
   * @param {String} dir Направление (w | h)
   * @returns {PlaygroundCell[]} Свободные ячейки
   */
  getFreeCells(len, dir) {
    const cellArr = (dir == "h") ? this.cellsInvert : this.cells;
    const result = [];
    for (let i = 0; i < 10; i++) {
      for (let j = 0; j <= (10 - len); j++) {
        const isFree = (dir == "h") ?
            this.free(j, i, len, dir) 
          : this.free(i, j, len, dir)
          ; 
        if (isFree) {
          result.push(cellArr[i][j]);
        }
      }
    }
    return result;
  }

  /**
   * Признак совободных ячеек для перетаскивания
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца 
   * @param {Ship} ship Корабль
   */
  freeToDrop(row, col, ship) {
    const cells = this.getCells(row, col, ship.len, ship.dir);
    return (cells.length == ship.len) && cells.every(cell => cell.freeToDrop(ship));
  }

  /**
   * Разрешение перетаскивания в ячейки
   */
  cellsDropEn() {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        this.cells[row][col].dropEn();
      }
    }   
  }

  /**
   * Запрет перетаскивания в ячейки
   */
  cellsDropDis() {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        this.cells[row][col].dropDis();
      }
    }   
  }

  /**
   * Добавить игровую таблицу в документ
   */
  addToDoc() {
    const table = doc.get(this.id);
    if (!table) {
      return null;
    }
  
    // перавая строка таблицы
    let tr = doc.add({dst: table, tag: "tr"});
  
    // первая ячейка первой строки
    let el = doc.add({dst: tr, tag: "th"});
    doc.add({dst: el, tag: "div", id: this.id + "-cell"});
  
    // остальные ячейки первой строки
    for (let i = 0; i < 10; i++) {
      doc.add({dst: tr, tag: "th", txt: `${i + 1}`});
    }
  
    // другие строки
    for (let i = 0; i < 10; i++) {
      // первая ячейка
      tr = doc.add({dst: table, tag: "tr"});
      doc.add({dst: tr, tag: "th", txt: "АБВГДЕЖЗИК"[i]});
      // другие ячейки
      for (let j = 0; j < 10; j++) {
        el = doc.add({dst: tr, tag: "td"});
        this.cells[i][j].addToDoc(el);
      }
    }

    return table;    
  }
}

/**
 * Корабль
 */
class Ship {
  /**
   * Конструктор
   * @param {String} id Идентификатор
   * @param {String} type Тип (1h..4h, 1w..4w)
   */
  constructor(id, type = "1h") {
    this.id = id;
    this.type = type;
    this.len = +type[0];
    this.dir = type[1];
  }

  /**
   * Добавить карабль в элемент
   * @param {HTMLElement|String} el 
   */
  addToDoc(el) {
    const ns = "http://www.w3.org/2000/svg";
    let div = doc.add({dst: el, tag: "div", id: this.id, 
      cls: ["ship-" + this.type]
    });
    let svg = doc.add({dst: div, ns: ns, tag: "svg", cls: ["ship"]});
    doc.add({dst: svg, ns: ns, tag: "use", 
      attr: {href: "#ship"}
    });
    return div;
  }

  /**
   * Установить зависимые ячейки
   * @param {Playground} pg Игровое поле 
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца
   */
  setCells(pg, row, col) {
    // ячейки корабля
    this.cells = pg.getCells(row, col, this.len, this.dir);
    // добавляем в них корабль
    this.cells.forEach(cell => cell.ship = this);
    // отмечаем соседние с кораблем
    this.adjacentCells = new Set();
    this.cells.forEach((cell) => {
      cell.adjacentCells.forEach((ac) => {
        if (!ac.ship) {
          this.adjacentCells.add(ac);
          ac.adjacentShipSet.add(this);
        }
      });
    });
  }

  /**
   * Очистить зависимые ячейки
   */
  unsetCells() {
    // убираем корабль из ячеек
    this.cells.forEach(cell => cell.ship = null);
    // убираем отметку у соседних с кораболем
    this.adjacentCells.forEach(cell => cell.adjacentShipSet.delete(this));
  }

  /**
   * Добавить в ячейку
   * @param {Playground} pg Игровое поле
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца
   */
  addToCell(pg, row, col) {
    if (!pg.free(row, col, this.len, this.dir)) {
      return false;
    }
    // устанавливаем зависимые ячейки
    this.setCells(pg, row, col);
    // добавляем элемент
    const div = this.addToDoc(this.cells[0].element);
    div.addEventListener("dragstart", 
      (ev) => Ship.dragStart(ev, this), 
      false
    );
    return true;
  }

  /**
   * Переместить
   * @param {PlaygroundCell} cell 
   */
  moveToCell(cell) {
    // очищаем зависимые ячейки
    this.unsetCells();
    // устанавливаем зависимые ячейки
    this.setCells(cell.playground, cell.row, cell.col);
    // перемещаем
    cell.element.appendChild(this.element);
  }

  /**
   * Обработчик события начала перетаскивания корабля
   * @param {DragEvent} ev Событие
   * @param {Ship} ev Корабль
   */
  static dragStart(ev, ship) {
    // устанавливаем данные
    ev.dataTransfer.setData("data", ev.target.id);

    // клонируем корабль
    const svg = ev.target.firstChild.cloneNode(true);
    // ставим параметры
    svg.id = "drag-ghost";
    svg.classList.remove("ship");
    svg.classList.add("ship-d");
    svg.style.height = ev.target.offsetHeight + "px";
    svg.style.width = ev.target.offsetWidth + "px";
    svg.dataset.id = ship.id;
    // добавляем
    document.body.appendChild(svg);

    // устанавливаем картинку
    ev.dataTransfer.setDragImage(svg, 0, 0);
  }

  /**
   * Обработкик события окончания перетаскивания корабля
   * @param {DragEvent} ev Событие 
   */
  static dragEnd(ev) {
    // получаем элемент
    const el = doc.get("drag-ghost");
    // удаляем
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
  }

  /**
   * Установка события конца перетаскивания
   */
  static setDragEnd() {
    document.addEventListener("dragend", Ship.dragEnd, false);
  }

  /**
   * Изменить напраление корабля
   */
  changeDir() {
    if (this.dir == "h") {
      this.dir =  "w";
    } else {
      this.dir =  "h";
    }
  }

  /**
   * Обработка двойного клика
   */
  dblClick = (ev) => {
    const cell = this.cells[0];
    const pg = cell.playground;
    this.changeDir();
    if (pg.freeToDrop(cell.row, cell.col, this)) {
      this.moveToCell(cell);
      this.element.classList.remove("ship-" + this.type);
      this.type = this.len + this.dir;
      this.element.classList.add("ship-" + this.type);
    } else {
      const cells = pg.getCells(cell.row, cell.col, this.len, this.dir);
      const func = () => {
        cells.forEach((c) => (
          c.element.classList.toggle("game-cell-drop-dis")
        ));
      }
      func();
      setTimeout(func, 250);
      this.changeDir();
    }
  }

  /**
   * Разрешить перетаскивание
   */
  dragEn() {
    this.element.draggable = true;
    this.element.addEventListener("dblclick", this.dblClick, false);
  }

  /**
   * Запретить перетаскивание
   */
  dragDis() {
    this.element.draggable = false;
    this.element.removeEventListener("dblclick", this.dblClick);
  }

  /**
   * Показать корабль
   */
  show() {
    this.element.style.display = "block";
  }

  /**
   * Скрыть корабль
   */
  hide() {
    this.element.style.display = "none";
  }

  /**
   * Потоплен
   */
  get killed() {
    return this.cells.every(c => c.tested);
  }

  /**
   * Попадаение
   */
  hit() {
    if (this.killed) {
      this.show();
    }
  }

  /**
   * Плучить элемент
   */
  get element() {
    return doc.get(this.id);
  }
}

/**
 * Игра
 */
class Game {
  constructor() {
    // очищаем таблицы документа
    this.clear();

    // результат игры
    this.result = null;

    // создаем таблицы
    this.userTable = new Playground("userTable", "user");
    this.compTable = new Playground("compTable", "comp");
    // множества кораблей
    this.userShipMap = new Map();
    this.compShipMap = new Map();

    // добавляем таблицы к документу
    this.userTable.addToDoc();
    this.compTable.addToDoc();

    // корабли пользователя
    Game.random(this.userTable, this.userShipMap);
    for (const ship of this.userShipMap.values()) {
      ship.dragEn();
    }
    // разрешаем перетаскивание кораблей пользователя
    this.userTable.cellsDropEn();

    // корабли компьютера
    Game.random(this.compTable, this.compShipMap);
    for (const ship of this.compShipMap.values()) {
      ship.hide();
    }

    this._currPlayer = "user";
  }

  showWinner(txt) {
    doc.get('end-game').style.display = 'block';
    doc.get('end-game-txt').textContent = txt;
  }

  /**
   * Проверка окончания игры
   */
  endCheck() {
    if ([...this.compShipMap.values()].every(ship => ship.killed)) {
      this.result = "user";
      this.showWinner("Пользователь победил!");
    } else if ([...this.userShipMap.values()].every(ship => ship.killed)) {
      this.result = "comp";
      this.showWinner("Компьютер победил!");
    }
    if (this.result) {
      for (const ship of this.compShipMap.values()) {
        ship.show();
      }      
    }
    return this.result;
  }

  /**
   * Игрок, делающий ход
   */
  get currPlayer() {
    return this._currPlayer;
  }

  /**
   * Установка игрока, делающего ход
   */
  set currPlayer(player) {
    this._currPlayer = player;
  }

  /**
   * Смена игрока
   */
  changePlayer() {
    if (this.currPlayer == "user") {
      this.currPlayer = "comp";
      setTimeout(() => doc.get("cursor").style.fill = "black", 500);
      // ход компьютера
      setTimeout(() => comp.move(), 1000);
    } else {
      this.currPlayer = "user";
      doc.get("cursor").style.fill = "red";
    }
  }

  /**
   * Сделать ход
   * @param {String} player Игрок
   * @param {PlaygroundCell} cell Ячейка
   */
  move(player, cell) {
    if (this.result) {
      return 0;
    }

    for (const ship of this.userShipMap.values()) {
      ship.dragDis();
    }

    if (this.currPlayer != player) {
      return 0;
    }

    const res = cell.shoot();
    if (!res) {
      return 0;
    }

    if (res == 1) {
      this.endCheck();
      return 1;
    }

    this.changePlayer();
    return -1;
  }

  /**
   * Расставить корабли случайно
   * @param {Playground} pg Игровое поле
   * @param {Map<String, Ship>} ships Множество кораблей
   */
  static random(pg, ships) {
    const lens = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];
    const dirs = [];
    for (let i = 0; i < 6; i++) {
      dirs.push((Math.random() > 0.5) ? "h" : "w");
    }
    dirs.push("w", "w", "w", "w");
    for (let i = 0; i < lens.length; i++) {
      const freeCells = pg.getFreeCells(lens[i], dirs[i]);
      if (!freeCells.length) {
        console.log("Нет совбодных ячеек", lens[i], dirs[i]);
        break;
      }
      const cellInd = Math.trunc(Math.random() * freeCells.length);
      const cell = freeCells[cellInd];
      const ship = new Ship(pg.type + "-ship" + i, lens[i] + dirs[i]);
      ships.set(ship.id, ship);
      if (!cell) {
        console.log("Пустая ячейка", cellInd, freeCells);
        break;
      }
      if (!ship.addToCell(pg, cell.row, cell.col)) {
        console.log("Корабль не добавлен", lens[i], dirs[i], 
          cell.row, cell.col, cell, cellInd, freeCells);
        break;  
      }
    }    
  }

  static init() {
    Ship.setDragEnd();

    // элемент курсора
    const cursor = doc.get("cursor"); 
    // таблица копмпьютера 
    const compTbl = doc.get("compTable");

    // функция установки курсора-прицела
    const setCursor = (ev) => {  
      const cell = doc.get("compTable-cell");
      cursor.style.height = cell.offsetHeight;
      cursor.style.width = cell.offsetWidth;
      cursor.style.left = (ev.pageX - cell.offsetHeight / 2) + 'px';
      cursor.style.top = (ev.pageY - cell.offsetHeight / 2) + 'px';
      cursor.style.display = "block";
    }
    // установка обработчика события наведения на таблицу
    compTbl.addEventListener("mouseenter", setCursor, false);

    // установка обработчика события движения мыши
    document.addEventListener("mousemove", (ev) => {    
      const rect = compTbl.getBoundingClientRect();
      // если курсор в таблице
      if ((rect.left < ev.clientX) && (rect.right > ev.clientX) &&
          (rect.top < ev.clientY) && (rect.bottom > ev.clientY)) {
        // прицел
        setCursor(ev);
      } else {
        // нет прицела
        cursor.style.display = "none";
      }
    }, false);

    document.addEventListener("click", (ev) => {
      if (game.result != null) {
        return;
      }
      const els = document.elementsFromPoint(ev.clientX, ev.clientY);
      const cellEl = els.find((el) => el.id.startsWith("compTable-cell-"));
      // если есть элемент ячейки
      if (cellEl) {
        // получаем ячейку
        const cell = game.compTable.cellMap.get(cellEl.id);
        if (cell) {
          // делаем ход
          game.move("user", cell);
        }
      }
    }, false);
  }

  /**
   * Удаление таблиц из документа
   */
  clear() {
    let el = doc.get("userTable");
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
    el = doc.get("compTable");
    while (el.firstChild) {
      el.removeChild(el.firstChild);
    }
  }
}

class Comp {
  constructor() {
    this.testedCellsSet = new Set();
    this.cellsSet = new Set(game.userTable.cellMap.values());
    this.currShip = null;
    this.hitCnt = 0;
    this.cell = null;
  }

  procCell() {
    const cells = new Set([this.cell]);

    if (this.cell.ship) {
      if (this.cell.ship.killed) {
        this.cell.ship.adjacentCells.forEach(c => cells.add(c));
        this.currShip = null;
        this.hitCnt = 0;
      } else {
        this.currShip = this.cell.ship;
        this.hitCnt++;
      }
    }

    cells.forEach((c) => this.cellsSet.delete(c));
  }

  move() {
    if (this.currShip) {
      if (this.cnt == 1) {
        const pg = this.cell.playground;
        const cells = pg.getAdjacentCells(this.cell.row, this.cell.col, [
                    [-1, 0], 
          [ 0, -1],          [ 0, 1], 
                    [ 1, 0], 
        ]).filter(c => this.cellsSet.has(c));

        this.cell = cells[Math.trunc(Math.random() * cells.length)];
      } else {
        const pg = this.cell.playground;
        const testedCells = this.currShip.cells.filter(c => c.tested);
        const first = testedCells[0];
        const last = testedCells[testedCells.length - 1];

        const shifts1 = [];
        const shifts2 = [];
        if (this.currShip.dir == "h") {
          shifts1.push([-1, 0]);
          shifts2.push([1, 0]);
        } else {
          shifts1.push([0, -1]);
          shifts2.push([0, 1]);
        }

        let cells = pg.getAdjacentCells(first.row, first.col, shifts1);
        cells.push(...pg.getAdjacentCells(last.row, last.col, shifts2));
        cells = cells.filter(c => this.cellsSet.has(c));

        this.cell = cells[Math.trunc(Math.random() * cells.length)];       
      } 
    } else {
      const len = this.cellsSet.size;
      this.cell = [...this.cellsSet.values()][Math.trunc(Math.random() * len)];
    }

    const res = game.move("comp", this.cell)
    if (res) {
      this.procCell();
      if (res == 1) {
        setTimeout(() => { this.move() }, 1000);
      }
    }
  }
}

Game.init();

function newGame() {
  game = new Game();
  comp = new Comp();
}

newGame();
