# Netlify Deployment Setup Guide

## Google Sheets Setup

### 1. Make Sheet Public
1. Open your Google Sheet: https://docs.google.com/spreadsheets/d/1lMES8jWfpUPoJNVL1O3QqzdpCSQMtfAbDq-r-xsNTJc/edit
2. Click "Share" button (top right)
3. Click "Change to anyone with the link"
4. Set permission to "Viewer"
5. Click "Done"

### 2. Sheet Structure
Your sheet should have these columns in row 1:
- Column A: Service (e.g., "Simple Mehndi", "Party Mehndi")
- Column B: Min Price (e.g., 300, 800)
- Column C: Max Price (e.g., 500, 1200)

### 3. Test the JSONP URL
Visit this URL to test: https://docs.google.com/spreadsheets/d/1lMES8jWfpUPoJNVL1O3QqzdpCSQMtfAbDq-r-xsNTJc/gviz/tq?tqx=out:json&sheet=Sheet1

## GitHub Repository Setup

### 1. Repository Structure
Your GitHub repository should be:
- **Public** (very important!)
- Repository: `nishamehndidesigner/gallery`
- Branch: `main`

### 2. Image Naming Convention
Images should be named with category prefix:
```
bridal_1.jpg
bridal_2.jpg
party_1.jpg
party_2.jpg
arabic_1.jpg
arabic_2.jpg
simple_1.jpg
simple_2.jpg
```

### 3. Supported Image Formats
- .jpg, .jpeg, .png, .gif, .webp

### 4. Test GitHub API
Visit: https://api.github.com/repos/nishamehndidesigner/gallery/contents

## Netlify Deployment

### 1. Build Settings
- Build command: (leave empty)
- Publish directory: `.` (current directory)

### 2. Environment Variables (Optional)
You can set these in Netlify dashboard > Site settings > Environment variables:
- `GITHUB_USERNAME`: nishamehndidesigner
- `GITHUB_REPO`: gallery

### 3. Custom Headers
The `netlify.toml` file is already configured with proper CORS headers.

## Troubleshooting

### Google Sheets Not Loading
1. Ensure sheet is public
2. Check browser console for JSONP errors
3. Verify sheet ID in config.js

### GitHub Images Not Loading
1. Ensure repository is public
2. Check image naming convention
3. Verify repository exists: github.com/nishamehndidesigner/gallery
4. Check browser console for API rate limit errors

### CORS Issues
1. The site uses JSONP for Google Sheets (no CORS issues)
2. GitHub raw images don't have CORS restrictions
3. GitHub API calls use proper headers

## Testing Locally vs Netlify

### Local Testing
- Both GitHub API and Google Sheets should work
- No CORS issues in local development

### Netlify Production
- JSONP bypasses CORS for Google Sheets
- GitHub API works with proper headers
- Raw image URLs work without restrictions

## Performance Optimization

### Image Loading
- Images load lazily
- Critical images are preloaded
- Fallback placeholders for failed images

### API Calls
- Retry mechanism for GitHub API
- Rate limit handling
- Error boundaries with user-friendly messages