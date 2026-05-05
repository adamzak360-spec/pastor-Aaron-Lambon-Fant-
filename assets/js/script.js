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

    // Hero Video Sequential Looping
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const videos = [
            'assets/videos/video1.mp4',
            'assets/videos/video2.mp4'
        ];
        let currentVideoIndex = 0;

        // Set initial source and preload both
        heroVideo.src = videos[0];
        heroVideo.load();

        function playNextVideo() {
            currentVideoIndex = (currentVideoIndex + 1) % videos.length;
            
            // To prevent the "blank" gap, we update the source and immediately play.
            // Using a single video element can sometimes cause a flash.
            // But with preloading and direct src change it should be minimal.
            heroVideo.src = videos[currentVideoIndex];
            heroVideo.play().catch(error => {
                console.log("Video autoplay was prevented.", error);
            });
        }

        heroVideo.addEventListener('ended', playNextVideo);

        // Attempt initial play
        heroVideo.play().catch(error => {
            console.log("Initial autoplay prevented. Waiting for user interaction.", error);
            // Optional: add a click listener to the document to start video if autoplay is blocked
            document.addEventListener('click', () => {
                heroVideo.play();
            }, { once: true });
        });
    }
});
