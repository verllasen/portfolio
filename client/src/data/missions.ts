import type { Mission } from '../types';

export const missions: Mission[] = [
  {
    id: 'm1',
    title: 'Цветочный Магазин "Blooming Dale"',
    description: 'Полный цикл разработки интернет-магазина для премиального цветочного бутика. Проект рассчитан на длительную командную работу (около 40 минут).',
    difficulty: 'Medium',
    reward: 2500,
    status: 'available',
    globalDocs: `
# Бриф Клиента: Blooming Dale
**Клиент**: Миссис Роуз Петал
**Срок**: 40-50 минут реального времени

## Описание
Нам нужен современный, быстрый и красивый сайт для продажи эксклюзивных букетов. Мы хотим, чтобы клиенты могли легко выбирать цветы, добавлять их в корзину и оформлять заказ.

## Технический Стек
- **HTML**: Семантическая верстка, доступность.
- **CSS**: Flexbox/Grid, адаптивность, приятные анимации.
- **JS**: Динамический рендеринг товаров, корзина, валидация форм.
- **SQL**: База данных товаров, пользователей и заказов.

## Дизайн-код
- **Цвета**: Розовый (#ff69b4), Лавандовый (#fff0f5), Темно-серый (#333).
- **Шрифт**: Sans-serif для удобства чтения.
    `,
    requiredSpecialization: ['Frontend', 'Fullstack'],
    tasks: [
      {
        id: 't1',
        role: 'HTML',
        title: 'HTML Структура и Разметка',
        currentStageIndex: 0,
        completed: false,
        stages: [
          {
            id: 'h1',
            title: 'Базовая Структура',
            description: 'Создайте основной каркас страницы: DOCTYPE, html, head, body. Подключите мета-теги.',
            hint: 'Используйте <!DOCTYPE html>, <html>, <head>, <body>. В head добавьте <meta charset="UTF-8">.',
            validationRules: [
              { id: 'v1', type: 'includes', value: '<!DOCTYPE html>', errorMsg: 'Нет DOCTYPE' },
              { id: 'v2', type: 'includes', value: '<html', errorMsg: 'Нет тега html' },
              { id: 'v3', type: 'includes', value: '<body', errorMsg: 'Нет тега body' }
            ],
            codeSnippet: `<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <title>Blooming Dale</title>
</head>
<body>
    <!-- Ваш код здесь -->
</body>
</html>`
          },
          {
            id: 'h2',
            title: 'Шапка Сайта (Header)',
            description: 'Добавьте шапку сайта с логотипом и навигацией.',
            hint: 'Используйте <header>, внутри него <h1> для логотипа и <nav><ul><li>... для меню.',
            validationRules: [
              { id: 'v1', type: 'includes', value: '<header', errorMsg: 'Нужен тег <header>' },
              { id: 'v2', type: 'includes', value: '<nav', errorMsg: 'Нужен тег <nav>' },
              { id: 'v3', type: 'includes', value: '<ul', errorMsg: 'Список меню через <ul>' }
            ],
            codeSnippet: `<header>
    <div class="logo">Blooming Dale</div>
    <nav>
        <ul>
            <li><a href="#">Главная</a></li>
            <li><a href="#">Каталог</a></li>
            <li><a href="#">Контакты</a></li>
        </ul>
    </nav>
</header>`
          },
          {
            id: 'h3',
            title: 'Секция Hero (Главный экран)',
            description: 'Создайте приветственную секцию с заголовком и кнопкой призыва к действию.',
            hint: 'Используйте <section id="hero">. Внутри добавьте <h2> и <button>.',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'id=["\']hero["\']', errorMsg: 'Секция должна иметь id="hero"' },
              { id: 'v2', type: 'includes', value: '<h2', errorMsg: 'Добавьте заголовок h2' },
              { id: 'v3', type: 'includes', value: '<button', errorMsg: 'Добавьте кнопку' }
            ],
            codeSnippet: `<section id="hero">
    <div class="hero-content">
        <h2>Лучшие цветы для вас</h2>
        <p>Свежие букеты с доставкой</p>
        <button>Заказать сейчас</button>
    </div>
</section>`
          },
          {
            id: 'h4',
            title: 'Контейнер Товаров',
            description: 'Создайте секцию для каталога товаров.',
            hint: 'Используйте <main> и внутри <section id="products">.',
            validationRules: [
              { id: 'v1', type: 'includes', value: '<main', errorMsg: 'Оберните контент в <main>' },
              { id: 'v2', type: 'regex', value: 'id=["\']products["\']', errorMsg: 'Нужна секция с id="products"' }
            ],
            codeSnippet: `<main>
    <section id="products">
        <!-- Сюда JS будет добавлять товары -->
    </section>
</main>`
          },
          {
            id: 'h5',
            title: 'Шаблон Карточки Товара',
            description: 'Сверстайте пример одной карточки товара (для использования в JS).',
            hint: 'div с классом "product-card". Внутри img, h3, p (цена) и button.',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'class=["\']product-card["\']', errorMsg: 'Класс product-card обязателен' },
              { id: 'v2', type: 'includes', value: '<img', errorMsg: 'Нет картинки' },
              { id: 'v3', type: 'includes', value: 'class="price"', errorMsg: 'Добавьте класс price для цены' }
            ],
            codeSnippet: `<div class="product-card">
    <img src="flower.jpg" alt="Flower">
    <h3>Роза</h3>
    <p class="price">500 руб.</p>
    <button>В корзину</button>
</div>`
          },
          {
            id: 'h6',
            title: 'Секция "О нас"',
            description: 'Добавьте информационный блок о магазине.',
            hint: 'Секция с классом "about". Текст внутри <p>.',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'class=["\']about["\']', errorMsg: 'Класс about обязателен' },
              { id: 'v2', type: 'includes', value: '<p>', errorMsg: 'Добавьте описание в <p>' }
            ],
            codeSnippet: `<section class="about">
    <h2>О нас</h2>
    <p>Мы работаем с 2010 года...</p>
</section>`
          },
          {
            id: 'h7',
            title: 'Форма Обратной Связи',
            description: 'Создайте форму для вопросов клиентов.',
            hint: '<form>. Поля: input type="text", input type="email", textarea.',
            validationRules: [
              { id: 'v1', type: 'includes', value: '<form', errorMsg: 'Где тег form?' },
              { id: 'v2', type: 'regex', value: 'type=["\']email["\']', errorMsg: 'Поле для почты обязательно' }
            ],
            codeSnippet: `<section id="contact">
    <form>
        <input type="text" placeholder="Имя">
        <input type="email" placeholder="Email">
        <textarea placeholder="Сообщение"></textarea>
        <button type="submit">Отправить</button>
    </form>
</section>`
          },
          {
            id: 'h8',
            title: 'Подвал (Footer)',
            description: 'Завершите верстку подвалом сайта.',
            hint: '<footer>. Добавьте копирайт &copy;.',
            validationRules: [
              { id: 'v1', type: 'includes', value: '<footer', errorMsg: 'Нужен footer' },
              { id: 'v2', type: 'includes', value: '&copy;', errorMsg: 'Знак копирайта обязателен' }
            ],
            codeSnippet: `<footer>
    <p>&copy; 2024 Blooming Dale. Все права защищены.</p>
</footer>`
          }
        ]
      },
      {
        id: 't2',
        role: 'CSS',
        title: 'Стилизация и Дизайн',
        currentStageIndex: 0,
        completed: false,
        stages: [
          {
            id: 'c1',
            title: 'Переменные и Сброс',
            description: 'Настройте CSS переменные и базовый сброс стилей.',
            hint: ':root { --primary: ... } и * { margin: 0; box-sizing: border-box; }',
            validationRules: [
              { id: 'v1', type: 'includes', value: ':root', errorMsg: 'Используйте :root' },
              { id: 'v2', type: 'includes', value: 'box-sizing: border-box', errorMsg: 'Сделайте reset box-sizing' }
            ],
            codeSnippet: `:root {
    --primary: #ff69b4;
    --dark: #333;
    --light: #fff0f5;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}`
          },
          {
            id: 'c2',
            title: 'Типографика',
            description: 'Настройте шрифты для body и заголовков.',
            hint: 'body { font-family: sans-serif; } h1, h2 { color: var(--dark); }',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'font-family', errorMsg: 'Задайте шрифт' },
              { id: 'v2', type: 'includes', value: 'color:', errorMsg: 'Задайте цвета текста' }
            ],
            codeSnippet: `body {
    font-family: 'Helvetica Neue', sans-serif;
    color: var(--dark);
    background-color: var(--light);
}`
          },
          {
            id: 'c3',
            title: 'Стили Шапки (Header)',
            description: 'Используйте Flexbox для размещения логотипа и меню в одну линию.',
            hint: 'header { display: flex; justify-content: space-between; }',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'display:\\s*flex', errorMsg: 'Используйте Flexbox' },
              { id: 'v2', type: 'regex', value: 'justify-content:\\s*space-between', errorMsg: 'Разнесите элементы по краям' }
            ],
            codeSnippet: `header {
    background: white;
    padding: 1rem 2rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 2px 5px rgba(0,0,0,0.1);
}`
          },
          {
            id: 'c4',
            title: 'Навигация',
            description: 'Уберите маркеры у списка и сделайте ссылки красивыми.',
            hint: 'ul { list-style: none; display: flex; gap: 20px; } a { text-decoration: none; }',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'list-style: none', errorMsg: 'Уберите точки списка' },
              { id: 'v2', type: 'includes', value: 'text-decoration: none', errorMsg: 'Уберите подчеркивание ссылок' }
            ],
            codeSnippet: `nav ul {
    list-style: none;
    display: flex;
    gap: 20px;
}

nav a {
    text-decoration: none;
    color: var(--dark);
    font-weight: bold;
}`
          },
          {
            id: 'c5',
            title: 'Hero Секция',
            description: 'Сделайте Hero секцию большой и по центру.',
            hint: 'height: 60vh; display: flex; justify-content: center; align-items: center; text-align: center;',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'height:', errorMsg: 'Задайте высоту' },
              { id: 'v2', type: 'includes', value: 'text-align: center', errorMsg: 'Выровняйте текст по центру' }
            ],
            codeSnippet: `#hero {
    background: linear-gradient(rgba(0,0,0,0.3), rgba(0,0,0,0.3)), url('bg.jpg');
    height: 400px;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: white;
}`
          },
          {
            id: 'c6',
            title: 'Сетка Товаров (Grid)',
            description: 'Используйте Grid для отображения карточек товаров.',
            hint: 'display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'display: grid', errorMsg: 'Используйте Grid' },
              { id: 'v2', type: 'includes', value: 'repeat(auto-fit', errorMsg: 'Сделайте сетку адаптивной' }
            ],
            codeSnippet: `#products {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
    padding: 2rem;
}`
          },
          {
            id: 'c7',
            title: 'Карточка Товара',
            description: 'Оформите карточку товара: рамка, отступы, тень.',
            hint: '.product-card { background: white; border-radius: 10px; overflow: hidden; }',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'border-radius', errorMsg: 'Скруглите углы' },
              { id: 'v2', type: 'includes', value: 'box-shadow', errorMsg: 'Добавьте тень' }
            ],
            codeSnippet: `.product-card {
    background: white;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    transition: transform 0.3s;
    overflow: hidden;
}

.product-card:hover {
    transform: translateY(-5px);
}`
          },
          {
            id: 'c8',
            title: 'Кнопки и Формы',
            description: 'Стилизуйте кнопки и поля ввода.',
            hint: 'button { background: var(--primary); color: white; border: none; padding: 10px 20px; }',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'background:', errorMsg: 'Задайте фон кнопки' },
              { id: 'v2', type: 'includes', value: 'cursor: pointer', errorMsg: 'Укажите курсор' }
            ],
            codeSnippet: `button {
    background: var(--primary);
    color: white;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-size: 1rem;
}

input, textarea {
    width: 100%;
    padding: 10px;
    margin-bottom: 10px;
    border: 1px solid #ddd;
    border-radius: 5px;
}`
          }
        ]
      },
      {
        id: 't3',
        role: 'JS',
        title: 'Логика и Интерактивность',
        currentStageIndex: 0,
        completed: false,
        stages: [
          {
            id: 'j1',
            title: 'База Данных (Массив)',
            description: 'Создайте массив объектов с данными о цветах.',
            hint: 'const flowers = [{id: 1, name: "Rose", price: 500}, ...]',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'const flowers = \\[', errorMsg: 'Создайте массив flowers' },
              { id: 'v2', type: 'includes', value: 'price:', errorMsg: 'Укажите цену' }
            ],
            codeSnippet: `const flowers = [
    { id: 1, name: "Красная Роза", price: 500, image: "rose.jpg" },
    { id: 2, name: "Белая Лилия", price: 700, image: "lily.jpg" },
    { id: 3, name: "Тюльпан", price: 300, image: "tulip.jpg" },
    { id: 4, name: "Орхидея", price: 1200, image: "orchid.jpg" }
];`
          },
          {
            id: 'j2',
            title: 'Рендеринг Товаров',
            description: 'Напишите функцию renderProducts(), которая выводит товары на страницу.',
            hint: 'Используйте map() и innerHTML для вставки в элемент #products.',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'function renderProducts', errorMsg: 'Создайте функцию renderProducts' },
              { id: 'v2', type: 'includes', value: '.map(', errorMsg: 'Используйте map' },
              { id: 'v3', type: 'includes', value: 'innerHTML', errorMsg: 'Используйте innerHTML' }
            ],
            codeSnippet: `const productsContainer = document.getElementById('products');

function renderProducts(items) {
    productsContainer.innerHTML = items.map(item => \`
        <div class="product-card">
            <img src="\${item.image}" alt="\${item.name}">
            <h3>\${item.name}</h3>
            <p class="price">\${item.price} руб.</p>
            <button onclick="addToCart(\${item.id})">В корзину</button>
        </div>
    \`).join('');
}

renderProducts(flowers);`
          },
          {
            id: 'j3',
            title: 'Состояние Корзины',
            description: 'Создайте переменную для хранения товаров в корзине.',
            hint: 'let cart = [];',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'let cart = \\[\\]', errorMsg: 'Инициализируйте пустой массив cart' }
            ],
            codeSnippet: `let cart = [];
const cartCount = document.getElementById('cart-count'); // Предположим, есть счетчик`
          },
          {
            id: 'j4',
            title: 'Добавление в Корзину',
            description: 'Реализуйте функцию addToCart(id), которая добавляет товар в массив.',
            hint: 'Найдите товар по id и сделайте cart.push().',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'function addToCart', errorMsg: 'Нужна функция addToCart' },
              { id: 'v2', type: 'includes', value: '.push', errorMsg: 'Используйте push' }
            ],
            codeSnippet: `function addToCart(id) {
    const flower = flowers.find(f => f.id === id);
    if (flower) {
        cart.push(flower);
        alert(flower.name + ' добавлен в корзину!');
        console.log('Текущая корзина:', cart);
    }
}`
          },
          {
            id: 'j5',
            title: 'Подсчет Суммы',
            description: 'Создайте функцию для расчета общей стоимости корзины.',
            hint: 'Используйте reduce().',
            validationRules: [
              { id: 'v1', type: 'includes', value: '.reduce', errorMsg: 'Используйте reduce для суммы' }
            ],
            codeSnippet: `function getTotal() {
    return cart.reduce((sum, item) => sum + item.price, 0);
}`
          },
          {
            id: 'j6',
            title: 'Фильтрация по Цене',
            description: 'Реализуйте функцию для показа только дешевых цветов (до 600 руб).',
            hint: 'filter(item => item.price < 600).',
            validationRules: [
              { id: 'v1', type: 'includes', value: '.filter', errorMsg: 'Используйте filter' },
              { id: 'v2', type: 'includes', value: 'renderProducts', errorMsg: 'Перерисуйте товары' }
            ],
            codeSnippet: `function filterCheap() {
    const cheapFlowers = flowers.filter(f => f.price < 600);
    renderProducts(cheapFlowers);
}`
          },
          {
            id: 'j7',
            title: 'Валидация Формы',
            description: 'Проверьте, что email содержит @ при отправке формы.',
            hint: 'event.preventDefault(); if (!email.includes("@")) ...',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'addEventListener', errorMsg: 'Слушайте событие submit' },
              { id: 'v2', type: 'includes', value: 'preventDefault', errorMsg: 'Отмените стандартную отправку' }
            ],
            codeSnippet: `const form = document.querySelector('form');
form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = form.querySelector('input[type="email"]').value;
    if (!email.includes('@')) {
        alert('Введите корректный email');
    } else {
        alert('Спасибо за сообщение!');
    }
});`
          },
          {
            id: 'j8',
            title: 'Очистка Корзины',
            description: 'Добавьте функцию для полной очистки корзины.',
            hint: 'cart = [];',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'cart = \\[\\]', errorMsg: 'Обнулите массив cart' }
            ],
            codeSnippet: `function clearCart() {
    cart = [];
    alert('Корзина очищена');
    // Обновите UI если нужно
}`
          }
        ]
      },
      {
        id: 't4',
        role: 'SQL',
        title: 'База Данных',
        currentStageIndex: 0,
        completed: false,
        stages: [
          {
            id: 's1',
            title: 'Таблица Товаров',
            description: 'Создайте таблицу flowers с полями id, name, price, stock.',
            hint: 'CREATE TABLE flowers (id INT PRIMARY KEY, name VARCHAR(50), ...)',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'CREATE TABLE flowers', errorMsg: 'Создайте таблицу flowers' },
              { id: 'v2', type: 'includes', value: 'PRIMARY KEY', errorMsg: 'Укажите первичный ключ' }
            ],
            codeSnippet: `CREATE TABLE flowers (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10, 2),
    stock INT,
    description TEXT
);`
          },
          {
            id: 's2',
            title: 'Заполнение Склада',
            description: 'Добавьте 5 видов цветов в таблицу.',
            hint: 'INSERT INTO flowers VALUES ...',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'INSERT INTO', errorMsg: 'Используйте INSERT' },
              { id: 'v2', type: 'regex', value: 'VALUES.*\\),.*\\(', errorMsg: 'Вставьте несколько строк' }
            ],
            codeSnippet: `INSERT INTO flowers (id, name, price, stock) VALUES
(1, 'Роза Красная', 500, 100),
(2, 'Лилия Белая', 700, 50),
(3, 'Тюльпан Желтый', 300, 200),
(4, 'Орхидея', 1200, 15),
(5, 'Пион', 600, 80);`
          },
          {
            id: 's3',
            title: 'Таблица Клиентов',
            description: 'Создайте таблицу clients для хранения информации о покупателях.',
            hint: 'CREATE TABLE clients (id INT, name VARCHAR, email VARCHAR)',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'CREATE TABLE clients', errorMsg: 'Создайте таблицу clients' }
            ],
            codeSnippet: `CREATE TABLE clients (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(20)
);`
          },
          {
            id: 's4',
            title: 'Таблица Заказов',
            description: 'Создайте таблицу orders, связывающую клиентов и товары.',
            hint: 'FOREIGN KEY (client_id) REFERENCES clients(id)',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'CREATE TABLE orders', errorMsg: 'Создайте таблицу orders' },
              { id: 'v2', type: 'includes', value: 'FOREIGN KEY', errorMsg: 'Используйте внешние ключи' }
            ],
            codeSnippet: `CREATE TABLE orders (
    id INT PRIMARY KEY,
    client_id INT,
    flower_id INT,
    quantity INT,
    order_date DATE,
    FOREIGN KEY (client_id) REFERENCES clients(id),
    FOREIGN KEY (flower_id) REFERENCES flowers(id)
);`
          },
          {
            id: 's5',
            title: 'Выборка Товаров',
            description: 'Получите список всех цветов дешевле 600 рублей.',
            hint: 'SELECT * FROM flowers WHERE price < 600',
            validationRules: [
              { id: 'v1', type: 'regex', value: 'SELECT.*FROM flowers', errorMsg: 'Делайте выборку из flowers' },
              { id: 'v2', type: 'includes', value: 'WHERE price <', errorMsg: 'Добавьте условие цены' }
            ],
            codeSnippet: `SELECT name, price 
FROM flowers 
WHERE price < 600;`
          },
          {
            id: 's6',
            title: 'Обновление Остатков',
            description: 'Клиент купил 5 роз. Обновите количество на складе (id=1).',
            hint: 'UPDATE flowers SET stock = stock - 5 WHERE id = 1',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'UPDATE flowers', errorMsg: 'Используйте UPDATE' },
              { id: 'v2', type: 'includes', value: 'SET stock', errorMsg: 'Обновите поле stock' }
            ],
            codeSnippet: `UPDATE flowers 
SET stock = stock - 5 
WHERE id = 1;`
          },
          {
            id: 's7',
            title: 'Отчет о Продажах',
            description: 'Посчитайте общее количество проданных цветов каждого типа.',
            hint: 'SELECT flower_id, SUM(quantity) FROM orders GROUP BY flower_id',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'SUM(quantity)', errorMsg: 'Суммируйте количество' },
              { id: 'v2', type: 'includes', value: 'GROUP BY', errorMsg: 'Группируйте результаты' }
            ],
            codeSnippet: `SELECT f.name, SUM(o.quantity) as total_sold
FROM orders o
JOIN flowers f ON o.flower_id = f.id
GROUP BY f.name;`
          },
          {
            id: 's8',
            title: 'Очистка Старых Данных',
            description: 'Удалите заказы, сделанные в прошлом году (для примера).',
            hint: 'DELETE FROM orders WHERE order_date < ...',
            validationRules: [
              { id: 'v1', type: 'includes', value: 'DELETE FROM', errorMsg: 'Используйте DELETE' }
            ],
            codeSnippet: `DELETE FROM orders 
WHERE order_date < '2024-01-01';`
          }
        ]
      }
    ]
  },
  {
    id: 'm2',
    title: 'Крипто Биржа "BitVault"',
    description: 'Высокозащищенная торговая платформа с сокетами реального времени. (Заблокировано)',
    difficulty: 'Hard',
    reward: 1500,
    status: 'available',
    globalDocs: 'Конфиденциально.',
    requiredSpecialization: ['Backend', 'Fullstack'],
    tasks: [] 
  },
  {
    id: 'm3',
    title: 'Мобильная Игра "Space Runner"',
    description: '2D раннер на Unity/React Native для iOS и Android.',
    difficulty: 'Medium',
    reward: 1200,
    status: 'available',
    globalDocs: 'ТЗ на разработку игровых механик.',
    requiredSpecialization: ['Mobile', 'GameDev'],
    tasks: []
  }
];
