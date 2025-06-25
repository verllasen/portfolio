// Console animation
const consoleContent = document.getElementById('console-content');
const nickname = 'verllasen';
let currentText = '';
let charIndex = 0;
let isFirstCycle = true;

function updateConsoleContent() {
    consoleContent.innerHTML = '> ' + currentText + '█';
}

function typeText() {
    if (!isFirstCycle && currentText === nickname) return;
    
    if (charIndex < nickname.length) {
        currentText += nickname[charIndex];
        updateConsoleContent();
        charIndex++;
        setTimeout(typeText, 150);
    } else {
        if (isFirstCycle) {
            setTimeout(eraseText, 2000);
        }
    }
}

function eraseText() {
    if (currentText.length > 0) {
        currentText = currentText.slice(0, -1);
        updateConsoleContent();
        setTimeout(eraseText, 100);
    } else {
        isFirstCycle = false;
        charIndex = 0;
        setTimeout(typeText, 1000);
    }
}

// Start the console animation
setTimeout(typeText, 1000);

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
        }
    });
});

// Add scroll reveal animation
window.addEventListener('scroll', revealOnScroll);

function revealOnScroll() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        
        if (sectionTop < windowHeight * 0.75) {
            section.style.opacity = '1';
            section.style.transform = 'translateY(0)';
        }
    });
}

// Initialize section animations
document.querySelectorAll('section').forEach(section => {
    section.style.opacity = '0';
    section.style.transform = 'translateY(20px)';
    section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
});

// Trigger initial reveal
revealOnScroll();

// Project cards hover effect
const projectCards = document.querySelectorAll('.project-card');
projectCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        card.style.transform = 'translateY(-10px)';
        card.style.boxShadow = '0 10px 20px rgba(0,0,0,0.2)';
    });
    
    card.addEventListener('mouseleave', () => {
        card.style.transform = 'translateY(0)';
        card.style.boxShadow = 'none';
    });
});

// Scroll Progress Bar
function updateScrollProgress() {
    const scrollProgress = document.querySelector('.scroll-progress');
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    const scrolled = window.scrollY;
    const progress = (scrolled / scrollable) * 100;
    scrollProgress.style.width = `${progress}%`;
}

// Section Visibility
function handleSectionVisibility() {
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionTop = section.getBoundingClientRect().top;
        const windowHeight = window.innerHeight;
        if (sectionTop < windowHeight * 0.75) {
            section.classList.add('visible');
        }
    });
}

// Smooth Scroll for Navigation
document.querySelector('.scroll-indicator').addEventListener('click', () => {
    const aboutSection = document.getElementById('about');
    aboutSection.scrollIntoView({ behavior: 'smooth' });
});

// Event Listeners
window.addEventListener('scroll', () => {
    updateScrollProgress();
    handleSectionVisibility();
});

window.addEventListener('load', () => {
    updateScrollProgress();
    handleSectionVisibility();
});

document.addEventListener('DOMContentLoaded', () => {
    const text = "verllasen";
    const consoleText = document.getElementById('console-text');
    let charIndex = 0;
    let isTyping = true;
    let isErasing = false;

    function typeText() {
        if (isTyping && charIndex < text.length) {
            consoleText.textContent += text.charAt(charIndex);
            charIndex++;
            setTimeout(typeText, Math.random() * 100 + 50);
        } else if (isTyping && charIndex >= text.length) {
            isTyping = false;
            setTimeout(() => {
                isErasing = true;
                eraseText();
            }, 2000);
        }
    }

    function eraseText() {
        if (isErasing && charIndex > 0) {
            charIndex--;
            consoleText.textContent = text.substring(0, charIndex);
            setTimeout(eraseText, Math.random() * 50 + 25);
        } else if (isErasing && charIndex === 0) {
            isErasing = false;
            setTimeout(() => {
                isTyping = true;
                typeText();
            }, 1000);
        }
    }

    // Start typing animation
    typeText();

    // Scroll Progress Bar
    function updateScrollProgress() {
        const scrollProgress = document.querySelector('.scroll-progress');
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const scrolled = window.scrollY;
        const progress = (scrolled / scrollable) * 100;
        scrollProgress.style.width = `${progress}%`;
    }

    // Section Visibility
    function handleSectionVisibility() {
        const sections = document.querySelectorAll('section');
        sections.forEach(section => {
            const sectionTop = section.getBoundingClientRect().top;
            const windowHeight = window.innerHeight;
            if (sectionTop < windowHeight * 0.75) {
                section.classList.add('visible');
            }
        });
    }

    // Smooth Scroll for Navigation
    document.querySelector('.scroll-indicator').addEventListener('click', () => {
        const aboutSection = document.getElementById('about');
        aboutSection.scrollIntoView({ behavior: 'smooth' });
    });

    // Event Listeners
    window.addEventListener('scroll', () => {
        updateScrollProgress();
        handleSectionVisibility();
    });

    window.addEventListener('load', () => {
        updateScrollProgress();
        handleSectionVisibility();
    });
}); 