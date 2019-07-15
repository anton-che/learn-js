/**
 * Чекмарев Антон Геннадьевич
 * 
 * Задание 3
 * Вывести удобным вам способом (console.log / alert)
 * 1) Средний возраст (age) актеров, которые снимались 
 *    в фильмах режиссера(director), которые не получили оскар (oscarCount)
 * 2) Имена всех актеров, которые играли с Томом Хэнксом, 
 *    в фильмах после 1995 года.
 * 3) Общий бюджет (сумма) фильмов, с режиссерами младше 70 лет 
 *    и в которых не играл Том Хэнкс.
 * 
 */

/**
 * Для некоторого подобия профилирования
 */
function profileWrap(func, iter = 10000)
{
  let res;
  console.time("t");
  while (iter--) {
    res = func();
  }
  console.timeEnd("t"); 
  return res;
}

// Часть 1 (4 варианта)

/**
 * 1 вариант 1:
 * фильтруем, получаем массив, считаем среднее
 * учитываем, что одни и те же актеры могут играть в разных фильмах
 * 
 * но эффективно ли это? наверно нет
 */
function calcAvrAge_1()
{
  const avrObj = films
    .filter(film => film.director.oscarsCount == 0)
    .flatMap(film => film.actors)
    .reduce((prev, actor) => {
      if (!prev[actor.name]) {
        prev.ageSum += actor.age;
        prev.ageCount++;
        prev[actor.name] = true;
      } 
      return prev;
    }, { ageSum: 0, ageCount: 0 });
  return avrObj.ageSum / avrObj.ageCount;
}

/**
 *  1 вариант 2:
 *  вместо эксперементального flatMap можно так
 */
function calcAvrAge_2()
{
  const avrObj = films
    .filter(film => film.director.oscarsCount == 0)
    .reduce((arr, film) => { 
      arr.push(...film.actors); return arr; 
    }, [])
    .reduce((prev, actor) => {
      if (!prev[actor.name]) {
        prev.ageSum += actor.age;
        prev.ageCount++;
        prev[actor.name] = true;
      } 
      return prev;
    }, { ageSum: 0, ageCount: 0 });
  return avrObj.ageSum / avrObj.ageCount;
}

/**
 * 1 вариант 3:
 * можно не делать фильтр и не содинять всех актеров в один массив
 */
function calcAvrAge_3()
{
  const {ageSum, ageCount} = films.reduce((acc, film) => {
    if (film.director.oscarsCount == 0) {
      acc.ageCount += film.actors.length;
      acc.ageSum += film.actors.reduce((sum, actor) => {
        if (acc[actor.name]) {
          acc.ageCount--;
        } else {
          sum += actor.age;
          acc[actor.name] = true;
        }
        return sum;
      }, 0);
    }
    return acc;
  }, { ageSum: 0, ageCount: 0 });
  return ageSum / ageCount;
}

/**
 * 1 вариант 4:
 * просто for
 */
function calcAvrAge_4()
{
  let sum = 0;
  let cnt = 0;
  let setObj = {};
  for (let i = 0; i < films.length; i++) {
    const film = films[i];
    if (film.director.oscarsCount == 0) {
      cnt += film.actors.length;
      for (let j = 0; j < film.actors.length; j++) {
        const actor = film.actors[j];
        if (setObj[actor.name]) {
          cnt--;
        } else {
          sum += actor.age;
          setObj[actor.name] = true;
        }
      }
    }
  }
  return sum / cnt;
}

let avrAge = 0; // сдредний возраст

avrAge = profileWrap(calcAvrAge_1)
console.log("Средний возраст (вариант 1):", avrAge);

avrAge = profileWrap(calcAvrAge_2)
console.log("Средний возраст (вариант 2):", avrAge);

avrAge = profileWrap(calcAvrAge_3)
console.log("Средний возраст (вариант 3):", avrAge);

avrAge = profileWrap(calcAvrAge_4)
console.log("Средний возраст (вариант 4):", avrAge);

document.write(`<p>Средний возраст ... ${avrAge.toFixed(2)}</p>`);

// Часть 2 (4 варианта)

/**
 * 2 вариант 1:
 * сначала фильтруем, затем формируем объект
 */
function getActors_1()
{
  const actors = films.filter((film) => (
    (film.creationYear > 1995) &&
    film.actors.some(actor => actor.name == 'Tom Hanks')
  )).reduce((setObj, film) => {
    film.actors.forEach(actor => setObj[actor.name] = true);
    return setObj;
  }, {});
  delete actors['Tom Hanks'];
  return Object.keys(actors);
}

/**
 * 2 вариант 2:
 * по актерам можно пройтись 1 раз, а не 2
 * но потом все равно придется из массива делать
 * множество 
 */
function getActors_2()
{
  const actors = films.reduce((actorsArr, film) => {
    if (film.creationYear > 1995) {
      let delEn = true;
      film.actors.forEach((actor) => {
        actorsArr.push(actor.name);
        delEn = delEn && (actor.name != 'Tom Hanks')
      });
      if (delEn) {
        actorsArr.length -= film.actors.length;
      }
    }
    return actorsArr;    
  }, []).reduce((setObj, name) => {
    setObj[name] = true;
    return setObj;
  }, {});
  delete actors['Tom Hanks'];
  return Object.keys(actors); 
}

/**
 * 2 вариант 3:
 * для преобразования массива в множество можно использовать Set
 */
function getActors_3()
{
  const actorsArr = films.reduce((actorsArr, film) => {
    if (film.creationYear > 1995) {
      let delEn = true;
      film.actors.forEach((actor) => {
        actorsArr.push(actor.name);
        delEn = delEn && (actor.name != 'Tom Hanks')
      });
      if (delEn) {
        actorsArr.length -= film.actors.length;
      }
    }
    return actorsArr;    
  }, []);
  let actors = new Set(actorsArr);
  actors.delete('Tom Hanks');
  return [...actors];  
}

/**
 * 2 вариант 4:
 * можно пройтись по всем актерам, сформировав объект,
 * потом с помощью  Object.assign копировать в целевой объект
 */
function getActors_4()
{
  const actors = {};
  for (const film of films) {
    if (film.creationYear > 1995) {
      let actorsObj = {};
      film.actors.forEach(actor => actorsObj[actor.name] = true);
      if (actorsObj['Tom Hanks']) {
        Object.assign(actors, actorsObj);
      }
    }
  }
  delete actors['Tom Hanks'];
  return Object.keys(actors);
}

let actors = []; // актеры

actors = profileWrap(getActors_1)
console.log("Актеры (вариант 1):", actors);

actors = profileWrap(getActors_2)
console.log("Актеры (вариант 2):", actors);

actors = profileWrap(getActors_3)
console.log("Актеры (вариант 3):", actors);

actors = profileWrap(getActors_4)
console.log("Актеры (вариант 4):", actors);

document.write('<p>Актеры ...</p>');
document.write('<ol>');
for (const actor of actors) {
  document.write(`<li>${actor}</li>`);
}
document.write('</ol>');

// Часть 3 (2 варианта)

/**
 * 3 вариант 1
 */
function getBudget_1()
{
  return films.filter((film) => (
    (film.director.age < 70) &&
    film.actors.every(actor => actor.name != 'Tom Hanks')
  )).reduce((sum, film) => ( 
    sum + +film.budget.substring(1).replace(/\s+/g, '')
  ), 0);
}

/**
 * 3 вариант 2
 */
function getBudget_2()
{
  return films.filter((film) => (
    (film.director.age < 70) &&
    !new Set(film.actors.map(actor => actor.name)).has('Tom Hanks')
  )).reduce((sum, film) => ( 
    sum + +film.budget.substring(1).replace(/\s+/g, '')
  ), 0);
}

let budget = 0; // бюджет

budget = profileWrap(getBudget_1)
console.log("Бюджет (вариант 1):", budget);

budget = profileWrap(getBudget_2)
console.log("Бюджет (вариант 2):", budget);

document.write(`<p>Бюджет ... $${budget}</p>`);