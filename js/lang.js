// Language Toggle
let currentLang = 'en';

function toggleLang() {
    currentLang = currentLang === 'en' ? 'ta' : 'en';
    updateLanguage();
}

function updateLanguage() {
    document.querySelectorAll('[data-en]').forEach(el => {
        el.textContent = el.getAttribute(`data-${currentLang}`);
    });
}

// NETLIFY-COMPATIBLE PRICING SYSTEM
async function loadPricingData() {
    try {
        // Use JSONP to bypass CORS for Google Sheets
        await loadGoogleSheetsViaJSONP();
    } catch (error) {
        console.error('Failed to load pricing from Google Sheets:', error);
    }
}

function loadGoogleSheetsViaJSONP() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        const callbackName = 'googleSheetsCallback' + Date.now();
        
        // Create global callback function
        window[callbackName] = function(response) {
            try {
                const data = parseGoogleSheetsResponse(response);
                updatePricingDisplay(data);
                console.log('✅ Pricing loaded from Google Sheets');
                resolve(data);
            } catch (error) {
                console.error('Error parsing Google Sheets data:', error);
                reject(error);
            } finally {
                // Cleanup
                document.head.removeChild(script);
                delete window[callbackName];
            }
        };
        
        // Create JSONP URL with callback
        const url = CONFIG.GOOGLE_SHEETS.JSONP_URL + '&tq=SELECT%20*&tqx=out:json;responseHandler:' + callbackName;
        script.src = url;
        script.onerror = () => {
            document.head.removeChild(script);
            delete window[callbackName];
            reject(new Error('Failed to load Google Sheets'));
        };
        
        document.head.appendChild(script);
    });
}

function parseGoogleSheetsResponse(response) {
    const rows = response.table.rows;
    const data = [];
    
    // Skip header row, process data rows
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (row.c && row.c[0] && row.c[1] && row.c[2]) {
            data.push({
                service: row.c[0].v,
                minPrice: row.c[1].v,
                maxPrice: row.c[2].v
            });
        }
    }
    
    return data;
}

function updatePricingDisplay(data) {
    data.forEach(item => {
        const element = document.querySelector(`[data-service="${item.service}"]`);
        if (element && item.minPrice && item.maxPrice) {
            const priceEl = element.querySelector('.price');
            if (priceEl) {
                priceEl.textContent = `₹${item.minPrice}-${item.maxPrice}`;
            }
        }
    });
}

// NETLIFY-COMPATIBLE GALLERY SYSTEM
async function loadGalleryImages() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #8B4513;">Loading images...</div>';
    
    try {
        // Use GitHub API with proper error handling
        const images = await fetchGitHubImages();
        displayImages(images);
        console.log('✅ Images loaded from GitHub');
    } catch (error) {
        console.error('GitHub API failed:', error);
        showGitHubError();
    }
}

async function fetchGitHubImages() {
    const { API_BASE_URL, RAW_BASE_URL } = CONFIG.GITHUB_REPO;
    
    const response = await fetch(API_BASE_URL, {
        method: 'GET',
        headers: {
            'Accept': 'application/vnd.github.v3+json',
            'User-Agent': 'Nisha-Mehndi-Website'
        }
    });
    
    if (!response.ok) {
        throw new Error(`GitHub API failed: ${response.status} ${response.statusText}`);
    }
    
    const files = await response.json();
    const images = { bridal: [], party: [], arabic: [], simple: [] };
    
    files.forEach(file => {
        if (file.type === 'file' && isImageFile(file.name)) {
            const category = getCategoryFromFileName(file.name);
            if (category && images[category]) {
                images[category].push({
                    name: file.name,
                    url: RAW_BASE_URL + file.name,
                    title: formatTitle(file.name)
                });
            }
        }
    });
    
    return images;
}

function displayImages(imageData) {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = '';
    
    let totalImages = 0;
    let loadedImages = 0;
    
    Object.entries(imageData).forEach(([category, images]) => {
        images.forEach(image => {
            totalImages++;
            const galleryItem = createGalleryItem(image, category, () => {
                loadedImages++;
                if (loadedImages === totalImages) {
                    console.log(`✅ All ${totalImages} images loaded successfully`);
                }
            });
            galleryGrid.appendChild(galleryItem);
        });
    });
    
    if (totalImages === 0) {
        showNoImagesMessage();
    }
}

function createGalleryItem(image, category, onLoad) {
    const galleryItem = document.createElement('div');
    galleryItem.className = `gallery-item ${category}`;
    galleryItem.setAttribute('data-category', category);
    
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.title;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    img.loading = 'lazy';
    
    img.onload = () => {
        console.log('✅ Image loaded:', image.name);
        onLoad && onLoad();
    };
    
    img.onerror = () => {
        console.log('❌ Image failed:', image.name);
        galleryItem.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; background: var(--cream); color: var(--text-light); text-align: center; padding: 1rem;">
                <div>
                    <div style="font-size: 2rem; margin-bottom: 0.5rem;">🖼️</div>
                    <div style="font-size: 0.9rem;">${image.title}</div>
                </div>
            </div>
        `;
    };
    
    galleryItem.appendChild(img);
    return galleryItem;
}

function isImageFile(fileName) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
}

function getCategoryFromFileName(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('bridal')) return 'bridal';
    if (name.includes('party')) return 'party';
    if (name.includes('arabic')) return 'arabic';
    if (name.includes('simple')) return 'simple';
    return null;
}

function formatTitle(fileName) {
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split('_');
    const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const number = parts[1] || '1';
    return `${category} Design ${number}`;
}

function showGitHubError() {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: 20px; box-shadow: var(--shadow-md);">
            <h3 style="color: var(--primary); margin-bottom: 1rem;">⚠️ GitHub Repository Issue</h3>
            <p style="color: var(--text-light); margin-bottom: 2rem;">
                Unable to load images from GitHub. Please ensure:
            </p>
            <div style="background: var(--cream); padding: 2rem; border-radius: 15px; margin: 2rem 0;">
                <ul style="text-align: left; color: var(--text-light);">
                    <li>Repository is PUBLIC</li>
                    <li>Images are named: bridal_1.jpg, party_1.jpg, etc.</li>
                    <li>Repository: github.com/${CONFIG.GITHUB_REPO.USERNAME}/${CONFIG.GITHUB_REPO.REPO_NAME}</li>
                </ul>
            </div>
            <a href="contact.html" class="btn">Contact Us Instead</a>
        </div>
    `;
}

function showNoImagesMessage() {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: 20px; box-shadow: var(--shadow-md);">
            <h3 style="color: var(--primary); margin-bottom: 1rem;">📸 No Images Found</h3>
            <p style="color: var(--text-light); margin-bottom: 2rem;">
                No images found in the repository. Please add images with proper naming.
            </p>
            <a href="contact.html" class="btn">View Our Work via WhatsApp</a>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('pricing.html')) {
        loadPricingData();
    }
    
    if (window.location.pathname.includes('gallery.html')) {
        loadGalleryImages();
    }
    
    updateLanguage();
});