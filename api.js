// Simple API handler for managing likes and comments via Upstash Redis
// This will be called from the frontend to store and retrieve data globally

const REDIS_URL = process.env.KV_REST_API_URL || 'https://special-burro-86422.upstash.io';
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || 'gQAAAAAAAVGWAAlgcDIyOTQ0MmM1NGQxY2I0ODA2OTkzZ mF1NThmYTI1MGU5OQ';

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

// Export functions for use in HTML
if (typeof window !== 'undefined') {
    window.API = {
        getLikesCount,
        incrementLikes,
        decrementLikes,
        getComments,
        addComment
    };
}

module.exports = {
    getLikesCount,
    incrementLikes,
    decrementLikes,
    getComments,
    addComment
};
