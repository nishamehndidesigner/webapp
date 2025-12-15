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

// PRICING SYSTEM - CSV ONLY
async function loadPricingData() {
    console.log('📊 Fetching pricing from:', CONFIG.GOOGLE_SHEETS.CSV_URL);
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEETS.CSV_URL);
        console.log('📊 Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log('📊 CSV length:', csvText.length, 'First 100 chars:', csvText.substring(0, 100));
        
        const data = parseCSV(csvText);
        console.log('📊 Parsed data:', data);
        
        updatePricingDisplay(data);
        console.log('✅ Pricing loaded from Google Sheets');
    } catch (error) {
        console.error('❌ Failed to load pricing:', error);
        console.error('Make sure Google Sheet is PUBLIC: Share > Anyone with link > Viewer');
    }
}

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const data = [];
    
    // Skip header row (i=1)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        
        if (values[0] && values[1] && values[2]) {
            data.push({
                service: values[0],
                minPrice: values[1],
                maxPrice: values[2]
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

// GALLERY SYSTEM - RAW URLS ONLY
async function loadGalleryImages() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) {
        console.log('❌ Gallery grid not found');
        return;
    }
    
    galleryGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #8B4513;">Loading images...</div>';
    
    console.log('🖼️ Fetching images from:', CONFIG.GITHUB_REPO.API_BASE_URL);
    
    try {
        const response = await fetch(CONFIG.GITHUB_REPO.API_BASE_URL);
        console.log('🖼️ Response status:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const files = await response.json();
        console.log('🖼️ Found files:', files.length);
        
        const images = { bridal: [], party: [], arabic: [], simple: [] };
        
        files.forEach(file => {
            if (file.type === 'file' && isImageFile(file.name)) {
                const category = getCategoryFromFileName(file.name);
                console.log('🖼️ Image:', file.name, 'Category:', category);
                if (category && images[category]) {
                    images[category].push({
                        name: file.name,
                        url: CONFIG.GITHUB_REPO.RAW_BASE_URL + file.name,
                        title: formatTitle(file.name)
                    });
                }
            }
        });
        
        console.log('🖼️ Categorized images:', images);
        displayImages(images);
        console.log('✅ Images loaded from GitHub');
    } catch (error) {
        console.error('❌ GitHub failed:', error);
        showGitHubError();
    }
}

function displayImages(imageData) {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = '';
    
    let totalImages = 0;
    
    Object.entries(imageData).forEach(([category, images]) => {
        images.forEach(image => {
            totalImages++;
            const galleryItem = createGalleryItem(image, category);
            galleryGrid.appendChild(galleryItem);
        });
    });
    
    if (totalImages === 0) {
        showNoImagesMessage();
    }
}

function createGalleryItem(image, category) {
    const galleryItem = document.createElement('div');
    galleryItem.className = `gallery-item ${category}`;
    galleryItem.setAttribute('data-category', category);
    
    const img = document.createElement('img');
    img.src = image.url;
    img.alt = image.title;
    img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
    img.loading = 'lazy';
    
    img.onload = () => console.log('✅ Image loaded:', image.name);
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
            <h3 style="color: var(--primary); margin-bottom: 1rem;">📸 Repository Issue</h3>
            <p style="color: var(--text-light);">Unable to load images from GitHub repository.</p>
            <a href="contact.html" class="btn" style="margin-top: 1rem;">Contact Us</a>
        </div>
    `;
}

function showNoImagesMessage() {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: 20px; box-shadow: var(--shadow-md);">
            <h3 style="color: var(--primary); margin-bottom: 1rem;">📸 No Images Found</h3>
            <p style="color: var(--text-light);">Please add images to the repository.</p>
        </div>
    `;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Page loaded:', window.location.pathname);
    
    // More flexible path detection for Netlify
    const path = window.location.pathname.toLowerCase();
    const isPricing = path.includes('pricing') || document.querySelector('[data-service]');
    const isGallery = path.includes('gallery') || document.querySelector('.gallery-grid');
    
    if (isPricing) {
        console.log('📊 Loading pricing data...');
        loadPricingData();
    }
    
    if (isGallery) {
        console.log('🖼️ Loading gallery images...');
        loadGalleryImages();
    }
    
    updateLanguage();
});