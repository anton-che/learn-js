/*
*  Чекмарев Антон Геннадьевич
*
*  Задание 2:
*    Написать простой калькулятор, основываясь на полученных знаниях.
*    1. Нужно использовать ввод чисел через prompt
*    2. Использовать функции
*
*  Реализация:
*    Чтобы не было скучно, напишу синтаксический анализатор
*    введенного пользователем арифметического выражения
*    методом рекурсивного спуска.
*
*  Грамматика:
*    primary ::= number | ‘(’ add_exp ‘)’
*    unary   ::= ADD_OP  unary | primary
*    mul_exp ::= unary |  unary  MUL_OP mul_exp
*    add_exp ::= mul_exp | mul_exp  ADD_OP  add_exp
*    MUL_OP  ::= ‘*’ | ‘/’
*    ADD_OP  ::=  ‘+’ | ‘-’
*
*/

// выдать сообщение об ошибке
function error_msg(msg) {
  alert(msg);
}

// получить строку для расчета
function get_input() {
  return prompt("Введите выражение для расчета,\r\n" +
                "используя числа и операторы * / + - ( )", "0"
         );
}

// разобрать входную строку на токены
function get_tokens(input) {
  let tokens = []; // массив токенов
  // пока строка не пустая
  while (input) {
    // ищем разделители
    let m = input.match(/[()*/+\-]/)
    // если рзделитеь не найден или найден не в начале
    if (!m || m.index) {
      // побуем получить число из строки
      // определяем следующий за числом индекс
      let ind = !m ? input.length : m.index;
      // получаем строку с числом
      let str = input.substring(0, ind).trim();
      // сдвигаем строку влево
      input = input.substring(ind);
      // если одни пробельные символы
      if (!str) {
        // продолжаем
        continue;
      }
      // получаем число из строки
      let val = +str;
      // если это не число
      if (isNaN(val)) {
        // выводим ошибку
        error_msg(`Во введенной строке есть ошибка: ${str}`);
        // и выходим из фукнции
        return;
      }
      // добавляем токен в массив
      tokens.push({type: "Num", val: val});
    }
    else {
      // нашли разделитель
      // добавляем токен в массив
      tokens.push({type: input[0], val: input[0]});
      // сдвигаем строку влево
      input = input.substring(1);
    }
  }
  // возвращаем массив токенов
  return tokens;
}

// калькулятор
function calculate() {
  // получаем входную строку для расчета
  let input = get_input();
  if (input == null) {
    return;
  }
  // разбираем на токены
  let tokens = get_tokens(input);
  console.log(tokens);
  // добавлем конечный токен
  const end_token = {type: "End", val: "End"};
  tokens.push(end_token);

  // текущий индекс токена
  let token_ind = 0;

  // получить текуший токен
  function get_token() {
    return tokens[token_ind];
  }
  // сравнить с текушим токеном
  function cmp_token_type(token_type) {
    return get_token().type === token_type;
  }
  // перейти к следующему токену
  function next_token() {
    if (get_token() !== end_token) {
      token_ind++;
    }
  }

  // функция проверки токена
  function accept_token(token_type) {
    // если тип токена совподает
    if (cmp_token_type(token_type)) {
      // к следующему токену
      next_token();
      return true;
    }
    return false;
  }

  // функция ожидания токена
  function expect_token(token_type) {
    // если тот токен, который должен быть
    if (accept_token(token_type)) {
      // ок
      return true;
    }
    // ошибка
    error_msg(`Неожиданный токен: ${get_token().val}`);
    return false;
  }

  // стек для вычисления
  let calc_stack = [];

  // первичное выражение
  function primary_exp() {
    // получаем текущий токен
    var tok = get_token();
    // если число
    if (accept_token("Num")) {
      // сохраняем в стеке
      calc_stack.push(tok.val);
      return true;
    }
    // если (
    if (accept_token("(")) {
      // проверяем дальше
      return add_exp() && expect_token(")");
    }
    // иначе это не первичное выражение
    return false;
  }

  // унарные опрерации
  function unary_exp() {
    // если +
    if (accept_token("+")) {
      // проверяем дальше
      return unary_exp();
    }
    // если -
    if (accept_token("-")) {
      // проверяем дальше, если все ок
      if (unary_exp()) {
        // применяем операцию к значению в стеке
        let val = calc_stack.pop();
        calc_stack.push(-val);
        return true;
      }
      return false;
    }
    // если первичное выражение
    if (primary_exp()){
      return true;
    }
    // иначе это не унарная операция
    error_msg(`Синтаксическая ошибка: ${get_token().val}`);
    return false;
  }

  // мультипликативные опрерации
  function mul_exp() {
    // если вначале унарная операция
    if (unary_exp()) {
      // проверяем дальше в цикле
      while (true) {
        // если *
        if (accept_token("*")) {
          let val1 = calc_stack.pop();
          // проверяем дальше, если все ок
          if (unary_exp()) {
            // применяем операцию к значениям в стеке
            let val2 = calc_stack.pop();
            calc_stack.push(val1 * val2);
          } else {
            // ошибка
            return false;
          }
        } else if (accept_token("/")) {
          // если /
          let val1 = calc_stack.pop();
          // проверяем дальше, если все ок
          if (unary_exp()) {
            // применяем операцию к значениям в стеке
            let val2 = calc_stack.pop();
            calc_stack.push(val1 / val2);
          } else {
            // ошибка
            return false;
          }
        } else {
          // далее ничего нет
          break;
        }
      }
      // это мультипликативная операция
      return true;
    }
    // это не мультипликативная операция
    return false;
  }

  // аддитивные опрерации
  function add_exp() {
    // если вначале мультипликативная операция
    if (mul_exp()) {
      // проверяем дальше в цикле
      while (true) {
        // если +
        if (accept_token("+")) {
          let val1 = calc_stack.pop();
          // проверяем дальше, если все ок
          if (mul_exp()) {
            // применяем операцию к значениям в стеке
            let val2 = calc_stack.pop();
            calc_stack.push(val1 + val2);
          } else {
            // ошибка
            return false;
          }
        } else if (accept_token("-")) {
          // если -
          let val1 = calc_stack.pop();
          // проверяем дальше, если все ок
          if (mul_exp()) {
            // применяем операцию к значениям в стеке
            let val2 = calc_stack.pop();
            calc_stack.push(val1 - val2);
          } else {
            // ошибка
            return false;
          }
        } else {
          // далее ничего нет
          break;
        }
      }
      // это аддитивная операция
      return true;
    }
    // это не аддитивная операция
    return false;
  }

  // выражение
  function exp() {
    // если это аддитваная операция
    if (add_exp()) {
      // возвращаем рассчитанное значение
      return calc_stack.pop();
    }
    // ошибка
    return null;
  }

  // вычисляем выражение
  let value = exp();

  alert(`Результат: ${value}`);
};
