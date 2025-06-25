// Preloader
document.addEventListener('DOMContentLoaded', () => {
    const preloader = document.getElementById('preloader');
    
    // Simulate loading time (you can remove this setTimeout if you want it to hide immediately after load)
    setTimeout(() => {
        document.body.classList.add('loaded');
        setTimeout(() => {
            preloader.style.display = 'none';
        }, 500); // Match this with the CSS transition time
    }, 2000); // Adjust this time as needed
});

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

// Neural Network Background
class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.radius = Math.random() * 1.5;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < 0 || this.x > window.innerWidth) this.vx *= -1;
        if (this.y < 0 || this.y > window.innerHeight) this.vy *= -1;
    }
}

class NeuralNetwork {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'particles-network';
        document.body.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.connectionDistance = 100;
        this.init();
    }

    init() {
        this.resize();
        this.createParticles();
        this.animate();
        this.addEventListeners();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createParticles() {
        const particleCount = Math.min(Math.floor((window.innerWidth * window.innerHeight) / 10000), 100);
        for (let i = 0; i < particleCount; i++) {
            this.particles.push(new Particle(
                Math.random() * window.innerWidth,
                Math.random() * window.innerHeight
            ));
        }
    }

    drawConnections() {
        this.ctx.strokeStyle = '#6e00ff';
        this.ctx.lineWidth = 0.3;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.connectionDistance) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }

            // Connect to mouse
            const dx = this.particles[i].x - this.mouseX;
            const dy = this.particles[i].y - this.mouseY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < this.connectionDistance * 1.5) {
                this.ctx.beginPath();
                this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                this.ctx.lineTo(this.mouseX, this.mouseY);
                this.ctx.stroke();
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach(particle => particle.update());
        this.drawConnections();

        requestAnimationFrame(() => this.animate());
    }

    addEventListeners() {
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
        });
    }
}

// Initialize Neural Network
const neuralNetwork = new NeuralNetwork();

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

// Enhanced Smooth Scrolling
const smoothScroll = (target) => {
    const targetPosition = target.getBoundingClientRect().top + window.pageYOffset;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    const duration = 1000;
    let start = null;

    const animation = (currentTime) => {
        if (start === null) start = currentTime;
        const timeElapsed = currentTime - start;
        const progress = Math.min(timeElapsed / duration, 1);
        const easeInOutCubic = progress < 0.5
            ? 4 * progress * progress * progress
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
            
        window.scrollTo(0, startPosition + distance * easeInOutCubic);

        if (timeElapsed < duration) {
            requestAnimationFrame(animation);
        }
    };

    requestAnimationFrame(animation);
};

// Update smooth scrolling event listeners
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            smoothScroll(target);
        }
    });
});

// Update scroll indicator behavior
const scrollIndicator = document.querySelector('.scroll-indicator');
if (scrollIndicator) {
    scrollIndicator.addEventListener('click', () => {
        const aboutSection = document.getElementById('about');
        if (aboutSection) {
            smoothScroll(aboutSection);
        }
    });

    // Hide scroll indicator when user scrolls down
    window.addEventListener('scroll', () => {
        if (window.scrollY > window.innerHeight * 0.3) {
            scrollIndicator.classList.add('hidden');
        } else {
            scrollIndicator.classList.remove('hidden');
        }
    });
}

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