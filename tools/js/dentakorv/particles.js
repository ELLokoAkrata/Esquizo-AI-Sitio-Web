// DENTAKORV - Chaos Particles Animation

export function initParticles() {
    const canvas = document.getElementById('chaos-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let particles = [];

    function resizeCanvas() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const colors = ['#ff00ff', '#00ffff', '#ff0066', '#66ff00', '#ffff00'];
    for (let i = 0; i < 40; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 2.5 + 0.5,
            color: colors[Math.floor(Math.random() * colors.length)],
            life: Math.random()
        });
    }

    function animateParticles() {
        ctx.fillStyle = 'rgba(10, 5, 15, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        particles.forEach(p => {
            p.x += p.vx + Math.sin(Date.now() / 1000 + p.life * 10) * 0.3;
            p.y += p.vy + Math.cos(Date.now() / 1000 + p.life * 10) * 0.3;
            if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = 0.5 + Math.sin(Date.now() / 500 + p.life * 5) * 0.3;
            ctx.fill();
            ctx.globalAlpha = 1;
        });
        requestAnimationFrame(animateParticles);
    }
    animateParticles();
}
