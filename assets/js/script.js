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

    // Hero Video Sequential Looping - FIXED FOR VISIBILITY
    const heroVideo = document.getElementById('hero-video');
    if (heroVideo) {
        const videos = [
            'assets/videos/video1.mp4',
            'assets/videos/video2.mp4'
        ];
        let currentVideoIndex = 0;

        const setupVideo = (index) => {
            heroVideo.src = videos[index];
            heroVideo.muted = true;
            heroVideo.autoplay = true;
            heroVideo.playsInline = true;
            heroVideo.load();
            
            const playPromise = heroVideo.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Autoplay prevented, waiting for interaction");
                });
            }
        };

        setupVideo(0);

        heroVideo.addEventListener('ended', () => {
            currentVideoIndex = (currentVideoIndex + 1) % videos.length;
            setupVideo(currentVideoIndex);
        });

        // Fallback for browsers that block autoplay
        document.addEventListener('click', () => {
            if (heroVideo.paused) heroVideo.play();
        }, { once: true });
    }

    // Interaction State Management
    const getStorage = (key) => JSON.parse(localStorage.getItem(key) || '{}');
    const setStorage = (key, val) => localStorage.setItem(key, JSON.stringify(val));

    const initializeMediaInteractions = () => {
        // Persistent States
        let likes = getStorage('mediaLikes'); // { mediaId: boolean }
        let likeCounts = getStorage('mediaLikeCounts'); // { mediaId: number }
        let comments = getStorage('mediaComments'); // { mediaId: Array }

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

        const renderComments = (mediaId) => {
            list.innerHTML = '';
            const mediaComments = comments[mediaId] || [];
            if (mediaComments.length === 0) {
                list.innerHTML = '<p style="text-align:center; color:#999; padding:20px;">No comments yet.</p>';
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

        const updateButtonUI = (mediaId, btn) => {
            const countSpan = btn.querySelector('.action-count');
            if (btn.classList.contains('like-btn')) {
                if (likes[mediaId]) {
                    btn.classList.add('liked');
                } else {
                    btn.classList.remove('liked');
                }
                countSpan.textContent = likeCounts[mediaId] || 0;
            } else if (btn.classList.contains('comment-btn')) {
                countSpan.textContent = (comments[mediaId] || []).length;
            }
        };

        // Initialize each media item
        document.querySelectorAll('.gallery-item, .card').forEach((item, idx) => {
            // Use a unique ID based on content if possible, otherwise index
            const img = item.querySelector('img');
            const iframe = item.querySelector('iframe');
            const mediaId = (img ? img.src : (iframe ? iframe.src : 'media-' + idx)).split('/').pop();
            
            item.setAttribute('data-media-id', mediaId);

            // Wrap gallery images in container for styling
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

            // Add actions if not present
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

            // Initial UI Update
            item.querySelectorAll('.media-action-btn').forEach(btn => updateButtonUI(mediaId, btn));
        });

        // Event Delegation for Actions
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.media-action-btn');
            if (!btn) return;

            const item = btn.closest('.gallery-item, .card');
            const mediaId = item.getAttribute('data-media-id');

            if (btn.classList.contains('like-btn')) {
                if (likes[mediaId]) {
                    delete likes[mediaId];
                    likeCounts[mediaId] = Math.max(0, (likeCounts[mediaId] || 1) - 1);
                } else {
                    likes[mediaId] = true;
                    likeCounts[mediaId] = (likeCounts[mediaId] || 0) + 1;
                }
                setStorage('mediaLikes', likes);
                setStorage('mediaLikeCounts', likeCounts);
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
                const iframe = item.querySelector('iframe');
                const video = item.querySelector('video');
                
                let content = '';
                if (img) content = `<img src="${img.src}">`;
                else if (video) content = `<video src="${video.src}" controls autoplay></video>`;
                else if (iframe) content = `<iframe src="${iframe.src}" frameborder="0" allowfullscreen></iframe>`;

                const fullViewHTML = `
                    <div id="fullview-modal" class="fullview-modal">
                        <div class="fullview-content">
                            <button class="fullview-close-btn">&times;</button>
                            ${content}
                        </div>
                    </div>
                `;
                document.body.insertAdjacentHTML('beforeend', fullViewHTML);
                const fvModal = document.getElementById('fullview-modal');
                fvModal.querySelector('.fullview-close-btn').onclick = () => fvModal.remove();
                fvModal.onclick = (e) => { if (e.target === fvModal) fvModal.remove(); };
            }
        });

        // Comment Submission
        submitBtn.onclick = () => {
            const name = nameInput.value.trim();
            const text = textInput.value.trim();
            if (!name || !text || !activeMediaId) {
                alert('Please enter both name and comment.');
                return;
            }

            if (!comments[activeMediaId]) comments[activeMediaId] = [];
            comments[activeMediaId].push({
                name,
                text,
                date: new Date().toLocaleDateString()
            });

            setStorage('mediaComments', comments);
            textInput.value = '';
            renderComments(activeMediaId);
            
            // Update comment count on the button
            const item = document.querySelector(`[data-media-id="${activeMediaId}"]`);
            if (item) {
                const commentBtn = item.querySelector('.comment-btn');
                if (commentBtn) updateButtonUI(activeMediaId, commentBtn);
            }
        };

        closeBtn.onclick = () => modal.classList.remove('active');
        window.onclick = (e) => { if (e.target === modal) modal.classList.remove('active'); };
    };

    initializeMediaInteractions();
});
