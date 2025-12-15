// Website Configuration - NETLIFY OPTIMIZED

const CONFIG = {
    // Google Sheets - Use JSONP compatible URL
    GOOGLE_SHEETS: {
        SHEET_ID: '1lMES8jWfpUPoJNVL1O3QqzdpCSQMtfAbDq-r-xsNTJc',
        // Use published web URL for CORS-free access
        JSONP_URL: 'https://docs.google.com/spreadsheets/d/1lMES8jWfpUPoJNVL1O3QqzdpCSQMtfAbDq-r-xsNTJc/gviz/tq?tqx=out:json&sheet=Sheet1'
    },
    
    // GitHub Repository - Use direct raw URLs
    GITHUB_REPO: {
        USERNAME: 'nishamehndidesigner',
        REPO_NAME: 'gallery',
        BRANCH: 'main',
        // Use raw.githubusercontent.com for direct image access
        RAW_BASE_URL: 'https://raw.githubusercontent.com/nishamehndidesigner/gallery/main/',
        // Use GitHub API with proper headers
        API_BASE_URL: 'https://api.github.com/repos/nishamehndidesigner/gallery/contents'
    },
    
    // Contact Information
    CONTACT: {
        PHONE: '+918489305238',
        WHATSAPP_MESSAGE: 'Hi! I would like to book a mehndi appointment.'
    }
};