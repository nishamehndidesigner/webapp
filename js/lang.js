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

// FREE Google Sheets Integration - PRICING ONLY
async function loadPricingData() {
    try {
        const response = await fetch(CONFIG.GOOGLE_SHEETS.PRICING_CSV_URL);
        const csvText = await response.text();
        const data = parseCSV(csvText);
        updatePricingDisplay(data);
    } catch (error) {
        loadFallbackPricing();
    }
}

// AUTO-SCAN GITHUB REPOSITORY FOR IMAGES
async function loadGalleryImages() {
    const galleryGrid = document.querySelector('.gallery-grid');
    if (!galleryGrid) return;
    
    galleryGrid.innerHTML = '<div style="text-align: center; padding: 2rem; color: #8B4513;">Loading images from GitHub...</div>';
    
    try {
        const images = await scanGitHubRepo();
        displayImagesFromGitHub(images);
    } catch (error) {
        console.error('Error loading GitHub images:', error);
        showGitHubSetupInstructions();
    }
}

async function scanGitHubRepo() {
    const { USERNAME, REPO_NAME, BRANCH } = CONFIG.GITHUB_REPO;
    const apiUrl = `https://api.github.com/repos/${USERNAME}/${REPO_NAME}/contents?ref=${BRANCH}`;
    
    console.log('Scanning GitHub repo:', apiUrl);
    
    const response = await fetch(apiUrl);
    if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const files = await response.json();
    console.log('GitHub files found:', files);
    
    // Filter and categorize image files
    const images = { bridal: [], party: [], arabic: [], simple: [] };
    
    files.forEach(file => {
        if (file.type === 'file' && isImageFile(file.name)) {
            const category = getCategoryFromFileName(file.name);
            if (category) {
                const imageUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO_NAME}/${BRANCH}/${file.name}`;
                images[category].push({
                    name: file.name,
                    url: imageUrl,
                    title: formatTitle(file.name)
                });
            }
        }
    });
    
    return images;
}

function isImageFile(fileName) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
}

function getCategoryFromFileName(fileName) {
    const name = fileName.toLowerCase();
    if (name.includes('bridal')) return 'bridal';
    if (name.includes('party')) return 'party';
    if (name.includes('arabic')) return 'arabic';
    if (name.includes('simple')) return 'simple';
    return null; // Skip files that don't match categories
}

function formatTitle(fileName) {
    // Convert "bridal_1.jpg" to "Bridal Design 1"
    const nameWithoutExt = fileName.replace(/\.[^/.]+$/, '');
    const parts = nameWithoutExt.split('_');
    const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
    const number = parts[1] || '1';
    return `${category} Design ${number}`;
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
            img.style.cssText = 'width: 100%; height: 100%; object-fit: cover; border-radius: 15px;';
            img.loading = 'lazy';
            
            img.onload = () => {
                console.log('Image loaded:', image.name);
            };
            
            img.onerror = () => {
                console.log('Failed to load:', image.name);
                galleryItem.style.display = 'none';
            };
            
            galleryItem.appendChild(img);
            galleryGrid.appendChild(galleryItem);
            totalImages++;
        });
    });
    
    if (totalImages === 0) {
        showGitHubSetupInstructions();
    } else {
        console.log(`Loaded ${totalImages} images from GitHub`);
    }
}

function parseCSV(csvText) {
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    return lines.slice(1).map(line => {
        const parts = line.split(',');
        const values = [
            parts[0]?.trim() || '',
            parts[1]?.trim() || '',
            parts.slice(2).join(',').trim() || ''
        ];
        
        return headers.reduce((obj, header, index) => {
            obj[header.trim()] = values[index] || '';
            return obj;
        }, {});
    }).filter(row => Object.values(row).some(val => val));
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

function loadFallbackPricing() {
    const fallback = {
        'Simple Mehndi': '₹300-500',
        'Party Mehndi': '₹800-1200',
        'Arabic Mehndi': '₹600-1000',
        'Bridal Mehndi': '₹2000-5000',
        'Kids Mehndi': '₹200-400'
    };
    
    Object.entries(fallback).forEach(([service, price]) => {
        const element = document.querySelector(`[data-service="${service}"]`);
        if (element) {
            const priceEl = element.querySelector('.price');
            if (priceEl) priceEl.textContent = price;
        }
    });
}

function showGitHubSetupInstructions() {
    const galleryGrid = document.querySelector('.gallery-grid');
    galleryGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 3rem; background: var(--bg-white); border-radius: 15px; box-shadow: var(--shadow);">
            <h3 style="color: var(--primary-color); margin-bottom: 1rem;">📁 Upload Images to GitHub</h3>
            <p style="color: var(--text-light); margin-bottom: 2rem;">
                Upload images to your GitHub repository with these naming patterns:
            </p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 2rem 0;">
                <div style="padding: 1.5rem; background: var(--bg-cream); border-radius: 10px;">
                    <strong>Bridal:</strong><br>
                    bridal_1.jpg<br>bridal_2.jpg<br>bridal_3.jpg...
                </div>
                <div style="padding: 1.5rem; background: var(--bg-cream); border-radius: 10px;">
                    <strong>Party:</strong><br>
                    party_1.jpg<br>party_2.jpg<br>party_3.jpg...
                </div>
                <div style="padding: 1.5rem; background: var(--bg-cream); border-radius: 10px;">
                    <strong>Arabic:</strong><br>
                    arabic_1.jpg<br>arabic_2.jpg<br>arabic_3.jpg...
                </div>
                <div style="padding: 1.5rem; background: var(--bg-cream); border-radius: 10px;">
                    <strong>Simple:</strong><br>
                    simple_1.jpg<br>simple_2.jpg<br>simple_3.jpg...
                </div>
            </div>
            
            <div style="background: var(--gradient); color: white; padding: 2rem; border-radius: 10px; margin: 2rem 0;">
                <h4 style="margin-bottom: 1rem;">🎯 Benefits:</h4>
                <ul style="text-align: left; line-height: 1.8;">
                    <li>✅ No URLs needed in sheets</li>
                    <li>✅ Just upload images to GitHub</li>
                    <li>✅ Website finds them automatically</li>
                    <li>✅ Zero configuration needed</li>
                </ul>
            </div>
            
            <p style="color: var(--text-light); font-size: 0.9rem;">
                Repository: <strong>github.com/${CONFIG.GITHUB_REPO.USERNAME}/${CONFIG.GITHUB_REPO.REPO_NAME}</strong>
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

// Auto-refresh every 5 minutes
setInterval(() => {
    if (window.location.pathname.includes('pricing.html')) {
        loadPricingData();
    }
    if (window.location.pathname.includes('gallery.html')) {
        loadGalleryImages();
    }
}, 300000);