const localDealsCacheStore = [
    {
        "title": "Sony WH-1000XM4 Wireless Noise Cancelling Headphones - Black",
        "price": 179.00,
        "platform": "Amazon UK",
        "url": "https://amazon.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "Nintendo Switch OLED Model - Neon Blue & Neon Red",
        "price": 249.99,
        "platform": "Argos",
        "url": "https://argos.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "Apple iPad 10.2-inch (Wi-Fi, 64GB) - Space Grey",
        "price": 299.00,
        "platform": "Currys",
        "url": "https://currys.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "ASUS Vivobook 15.6 Inch Core i5 8GB 512GB Laptop",
        "price": 389.99,
        "platform": "eBay UK",
        "url": "https://ebay.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "Samsung 55 Inch 4K Ultra HD Smart TV",
        "price": 349.00,
        "platform": "Amazon UK",
        "url": "https://amazon.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "Ninja Foodi Dual Zone Digital Air Fryer 7.6L",
        "price": 149.00,
        "platform": "Argos",
        "url": "https://argos.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "Logitech G502 HERO High Performance Gaming Mouse",
        "price": 34.99,
        "platform": "Currys",
        "url": "https://currys.co.uk",
        "image_url": "https://unsplash.com"
    },
    {
        "title": "Dyson V8 Cordless Vacuum Cleaner - Silver/Nickel",
        "price": 229.00,
        "platform": "eBay UK",
        "url": "https://ebay.co.uk",
        "image_url": "https://unsplash.com"
    }
];

function renderDealCards(dealsArray) {
    const grid = document.getElementById('productGrid');
    grid.innerHTML = '';
    
    if(dealsArray.length === 0) {
        grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:50px 0; color:#565959; font-weight:600;">No matching retail promotions found. Try another search!</div>`;
        return;
    }
    
    dealsArray.forEach(deal => {
        const title = deal.title || 'Hot Shopping Deal';
        const price = parseFloat(deal.price || 0).toFixed(2);
        const platform = deal.platform || 'Store';
        const url = deal.url || '#';
        const image = deal.image_url || 'https://unsplash.com';
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="image-wrapper">
                <img src="${image}" alt="${title}" class="product-img" loading="lazy">
            </div>
            <span class="platform-badge">${platform}</span>
            <h2 class="product-title">${title}</h2>
            <div class="product-price-row">
                <span class="current-price">£${price}</span>
                <span class="price-subtext">(Best Price)</span>
            </div>
            <a href="${url}" target="_blank" rel="nofollow noopener noreferrer" class="buy-btn">View Retailer Deal</a>
        `;
        grid.appendChild(card);
    });
}

function filterDealListings() {
    const searchTerms = document.getElementById('dealSearchInput').value.toLowerCase().trim();
    const filteredArray = localDealsCacheStore.filter(deal => {
        return deal.title.toLowerCase().includes(searchTerms) || deal.platform.toLowerCase().includes(searchTerms);
    });
    renderDealCards(filteredArray);
}

window.onload = function() {
    renderDealCards(localDealsCacheStore);
};
