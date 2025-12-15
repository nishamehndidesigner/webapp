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

// NETLIFY-OPTIMIZED PRICING SYSTEM
async function loadPricingData() {
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEETS.PRICING_CSV_URL);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        const csvText = await response.text();
        const data = parseCSV(csvText);
        updatePricingDisplay(data);
    } catch (error) {
        console.error('Pricing load failed:', error);
    }
}

// NETLIFY-OPTIMIZED GALLERY SYSTEM
async function loadGalleryImages() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #8B4513;">Loading images...</div>';
    
    try {
        const images = await scanGitHubRepo();
        displayImagesFromGitHub(images);
    } catch (error) {
        console.error('Gallery load failed:', error);
        showGitHubSetupInstructions();
    }
}

async function scanGitHubRepo() {
    const response = await fetch(CONFIG.GITHUB_REPO.API_URL);
    if (!response.ok) throw new Error(`GitHub API: ${response.status}`);
    
    const files = await response.json();
    const images = { bridal: [], party: [], arabic: [], simple: [] };
    
    files.forEach(file => {
        if (file.type === 'file' && isImageFile(file.name)) {
            const category = getCategoryFromFileName(file.name);
            if (category) {
                images[category].push({
                    name: file.name,
                    url: `https://raw.githubusercontent.com/${CONFIG.GITHUB_REPO.USERNAME}/${CONFIG.GITHUB_REPO.REPO_NAME}/${CONFIG.GITHUB_REPO.BRANCH}/${file.name}`,
                    title: formatTitle(file.name)
                });
            }
        }
    });
    
    return images;
}

function displayImagesFromGitHub(imageData) {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = '';
    
    let totalImages = 0;
    
    Object.entries(imageData).forEach(([category, images]) => {
        images.forEach(image => {
            const galleryItem = document.createElement('div');
            galleryItem.className = `gallery-item ${category}`;
            galleryItem.setAttribute('data-category', category);
            
            const img = document.createElement('img');
            img.src = image.url;
            img.alt = image.title;
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover;';
            img.loading = 'lazy';
            
            img.onerror = () => galleryItem.style.display = 'none';
            
            galleryItem.appendChild(img);
            galleryGrid.appendChild(galleryItem);
            totalImages++;
        });
    });
    
    if (totalImages === 0) {
        showGitHubSetupInstructions();
    }
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

function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        return headers.reduce((obj, header, index) => {
            obj[header] = values[index] || '';
            return obj;
        }, {});
    }).filter(row => row.Service);
}

function updatePricingDisplay(data) {
    data.forEach(row => {
        const element = document.querySelector(`[data-service="${row.Service}"]`);
        if (element && row['Min Price'] && row['Max Price']) {
            const priceEl = element.querySelector('.price');
            if (priceEl) {
                priceEl.textContent = `₹${row['Min Price']}-${row['Max Price']}`;
            }
        }
    });
}

function showGitHubSetupInstructions() {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--white); border-radius: 20px; box-shadow: var(--shadow-md);">
            <h3 style="color: var(--primary); margin-bottom: 1rem;">📁 Upload Images to GitHub</h3>
            <p style="color: var(--text-light); margin-bottom: 2rem;">
                Upload images with naming pattern: bridal_1.jpg, party_1.jpg, arabic_1.jpg, simple_1.jpg
            </p>
            <p style="color: var(--text-muted); font-size: 0.9rem;">
                Repository: github.com/${CONFIG.GITHUB_REPO.USERNAME}/${CONFIG.GITHUB_REPO.REPO_NAME}
            </p>
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