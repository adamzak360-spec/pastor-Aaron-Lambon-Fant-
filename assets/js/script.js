document.addEventListener('DOMContentLoaded', () => {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            navLinks.classList.toggle('active');
        });
    }

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelector(this.getAttribute('href')).scrollIntoView({
                behavior: 'smooth'
            });
        });
    });

    // Scroll Animations (Simple implementation)
    const observerOptions = {
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-in');
            }
        });
    }, observerOptions);

    document.querySelectorAll('section').forEach(section => {
        observer.observe(section);
    });
});

// Hero Video Sequential Looping
document.addEventListener('DOMContentLoaded', () => {
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const videos = [
            'assets/videos/video1.mp4',
            'assets/videos/video2.mp4'
        ];
        let currentVideoIndex = 0;

        function playNextVideo() {
            heroVideo.src = videos[currentVideoIndex];
            heroVideo.play().catch(error => {
                console.log("Video autoplay was prevented. User interaction might be required.", error);
            });
            currentVideoIndex = (currentVideoIndex + 1) % videos.length;
        }

        heroVideo.addEventListener('ended', playNextVideo);

        // Initial play
        playNextVideo();
    }
});
