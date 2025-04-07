const compliments = [
    "Ты самое прекрасное, что случилось в моей жизни ❤️",
    "Твоя улыбка делает мой день ярче ✨",
    "Ты невероятно красивая и добрая 🌸",
    "С тобой я чувствую себя самым счастливым человеком на свете 💫",
    "Твои глаза - это целая вселенная, в которой я хочу потеряться 🌟",
    "Ты вдохновляешь меня каждый день 🌺",
    "Твоя доброта и забота делают мир лучше 💖",
    "Ты - мое самое большое счастье 🌈",
    "С тобой я чувствую себя дома 🏡",
    "Ты - мое солнышко, которое всегда со мной ☀️",
    "Твоя любовь делает меня сильнее 💪",
    "Ты - мой самый дорогой человек в этом мире 🌍",
    "С тобой каждый день - это праздник 🎉",
    "Ты - мое вдохновение и мотивация 🎯",
    "Твоя улыбка - это самое красивое, что я когда-либо видел 😊"
];

const complimentBtn = document.getElementById('complimentBtn');
const complimentText = document.getElementById('complimentText');
const heartParticles = document.getElementById('heartParticles');
const mainHeart = document.querySelector('.heart'); // Получаем элемент главного сердца

// Задаем массив цветов для сердечек
const particleColors = ['#ff4d4d', '#ff8e8e', '#e68aee']; // Красный, Розовый, Фиолетовый

// Убираем переменные для накопления
// let currentBottomLevel = 40;
// const levelIncrement = 25;
// const maxBottomOffset = window.innerHeight * 0.6;

// Функция для создания падающих сердечек
function createHeartParticle() {
    const heart = document.createElement('div');
    heart.className = 'heart-particle';

    // Выбираем случайный цвет
    const randomColor = particleColors[Math.floor(Math.random() * particleColors.length)];
    heart.style.setProperty('--particle-color', randomColor);

    // Убираем расчеты конечной позиции Y, X, Rotation
    // const finalYOffset = currentBottomLevel;
    // const finalY = `calc(100vh - ${Math.max(20, finalYOffset)}px)`;
    // heart.style.setProperty('--final-y', finalY);
    // const centerBias = 0.95;
    // const horizontalSpread = 0.05;
    // const randomX = (Math.random() - 0.5) * horizontalSpread * (1 - centerBias) * window.innerWidth + window.innerWidth / 2;
    // const finalX = `${Math.max(15, Math.min(window.innerWidth - 15, randomX)) - 15}px`;
    // heart.style.setProperty('--final-x', finalX);
    // const finalRotation = `${(Math.random() - 0.5) * 4}deg`;
    // heart.style.setProperty('--final-rotation', finalRotation);

    // Начальная горизонтальная позиция
    heart.style.left = Math.random() * 95 + 'vw';

    // Устанавливаем длительность и задержку анимации падения
    // Длительность теперь определяет время жизни частицы
    const fallDuration = Math.random() * 3 + 4; // 4-7 секунд
    heart.style.animationDuration = fallDuration + 's';
    heart.style.animationDelay = Math.random() * 0.5 + 's';
    heartParticles.appendChild(heart);

    // Возвращаем удаление сердечка после падения (длительность анимации + небольшая задержка)
    setTimeout(() => {
        heart.remove();
    }, (fallDuration + parseFloat(heart.style.animationDelay || '0')) * 1000 + 500); 

    // Убираем обработчик завершения анимации 'float' и клика по частицам
    // heart.addEventListener('animationend', (event) => { ... });
}

// Убираем постоянное создание сердечек
// setInterval(createHeartParticle, 300);

// Добавляем обработчик клика на главное сердце
mainHeart.addEventListener('click', () => {
    // Добавим эффект клика на основное сердце
    mainHeart.classList.add('clicked');
    // Убираем класс после завершения анимации (например, 0.3 сек)
    setTimeout(() => {
        mainHeart.classList.remove('clicked');
    }, 300); 

    // Создаем "взрыв" сердечек при клике
    for (let i = 0; i < 20; i++) {
        setTimeout(() => {
            createHeartParticle();
        }, i * 50);
    }

    // Убираем подъем уровня дна
    // if (currentBottomLevel < maxBottomOffset) {
    //     currentBottomLevel += levelIncrement;
    // }
});

complimentBtn.addEventListener('click', () => {
    const randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
    complimentText.textContent = randomCompliment;
    complimentText.classList.add('show');
    
    // Убираем создание сердечек из кнопки
    // for (let i = 0; i < 5; i++) {
    //     setTimeout(() => {
    //         createHeartParticle();
    //     }, i * 200);
    // }
    
    // Remove the show class after animation completes
    setTimeout(() => {
        complimentText.classList.remove('show');
    }, 3000);
});

// Добавляем обработчик клика на весь документ
document.addEventListener('click', (event) => {
    // Исключаем клики по кнопке и основному сердцу, чтобы избежать двойных эффектов
    if (event.target === complimentBtn || event.target === mainHeart || mainHeart.contains(event.target)) {
        return;
    }

    createExplosion(event.clientX, event.clientY);
});

// Функция для создания эффекта "взрыва" шариков
function createExplosion(x, y) {
    const particleCount = 10; // Количество шариков
    const explosionRadius = 80; // Максимальный радиус разлета

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'click-particle';

        // Задаем начальную позицию в месте клика
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;

        // Рассчитываем случайное конечное смещение
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * explosionRadius;
        const tx = Math.cos(angle) * radius;
        const ty = Math.sin(angle) * radius;

        // Устанавливаем переменные для анимации
        particle.style.setProperty('--tx', `${tx}px`);
        particle.style.setProperty('--ty', `${ty}px`);

        // Задаем анимацию
        const duration = Math.random() * 0.5 + 0.4; // 0.4-0.9 сек
        particle.style.animation = `explode ${duration}s ease-out forwards`;

        // Добавляем частицу в контейнер (можно прямо в body или в heartParticles)
        document.body.appendChild(particle);
        // Или: heartParticles.appendChild(particle); 

        // Удаляем частицу после завершения анимации
        setTimeout(() => {
            particle.remove();
        }, duration * 1000);
    }
} 