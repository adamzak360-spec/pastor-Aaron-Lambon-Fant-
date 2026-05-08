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
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // Hero Video Sequential Looping
    const video1 = document.getElementById('hero-video-1');
    const video2 = document.getElementById('hero-video-2');
    
    if (video1 && video2) {
        const videos = [video1, video2];
        let currentIdx = 0;

        const playNext = () => {
            const currentVideo = videos[currentIdx];
            const nextIdx = (currentIdx + 1) % videos.length;
            const nextVideo = videos[nextIdx];

            // Start playing next video before current one ends to ensure smooth transition
            nextVideo.currentTime = 0;
            nextVideo.play().then(() => {
                nextVideo.classList.add('active');
                currentVideo.classList.remove('active');
                currentIdx = nextIdx;
            }).catch(err => console.log("Video play error:", err));
        };

        video1.addEventListener('ended', playNext);
        video2.addEventListener('ended', playNext);

        // Initial play attempt for video1
        video1.play().catch(() => {
            document.addEventListener('click', () => {
                video1.play();
            }, { once: true });
        });
    }

    // Global Redis API Configuration - FIXED TOKEN (removed space)
    const REDIS_URL = 'https://special-burro-86422.upstash.io';
    const REDIS_TOKEN = 'gQAAAAAAAVGWAAlgcDIyOTQ0MmM1NGQxY2I0ODA2OTkzZmF1NThmYTI1MGU5OQ';

    // Helper function to make Redis API calls
    async function redisCall(method, key, value = null) {
        const url = `${REDIS_URL}/${method}/${key}`;
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${REDIS_TOKEN}`,
                'Content-Type': 'application/json'
            }
        };

        if (value !== null) {
            options.body = JSON.stringify(value);
        }

        try {
            const response = await fetch(url, options);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Redis call error:', error);
            return null;
        }
    }

    // Get likes count for a media item
    async function getLikesCount(mediaId) {
        const result = await redisCall('GET', `likes:${mediaId}`);
        return result?.result ? parseInt(result.result) : 0;
    }

    // Increment likes for a media item
    async function incrementLikes(mediaId) {
        const result = await redisCall('INCR', `likes:${mediaId}`);
        return result?.result || 0;
    }

    // Decrement likes for a media item
    async function decrementLikes(mediaId) {
        const result = await redisCall('DECR', `likes:${mediaId}`);
        return Math.max(0, result?.result || 0);
    }

    // Get all comments for a media item
    async function getComments(mediaId) {
        const result = await redisCall('GET', `comments:${mediaId}`);
        return result?.result ? JSON.parse(result.result) : [];
    }

    // Add a comment to a media item
    async function addComment(mediaId, name, text) {
        const comments = await getComments(mediaId);
        comments.push({
            name,
            text,
            date: new Date().toLocaleDateString()
        });
        await redisCall('SET', `comments:${mediaId}`, JSON.stringify(comments));
        return comments;
    }

    // Check if user has liked this media (stored in localStorage for this session)
    const getLocalLikeState = (key) => JSON.parse(localStorage.getItem(key) || '{}');
    const setLocalLikeState = (key, val) => localStorage.setItem(key, JSON.stringify(val));

    const initializeMediaInteractions = () => {
        let localLikes = getLocalLikeState('mediaLikes');

        // Create comment modal HTML
        if (!document.getElementById('comment-modal')) {
            const modalHTML = `
                <div id="comment-modal" class="comment-modal">
                    <div class="comment-modal-content">
                        <div class="comment-modal-header">
                            <h3>Comments</h3>
                            <button class="comment-close-btn">&times;</button>
                        </div>
                        <div class="comment-modal-body">
                            <div class="comments-list"></div>
                            <div class="comment-input-section">
                                <input type="text" class="comment-name-input" placeholder="Your Name">
                                <textarea class="comment-text-input" placeholder="Write your comment..."></textarea>
                                <button class="comment-submit-btn">Post Comment</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
        }

        const modal = document.getElementById('comment-modal');
        const closeBtn = modal.querySelector('.comment-close-btn');
        const nameInput = modal.querySelector('.comment-name-input');
        const textInput = modal.querySelector('.comment-text-input');
        const submitBtn = modal.querySelector('.comment-submit-btn');
        const list = modal.querySelector('.comments-list');
        let activeMediaId = null;

        const renderComments = async (mediaId) => {
            list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">Loading comments...</p>';
            const mediaComments = await getComments(mediaId);
            list.innerHTML = '';
            if (mediaComments.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No comments yet. Be the first to comment!</p>';
                return;
            }
            mediaComments.forEach(c => {
                const item = document.createElement('div');
                item.className = 'comment-item';
                item.innerHTML = `
                    <div class="comment-header">
                        <strong>${c.name}</strong>
                        <span class="comment-time">${c.date}</span>
                    </div>
                    <p class="comment-text">${c.text}</p>
                `;
                list.appendChild(item);
            });
            list.scrollTop = list.scrollHeight;
        };

        const updateButtonUI = async (mediaId, btn) => {
            const countSpan = btn.querySelector('.action-count');
            if (btn.classList.contains('like-btn')) {
                if (localLikes[mediaId]) {
                    btn.classList.add('liked');
                } else {
                    btn.classList.remove('liked');
                }
                const count = await getLikesCount(mediaId);
                countSpan.textContent = count;
            } else if (btn.classList.contains('comment-btn')) {
                const comments = await getComments(mediaId);
                countSpan.textContent = comments.length;
            }
        };

        // Initialize each media item
        document.querySelectorAll('.gallery-item, .card').forEach((item, idx) => {
            const img = item.querySelector('img');
            const iframe = item.querySelector('iframe');
            const mediaId = (img ? img.src : (iframe ? iframe.src : 'media-' + idx)).split('/').pop();
            
            item.setAttribute('data-media-id', mediaId);

            if (item.classList.contains('gallery-item')) {
                const imgEl = item.querySelector('img');
                const overlay = item.querySelector('.gallery-overlay');
                if (imgEl && !item.querySelector('.gallery-img-container')) {
                    const container = document.createElement('div');
                    container.className = 'gallery-img-container';
                    item.insertBefore(container, imgEl);
                    container.appendChild(imgEl);
                    if (overlay) container.appendChild(overlay);
                }
            }

            // Media actions are hidden as per user request
            /*
            if (!item.querySelector('.media-actions')) {
                const actionsHTML = `
                    <div class="media-actions">
                        <button class="media-action-btn like-btn">
                            <i class="fas fa-heart"></i>
                            <span class="action-count">0</span>
                        </button>
                        <button class="media-action-btn comment-btn">
                            <i class="fas fa-comment"></i>
                            <span class="action-count">0</span>
                        </button>
                        <button class="media-action-btn share-btn">
                            <i class="fas fa-share-alt"></i>
                            <span>Share</span>
                        </button>
                        <button class="media-action-btn fullview-btn">
                            <i class="fas fa-expand"></i>
                            <span>Full</span>
                        </button>
                    </div>
                `;
                item.insertAdjacentHTML('beforeend', actionsHTML);
            }

            item.querySelectorAll('.media-action-btn').forEach(btn => updateButtonUI(mediaId, btn));
            */
        });

        // Event Delegation for Actions
        document.addEventListener('click', async (e) => {
            const btn = e.target.closest('.media-action-btn');
            if (!btn) return;

            const item = btn.closest('.gallery-item, .card');
            const mediaId = item.getAttribute('data-media-id');

            if (btn.classList.contains('like-btn')) {
                if (localLikes[mediaId]) {
                    delete localLikes[mediaId];
                    await decrementLikes(mediaId);
                } else {
                    localLikes[mediaId] = true;
                    await incrementLikes(mediaId);
                }
                setLocalLikeState('mediaLikes', localLikes);
                updateButtonUI(mediaId, btn);
            }

            if (btn.classList.contains('comment-btn')) {
                activeMediaId = mediaId;
                renderComments(mediaId);
                modal.classList.add('active');
            }

            if (btn.classList.contains('share-btn')) {
                const url = window.location.href;
                if (navigator.share) {
                    navigator.share({ title: 'Pastor Aaron Lambon Fant', url: url });
                } else {
                    navigator.clipboard.writeText(url);
                    alert('Link copied to clipboard!');
                }
            }

            if (btn.classList.contains('fullview-btn')) {
                const img = item.querySelector('img');
                const video = item.querySelector('video');
                const iframe = item.querySelector('iframe');
                
                let contentHTML = '';
                if (img) contentHTML = `<img src="${img.src}">`;
                else if (video) contentHTML = `<video src="${video.querySelector('source').src}" controls autoplay></video>`;
                else if (iframe) contentHTML = `<iframe src="${iframe.src}" frameborder="0" allowfullscreen></iframe>`;

                const fullviewHTML = `
                    <div class="fullview-modal">
                        <div class="fullview-content">
                            <button class="fullview-close-btn">&times;</button>
                            ${contentHTML}
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', fullviewHTML);
                
                document.querySelector('.fullview-close-btn').addEventListener('click', () => {
                    document.querySelector('.fullview-modal').remove();
                });
            }
        });

        // Modal Close Events
        if (closeBtn) {
            closeBtn.addEventListener('click', () => modal.classList.remove('active'));
        }
        window.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });

        // Comment Submission
        if (submitBtn) {
            submitBtn.addEventListener('click', async () => {
                const name = nameInput.value.trim();
                const text = textInput.value.trim();
                if (!name || !text) {
                    alert('Please enter both name and comment.');
                    return;
                }
                submitBtn.disabled = true;
                submitBtn.textContent = 'Posting...';
                await addComment(activeMediaId, name, text);
                nameInput.value = '';
                textInput.value = '';
                await renderComments(activeMediaId);
                submitBtn.disabled = false;
                submitBtn.textContent = 'Post Comment';
                
                // Update the comment count on the main page
                const item = document.querySelector(`[data-media-id="${activeMediaId}"]`);
                if (item) {
                    const commentBtn = item.querySelector('.comment-btn');
                    if (commentBtn) updateButtonUI(activeMediaId, commentBtn);
                }
            });
        }
    };

    initializeMediaInteractions();
});


    // Flyer Carousel Functionality
    const initializeCarousel = () => {
        const carouselTrack = document.getElementById('carouselTrack');
        const dots = document.querySelectorAll('.dot');
        
        if (!carouselTrack) return;
        
        let currentSlide = 0;
        const totalSlides = 3; // Number of unique flyers
        
        // Update dots
        const updateDots = (index) => {
            dots.forEach((dot, i) => {
                if (i === index) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        };
        
        // Handle dot clicks
        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                currentSlide = index;
                updateDots(currentSlide);
                // Pause animation briefly when user clicks
                carouselTrack.classList.add('paused');
                setTimeout(() => {
                    carouselTrack.classList.remove('paused');
                }, 3000);
            });
        });
        
        // Update dots on page load
        updateDots(0);
        
        // Optional: Sync dots with carousel scroll position
        // This creates a more interactive experience
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Carousel is visible
                }
            });
        });
        
        observer.observe(carouselTrack);
    };
    
    // Initialize carousel when DOM is ready
    initializeCarousel();
});
