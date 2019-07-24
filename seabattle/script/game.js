/**
 * Добавить игровую таблицу
 * @param {string} tablId идентификатор таблицы
 */
function addTable(tablId) {
  const table = get(tablId)
  if (!table) {
    return;
  }

  let tr = add(table, "tr");
  let el = add(tr, "th");
  add(el, "div");

  for (let i = 0; i < 10; i++) {
    add(tr, "th", "", `${i + 1}`);
  }

  for (let i = 0; i < 10; i++) {
    tr = add(table, "tr");
    add(tr, "th", "", "АБВГДЕЖЗИК"[i]);
    for (let j = 0; j < 10; j++) {
      el = add(tr, "td");
      add(el, "div", `${tablId}-cell-${i}-${j}`);
    }
  }
}

addTable("leftTable");
addTable("rightTable");