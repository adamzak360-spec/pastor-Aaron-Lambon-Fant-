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

    // Hero Video Sequential Looping - OPTIMIZED FOR INSTANT PLAYBACK
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const videos = [
            'assets/videos/video1.mp4',
            'assets/videos/video2.mp4'
        ];
        let currentVideoIndex = 0;

        // Set initial source with autoplay attributes
        heroVideo.autoplay = true;
        heroVideo.muted = true;
        heroVideo.playsinline = true;
        heroVideo.preload = 'auto';
        heroVideo.src = videos[0];
        heroVideo.load();

        function playNextVideo() {
            currentVideoIndex = (currentVideoIndex + 1) % videos.length;
            heroVideo.src = videos[currentVideoIndex];
            heroVideo.preload = 'auto';
            heroVideo.load();
            heroVideo.play().catch(error => {
                console.log("Video autoplay was prevented.", error);
            });
        }

        heroVideo.addEventListener('ended', playNextVideo);

        // Attempt initial play
        heroVideo.play().catch(error => {
            console.log("Initial autoplay prevented. Waiting for user interaction.", error);
            // Add a click listener to the document to start video if autoplay is blocked
            document.addEventListener('click', () => {
                heroVideo.play();
            }, { once: true });
        });
    }

    // Gallery and Video Interaction Features
    const initializeMediaInteractions = () => {
        // Create comment modal HTML
        const commentModalHTML = `
            <div id="comment-modal" class="comment-modal">
                <div class="comment-modal-content">
                    <div class="comment-modal-header">
                        <h3>Comments</h3>
                        <button class="comment-close-btn">&times;</button>
                    </div>
                    <div class="comment-modal-body">
                        <div class="comments-list"></div>
                        <div class="comment-input-section">
                            <textarea class="comment-input" placeholder="Share your thoughts..."></textarea>
                            <button class="comment-submit-btn">Post Comment</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Add modal to body if not already present
        if (!document.getElementById('comment-modal')) {
            document.body.insertAdjacentHTML('beforeend', commentModalHTML);
        }

        const commentModal = document.getElementById('comment-modal');
        const closeBtn = document.querySelector('.comment-close-btn');
        const commentInput = document.querySelector('.comment-input');
        const submitBtn = document.querySelector('.comment-submit-btn');
        const commentsList = document.querySelector('.comments-list');
        let currentMediaId = null;
        let mediaComments = {};

        // Close modal
        closeBtn.addEventListener('click', () => {
            commentModal.classList.remove('active');
        });

        // Close modal when clicking outside
        commentModal.addEventListener('click', (e) => {
            if (e.target === commentModal) {
                commentModal.classList.remove('active');
            }
        });

        // Submit comment
        submitBtn.addEventListener('click', () => {
            const text = commentInput.value.trim();
            if (text && currentMediaId) {
                if (!mediaComments[currentMediaId]) {
                    mediaComments[currentMediaId] = [];
                }
                
                const comment = {
                    id: Date.now(),
                    text: text,
                    author: 'Anonymous',
                    timestamp: new Date().toLocaleString(),
                    likes: 0
                };
                
                mediaComments[currentMediaId].push(comment);
                commentInput.value = '';
                renderComments(currentMediaId);
                
                // Save to localStorage
                localStorage.setItem('mediaComments', JSON.stringify(mediaComments));
            }
        });

        // Allow Enter key to submit
        commentInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                submitBtn.click();
            }
        });

        function renderComments(mediaId) {
            commentsList.innerHTML = '';
            const comments = mediaComments[mediaId] || [];
            
            if (comments.length === 0) {
                commentsList.innerHTML = '<p class="no-comments">No comments yet. Be the first to comment!</p>';
                return;
            }
            
            comments.forEach(comment => {
                const commentEl = document.createElement('div');
                commentEl.className = 'comment-item';
                commentEl.innerHTML = `
                    <div class="comment-header">
                        <strong>${comment.author}</strong>
                        <span class="comment-time">${comment.timestamp}</span>
                    </div>
                    <p class="comment-text">${comment.text}</p>
                    <div class="comment-actions">
                        <button class="comment-like-btn" data-comment-id="${comment.id}">
                            <i class="fas fa-thumbs-up"></i> Like (${comment.likes})
                        </button>
                    </div>
                `;
                
                const likeBtn = commentEl.querySelector('.comment-like-btn');
                likeBtn.addEventListener('click', () => {
                    comment.likes++;
                    localStorage.setItem('mediaComments', JSON.stringify(mediaComments));
                    renderComments(mediaId);
                });
                
                commentsList.appendChild(commentEl);
            });
        }

        // Open comment modal
        function openCommentModal(mediaId) {
            currentMediaId = mediaId;
            renderComments(mediaId);
            commentModal.classList.add('active');
            commentInput.focus();
        }

        // Initialize media action buttons
        document.querySelectorAll('.gallery-item, .card .video-container').forEach((item, index) => {
            const mediaId = `media-${index}`;
            item.setAttribute('data-media-id', mediaId);
            
            // Create action buttons container
            const actionsHTML = `
                <div class="media-actions">
                    <button class="media-action-btn like-btn" title="Like">
                        <i class="fas fa-heart"></i>
                        <span class="action-count">0</span>
                    </button>
                    <button class="media-action-btn comment-btn" title="Comment">
                        <i class="fas fa-comment"></i>
                        <span class="action-count">0</span>
                    </button>
                    <button class="media-action-btn share-btn" title="Share">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="media-action-btn fullview-btn" title="View Full">
                        <i class="fas fa-expand"></i>
                    </button>
                </div>
            `;
            
            item.insertAdjacentHTML('beforeend', actionsHTML);
        });

        // Attach event listeners to action buttons
        document.querySelectorAll('.media-action-btn').forEach(btn => {
            const mediaItem = btn.closest('.gallery-item, .card .video-container');
            const mediaId = mediaItem.getAttribute('data-media-id');
            
            if (btn.classList.contains('like-btn')) {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('liked');
                    let count = parseInt(btn.querySelector('.action-count').textContent);
                    count = btn.classList.contains('liked') ? count + 1 : count - 1;
                    btn.querySelector('.action-count').textContent = count;
                });
            }
            
            if (btn.classList.contains('comment-btn')) {
                btn.addEventListener('click', () => {
                    const comments = mediaComments[mediaId] || [];
                    btn.querySelector('.action-count').textContent = comments.length;
                    openCommentModal(mediaId);
                });
            }
            
            if (btn.classList.contains('share-btn')) {
                btn.addEventListener('click', () => {
                    if (navigator.share) {
                        navigator.share({
                            title: 'Check this out',
                            text: 'Check out this amazing content!',
                            url: window.location.href
                        }).catch(err => console.log('Share failed:', err));
                    } else {
                        alert('Share this link: ' + window.location.href);
                    }
                });
            }
            
            if (btn.classList.contains('fullview-btn')) {
                btn.addEventListener('click', () => {
                    const img = mediaItem.querySelector('img');
                    const video = mediaItem.querySelector('video');
                    const iframe = mediaItem.querySelector('iframe');
                    
                    if (img) {
                        openFullViewModal(img.src, 'image');
                    } else if (video) {
                        openFullViewModal(video.src, 'video');
                    } else if (iframe) {
                        openFullViewModal(iframe.src, 'iframe');
                    }
                });
            }
        });

        // Full view modal
        function openFullViewModal(src, type) {
            const fullViewHTML = `
                <div id="fullview-modal" class="fullview-modal">
                    <div class="fullview-content">
                        <button class="fullview-close-btn">&times;</button>
                        ${type === 'image' ? `<img src="${src}" alt="Full view">` : ''}
                        ${type === 'video' ? `<video controls style="width:100%; height:auto;"><source src="${src}" type="video/mp4"></video>` : ''}
                        ${type === 'iframe' ? `<iframe src="${src}" frameborder="0" allowfullscreen style="width:100%; height:600px;"></iframe>` : ''}
                    </div>
                </div>
            `;
            
            // Remove existing modal if present
            const existing = document.getElementById('fullview-modal');
            if (existing) existing.remove();
            
            document.body.insertAdjacentHTML('beforeend', fullViewHTML);
            
            const modal = document.getElementById('fullview-modal');
            const closeBtn = modal.querySelector('.fullview-close-btn');
            
            closeBtn.addEventListener('click', () => modal.remove());
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.remove();
            });
        }

        // Load comments from localStorage
        const savedComments = localStorage.getItem('mediaComments');
        if (savedComments) {
            mediaComments = JSON.parse(savedComments);
        }
    };

    // Initialize media interactions when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeMediaInteractions);
    } else {
        initializeMediaInteractions();
    }
});
