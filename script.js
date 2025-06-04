// Mobile menu toggle
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const navLinks = document.querySelector('.nav-links');

mobileMenuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close mobile menu when clicking outside
document.addEventListener('click', (e) => {
    if (!e.target.closest('.main-nav') && navLinks.classList.contains('active')) {
        navLinks.classList.remove('active');
    }
});

// Theme toggle
const themeToggle = document.querySelector('.theme-toggle');
const body = document.body;

themeToggle.addEventListener('click', () => {
    body.classList.toggle('light-theme');
    const icon = themeToggle.querySelector('i');
    if (body.classList.contains('light-theme')) {
        icon.classList.replace('fa-moon', 'fa-sun');
    } else {
        icon.classList.replace('fa-sun', 'fa-moon');
    }
});

// News data
const newsData = [
    {
        title: 'Новое обновление Rust',
        image: 'https://cdn.akamai.steamstatic.com/steam/apps/252490/header.jpg',
        content: 'Добавлены новые монументы и улучшена система крафта...',
        date: '2 часа назад'
    },
    {
        title: 'Dota 2: Новый герой',
        image: 'https://cdn.akamai.steamstatic.com/steam/apps/570/header.jpg',
        content: 'В игру добавлен новый герой с уникальными способностями...',
        date: '5 часов назад'
    },
    {
        title: 'CS2: Обновление карт',
        image: 'https://cdn.akamai.steamstatic.com/steam/apps/730/header.jpg',
        content: 'Переработаны классические карты и добавлены новые режимы...',
        date: '1 день назад'
    },
    {
        title: 'Minecraft: Новый биом',
        image: 'https://cdn.akamai.steamstatic.com/steam/apps/620/header.jpg',
        content: 'В игру добавлен новый биом с уникальными ресурсами и мобами...',
        date: '3 дня назад'
    }
];

// Function to create news cards
function createNewsCard(news) {
    return `
        <article class="news-card">
            <img src="${news.image}" alt="${news.title}">
            <div class="news-content">
                <h3>${news.title}</h3>
                <p>${news.content}</p>
                <span class="news-date">${news.date}</span>
            </div>
        </article>
    `;
}

// Add news cards to the container
const newsContainer = document.querySelector('.news-container');
newsData.forEach(news => {
    newsContainer.innerHTML += createNewsCard(news);
});

// Comment system
function addComment(gameId, username, comment) {
    const commentSection = document.querySelector(`#${gameId} .comments-section`);
    if (!commentSection) return;

    const commentElement = document.createElement('div');
    commentElement.className = 'comment';
    commentElement.innerHTML = `
        <div class="comment-header">
            <span class="username">${username}</span>
            <span class="comment-date">${new Date().toLocaleDateString()}</span>
        </div>
        <p>${comment}</p>
    `;
    commentSection.appendChild(commentElement);
}

// Add comment sections to game articles
document.querySelectorAll('.game-article').forEach(article => {
    const gameId = article.id;
    const commentSection = document.createElement('div');
    commentSection.className = 'comments-section';
    commentSection.innerHTML = `
        <h3>Комментарии</h3>
        <div class="comment-form">
            <input type="text" placeholder="Ваше имя" class="comment-username">
            <textarea placeholder="Ваш комментарий" class="comment-text"></textarea>
            <button class="submit-comment">Отправить</button>
        </div>
        <div class="comments-list"></div>
    `;
    article.querySelector('.game-content').appendChild(commentSection);

    // Add comment submission handler
    const submitBtn = commentSection.querySelector('.submit-comment');
    submitBtn.addEventListener('click', () => {
        const username = commentSection.querySelector('.comment-username').value;
        const comment = commentSection.querySelector('.comment-text').value;
        if (username && comment) {
            addComment(gameId, username, comment);
            commentSection.querySelector('.comment-username').value = '';
            commentSection.querySelector('.comment-text').value = '';
        }
    });
});

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
            // Close mobile menu after clicking a link
            if (navLinks.classList.contains('active')) {
                navLinks.classList.remove('active');
            }
        }
    });
});

// Animation setup
const observerOptions = {
    threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Apply animations to elements
document.querySelectorAll('.game-article, .news-card, .guide-card').forEach(element => {
    element.style.opacity = '0';
    element.style.transform = 'translateY(20px)';
    element.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(element);
});

// Add read more functionality to guides
document.querySelectorAll('.read-more-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const guideContent = this.parentElement;
        const fullContent = guideContent.querySelector('.full-content');
        
        if (fullContent) {
            fullContent.style.display = fullContent.style.display === 'none' ? 'block' : 'none';
            this.textContent = fullContent.style.display === 'none' ? 'Читать далее' : 'Скрыть';
        }
    });
}); 