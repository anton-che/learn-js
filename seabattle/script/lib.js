
/**
 * Получить элемент HTML или список 
 * @param {string} query запрос 
 * @param {string} type тип запроса
 */
function get(query, type = "id") {
  if (type == "id") {
    return document.getElementById(query);
  }
  if (type == "tag") {
    return document.getElementsByTagName(query);
  }
  if (type == "cls") {
    return document.getElementsByClassName(query);
  }
  if (type == "q") {
    return document.querySelector(query);
  }  
  if (type == "qall") {
    return document.querySelectorAll(query);
  }
  return document.getElementById(query);
}

/**
 * Добавить тег
 * @param {string|HTMLElement} parent предок
 * @param {string} tag тег
 * @param {string} id  идентификатор
 * @param {string} txt  текст
 * @param  {...string} classes классы 
 */
function add(parent, tag, id, txt, ...classes)
{
  let parents = [];
  let elements = [];

  if (!parent) {
    parents.push(document.body);
  } else if (typeof parent == "string") {
    parents.push(...get(parent, "qall"));
  } else if (parent.length) {
    parents.push(...parent);
  } else {
    parents.push(parent);
  }

  tag = tag || "div";

  for (let i = 0; i < parents.length; i++) {
    const prnt = parents[i];
    
    let el = document.createElement("" + tag);
    elements.push(el);

    if (txt) {
      el.textContent = txt;
    }

    if (id) {
      el.id = id;
      if (parents.length > 1) {
        el.id += "-" + i; 
      }
    }

    if (classes && (classes.length > 0)) {
      el.classList.add(...classes);
    }
  
    if (prnt.appendChild) {
      prnt.appendChild(el); 
    }     
  }

  if (elements.length == 1) {
    return elements[0];
  }
  return elements;
}