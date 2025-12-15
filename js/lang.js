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
        await loadGoogleSheetsCSV();
    } catch (error) {
        console.error('Failed to load pricing from Google Sheets:', error);
        console.log('Make sure Google Sheet is public: Share > Anyone with link > Viewer');
    }
}

async function loadGoogleSheetsCSV() {
    // Try Netlify proxy first, fallback to direct URL
    const urls = [
        `/api/sheets/${CONFIG.GOOGLE_SHEETS.SHEET_ID}/export?format=csv&gid=0`,
        CONFIG.GOOGLE_SHEETS.CSV_URL
    ];
    
    for (const url of urls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const csvText = await response.text();
                const data = parseCSV(csvText);
                updatePricingDisplay(data);
                console.log('✅ Pricing loaded from Google Sheets');
                return;
            }
        } catch (error) {
            console.log(`Failed to load from ${url}:`, error.message);
        }
    }
    throw new Error('All Google Sheets URLs failed');
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const data = [];
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        // Handle CSV with proper comma splitting (accounting for quoted values)
        const values = line.match(/(?:"[^"]*"|[^,])+/g) || [];
        const cleanValues = values.map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (cleanValues[0] && cleanValues[1] && cleanValues[2]) {
            data.push({
                service: cleanValues[0],
                minPrice: parseInt(cleanValues[1]) || cleanValues[1],
                maxPrice: parseInt(cleanValues[2]) || cleanValues[2]
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
    const { API_BASE_URL, BASE_URL } = CONFIG.GITHUB_REPO;
    
    // Try Netlify proxy first, fallback to direct API
    const urls = [
        `/api/github/repos/${CONFIG.GITHUB_REPO.USERNAME}/${CONFIG.GITHUB_REPO.REPO_NAME}/contents`,
        API_BASE_URL
    ];
    
    for (const url of urls) {
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Nisha-Mehndi-Website'
                }
            });
            
            if (response.ok) {
                const files = await response.json();
                const images = { bridal: [], party: [], arabic: [], simple: [] };
                
                files.forEach(file => {
                    if (file.type === 'file' && isImageFile(file.name)) {
                        const category = getCategoryFromFileName(file.name);
                        if (category && images[category]) {
                            images[category].push({
                                name: file.name,
                                url: BASE_URL + file.name,
                                title: formatTitle(file.name)
                            });
                        }
                    }
                });
                
                return images;
            }
        } catch (error) {
            console.log(`Failed to load from ${url}:`, error.message);
        }
    }
    throw new Error('All GitHub URLs failed');
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
            <h3 style="color: var(--primary); margin-bottom: 1rem;">📸 Gallery Setup Required</h3>
            <p style="color: var(--text-light); margin-bottom: 2rem;">
                GitHub repository needs to be created first.
            </p>
            <div style="background: var(--cream); padding: 2rem; border-radius: 15px; margin: 2rem 0; text-align: left;">
                <h4 style="color: var(--primary); margin-bottom: 1rem;">Setup Steps:</h4>
                <ol style="color: var(--text-light); line-height: 1.8;">
                    <li>Create repository: <strong>github.com/${CONFIG.GITHUB_REPO.USERNAME}/${CONFIG.GITHUB_REPO.REPO_NAME}</strong></li>
                    <li>Make it <strong>PUBLIC</strong></li>
                    <li>Upload images: bridal_1.jpg, party_1.jpg, arabic_1.jpg, simple_1.jpg</li>
                    <li>Redeploy website</li>
                </ol>
            </div>
            <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                <a href="https://github.com/new" target="_blank" class="btn">Create Repository</a>
                <a href="contact.html" class="btn btn-secondary">Contact Us</a>
            </div>
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