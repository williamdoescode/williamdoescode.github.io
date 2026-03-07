// ─── Hamburger Menu ───────────────────────
function toggleMenu() {
    const menu = document.querySelector(".menu-links");
    const icon = document.querySelector(".hamburger-icon");
    menu.classList.toggle("open");
    icon.classList.toggle("open");
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    const hamburgerMenu = document.querySelector('.hamburger-menu');
    if (hamburgerMenu && !hamburgerMenu.contains(e.target)) {
        const menu = document.querySelector('.menu-links');
        const icon = document.querySelector('.hamburger-icon');
        if (menu && menu.classList.contains('open')) {
            menu.classList.remove('open');
            icon.classList.remove('open');
        }
    }
});

// ─── Scroll Reveal ────────────────────────
document.addEventListener("DOMContentLoaded", () => {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

    // Trigger hero immediately
    const hero = document.querySelector('#profile .profile-content');
    if (hero) {
        setTimeout(() => hero.classList.add('visible'), 100);
    }
});

// ─── Active nav link on scroll ───────────
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-links a, .menu-links a');

const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            navLinks.forEach(link => {
                link.classList.remove('nav-active');
                if (link.getAttribute('href') === `#${entry.target.id}`) {
                    link.classList.add('nav-active');
                }
            });
        }
    });
}, { threshold: 0.4 });

sections.forEach(s => sectionObserver.observe(s));

// ─── Scroll-triggered skill bar animation ─
const skillBars = document.querySelectorAll('.skill-fill');
const barObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, { threshold: 0.3 });

skillBars.forEach(bar => {
    bar.style.animationPlayState = 'paused';
    barObserver.observe(bar);
});

// ─── Project Modal System ─────────────────
let currentProjectImages = [];
let currentSlideIndex = 0;

function openModal(card) {
    const modal = document.getElementById('project-modal');
    const title = card.getAttribute('data-title');
    const desc = card.getAttribute('data-desc');
    const tags = card.getAttribute('data-tags').split(',');
    const images = card.getAttribute('data-images').split(',');

    document.getElementById('modal-title').innerText = title;
    document.getElementById('modal-desc').innerText = desc;

    // Inject Tags
    const tagsContainer = document.getElementById('modal-tags');
    tagsContainer.innerHTML = tags.map(tag => `<span>${tag.trim()}</span>`).join('');

    // Prepare Images
    currentProjectImages = images;
    currentSlideIndex = 0;

    const imageContainer = document.getElementById('modal-images');
    imageContainer.innerHTML = images.map(img => `<img src="${img.trim()}" alt="${title} screenshot">`).join('');

    // Inject Dots
    const dotsContainer = document.getElementById('carousel-dots');
    dotsContainer.innerHTML = images.map((_, index) => `<div class="dot ${index === 0 ? 'active' : ''}" onclick="goToSlide(${index})"></div>`).join('');

    updateCarousel();

    modal.classList.add('open');
    document.body.style.overflow = 'hidden'; // Prevent scroll
}

function closeModal() {
    const modal = document.getElementById('project-modal');
    modal.classList.remove('open');
    document.body.style.overflow = '';
}

function changeSlide(direction) {
    currentSlideIndex += direction;
    if (currentSlideIndex >= currentProjectImages.length) currentSlideIndex = 0;
    if (currentSlideIndex < 0) currentSlideIndex = currentProjectImages.length - 1;
    updateCarousel();
}

function goToSlide(index) {
    currentSlideIndex = index;
    updateCarousel();
}

function updateCarousel() {
    const imageContainer = document.getElementById('modal-images');
    imageContainer.style.transform = `translateX(-${currentSlideIndex * 100}%)`;

    const dots = document.querySelectorAll('.dot');
    dots.forEach((dot, index) => {
        dot.classList.toggle('active', index === currentSlideIndex);
    });
}

// Bind project card clicks
document.addEventListener('DOMContentLoaded', () => {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('click', () => openModal(card));
    });

    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
});