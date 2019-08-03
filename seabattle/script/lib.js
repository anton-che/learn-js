
/**
 * Обертки для доступа к DOM
 */
const doc = {
  /**
   * Получить элемент HTML или список 
   * @param {string} query запрос 
   * @param {string} type тип запроса
   */
  get(query, type = "id") {
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
  },

  /**
   * Добавить тег
   * @param {Object} param {dst, t, ns, tag, id, txt, cls, attr}
   */
  add({
    dst: parent, 
    t: qType = "id", 
    ns, 
    tag = "div", 
    id, 
    txt, 
    cls: classes, 
    attr: attrs
  })
  {
    let parents = [];
    let elements = [];
  
    // получаем родителей
    if (!parent) {
      parents.push(null);
    } else if (typeof parent == "string") {
      const el = get(parent, qType);
      if (el.length) {
        parents.push(...el);
      } else {
        parents.push(el);
      }
    } else if (parent.length) {
      parents.push(...parent);
    } else {
      parents.push(parent);
    }
    
    // для каждого родителя
    for (let i = 0; i < parents.length; i++) {
      const prnt = parents[i];
      
      // создаем элемент
      let el = ns ? document.createElementNS("" + ns, "" + tag) 
        : document.createElement("" + tag);
      elements.push(el);
  
      // текст элемента
      if (txt) {
        el.textContent = txt;
      }

      // идентификатор
      if (id) {
        el.id = id;
        if (parents.length > 1) {
          el.id += "-" + i; 
        }
      }

      // атрибуты
      if (attrs) {
        for (const key in attrs) {
          const attr = attrs[key];
          if (el.setAttribute) {
            el.setAttribute(key, attr);
          }
        }
      }
  
      // классы
      if (classes && classes.length) {
        el.classList.add(...classes);
      }
    
      // добавляем к родителю
      if (prnt && prnt.appendChild) {
        prnt.appendChild(el); 
      }     
    }
  
    // возвращаем либо массив либо элемент
    if (elements.length == 1) {
      return elements[0];
    }
    return elements;
  }  
}

