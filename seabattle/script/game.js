
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
    this.id = `${pg.id}-cell-${col}-${row}`;
    this.ship = null;
  }

  /**
   * Признак пустой ячейки
   */
  get empty() {
    return !this.ship;
  }

  hit() {

  }
  miss() {

  }

  /**
   * Добавить ячейку в элемент
   * @param {HTMLElement|String} el 
   */
  addToDoc(el) {
    return doc.add({dst: el, tag: "div", id: this.id});
  }

  /**
   * Обработчик события попадания на элемент
   * @param {DragEvent} ev 
   */
  dragOver = (ev) => {
    const el = doc.get("drag-ghost");
    const ship = game.shipMap.get(el.dataset.id);
    if (this.playground.empty(this.row, this.col, ship.len, ship.dir)) {
      // xxx: почему-то не работает
      el.style.fill = "green";
      ev.preventDefault();
    } else {
      // xxx: почему-то не работает
      el.style.fill = "red";
    }
  }

  /**
   * Обработчик события перетаскивания
   * @param {DragEvent} ev 
   */
  drop = (ev) => {
    const id = ev.dataTransfer.getData("data");
    const ship = game.shipMap.get(id);
    ship.moveToCell(this);
  }

  /**
   * Разрешение перетаскивания
   */
  dropEn() {
    this.element.addEventListener("dragover", this.dragOver, false);
    this.element.addEventListener("drop", this.drop, false);
  }

  /**
   * Запрет перетаскивания
   */
  dropDis() {
    this.element.removeEventListener("dragover", this.dragOver);
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

    // создаем ячейки поля
    this.cells = [];
    for (let row = 0; row < 10; row++) {
      this.cells.push([]);
      for (let col = 0; col < 10; col++) {
        this.cells[row].push(new PlaygroundCell(this, row, col));
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
   * Получить ячейки
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца 
   * @param {Number} len Количество элементов
   * @param {String} dir Направление (w | h)
   */
  getCells(row, col, len, dir) {
    // xxx: здесь нужна проверка входных параметров

    return (dir == "h") ? 
        this.cellsInvert[col].slice(row, row + len)
      : this.cells[row].slice(col, col + len)
      ;
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
    return cells.every(cell => cell.empty);
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
   * Добавить в ячейку
   * @param {Playground} pg Игровое поле
   * @param {Number} row Индекс строки
   * @param {Number} col Индекс столбца  
   */
  addToCell(pg, row, col) {
    if (!pg.empty(row, col, this.len, this.dir)) {
      return false;
    }
    this.cells = pg.getCells(row, col, this.len, this.dir);
    this.cells.forEach(cell => cell.ship = this);
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
    this.cells.forEach(cell => cell.ship = null);
    this.cells = cell.playground
      .getCells(cell.row, cell.col, this.len, this.dir);
    this.cells.forEach(cell => cell.ship = this);
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
   * Разрешить перетаскивание
   */
  dragEn() {
    this.element.draggable = true;
  }

  /**
   * Запретить перетаскивание
   */
  dragDis() {
    this.element.draggable = false;
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
    this.clear();
    this.userTable = new Playground("userTable", "user");
    this.compTable = new Playground("compTable", "comp");
    this.shipMap = new Map();

    this.userTable.addToDoc();
    this.compTable.addToDoc();

    const ship1 = new Ship("ship1", "4h");
    ship1.addToCell(this.userTable, 0, 1);
    ship1.dragEn();

    this.shipMap.set("ship1", ship1);

    this.userTable.cellsDropEn();
  }

  clear() {
    let el = doc.get("userTable");
    while (el.firstChild) {
      parent.firstChild.remove();
    }
    el = doc.get("compTable");
    while (el.firstChild) {
      parent.firstChild.remove();
    }
  }
}

Ship.setDragEnd();
let game = new Game();
