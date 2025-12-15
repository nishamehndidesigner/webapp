// Netlify Functions Helper for GitHub API
// This file provides helper functions for better GitHub API integration

// GitHub API with retry mechanism
async function fetchWithRetry(url, options = {}, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Nisha-Mehndi-Website',
                    ...options.headers
                }
            });
            
            if (response.ok) {
                return response;
            }
            
            // If rate limited, wait and retry
            if (response.status === 403 && i < maxRetries - 1) {
                const resetTime = response.headers.get('X-RateLimit-Reset');
                const waitTime = resetTime ? (resetTime * 1000 - Date.now()) : 60000;
                console.log(`Rate limited, waiting ${waitTime}ms before retry ${i + 1}`);
                await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 60000)));
                continue;
            }
            
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            console.log(`Attempt ${i + 1} failed, retrying...`, error.message);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Enhanced GitHub image fetcher
async function fetchGitHubImagesEnhanced() {
    const { USERNAME, REPO_NAME, BASE_URL } = CONFIG.GITHUB_REPO;
    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents`;
    
    try {
        const response = await fetchWithRetry(apiUrl);
        const files = await response.json();
        
        const images = { bridal: [], party: [], arabic: [], simple: [] };
        
        files.forEach(file => {
            if (file.type === 'file' && isImageFile(file.name)) {
                const category = getCategoryFromFileName(file.name);
                if (category && images[category]) {
                    images[category].push({
                        name: file.name,
                        url: BASE_URL + file.name,
                        title: formatTitle(file.name),
                        size: file.size,
                        sha: file.sha
                    });
                }
            }
        });
        
        // Sort images by name for consistent ordering
        Object.keys(images).forEach(category => {
            images[category].sort((a, b) => a.name.localeCompare(b.name));
        });
        
        return images;
    } catch (error) {
        console.error('Enhanced GitHub fetch failed:', error);
        throw error;
    }
}

// Preload critical images for better performance
function preloadCriticalImages(images) {
    const criticalImages = [];
    
    // Get first 2 images from each category
    Object.values(images).forEach(categoryImages => {
        criticalImages.push(...categoryImages.slice(0, 2));
    });
    
    criticalImages.forEach(image => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = image.url;
        document.head.appendChild(link);
    });
}

// Export functions for use in main script
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        fetchWithRetry,
        fetchGitHubImagesEnhanced,
        preloadCriticalImages
    };
}