// DENTAKORV v3.0 - Main Entry Point
// Psycho Anarco-Punk Prompt Generator

import { initParticles } from './particles.js';
import { initNavigation } from './navigation.js';
import { initGenerator } from './generator.js';
import { initPromptsDB } from './data/prompts-db.js';
import { initAnimation, loadAnimExample } from './animation.js';
import { initPsychoTools } from './psycho-tools.js';
import { initIAAssist } from './ia-assist.js';

// Initialize all modules when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Canvas animation
    initParticles();

    // Navigation and UI
    initNavigation();

    // Main generator
    initGenerator();

    // Prompts database
    initPromptsDB();

    // Animation tab
    initAnimation();

    // Psycho tools (Vision Abstracta + Bypass Espanol)
    initPsychoTools();

    // IA Assist
    initIAAssist();
});

// Expose functions needed by onclick handlers in HTML
window.loadAnimExample = loadAnimExample;
