const grid = document.getElementById('product-grid');
const categoryList = document.getElementById('category-list');
const resultCount = document.getElementById('result-count');
const sortSelect = document.getElementById('sort-select');
const searchInput = document.getElementById('search-input');
const searchForm = document.getElementById('search-form');
const storeStatus = document.getElementById('store-status');

const state = {
  products: [],
  activeCategory: 'all',
  searchTerm: '',
  sort: 'featured'
};

function formatPrice(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '£0.00';
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(numeric);
}

function getVisibleProducts() {
  let filtered = [...state.products];

  if (state.activeCategory !== 'all') {
    filtered = filtered.filter((product) => (product.category || '').toLowerCase() === state.activeCategory.toLowerCase());
  }

  if (state.searchTerm) {
    const query = state.searchTerm.toLowerCase();
    filtered = filtered.filter((product) => {
      const haystack = [product.name, product.category, product.retailer].join(' ').toLowerCase();
      return haystack.includes(query);
    });
  }

  const sorted = [...filtered];
  switch (state.sort) {
    case 'price-low':
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
      break;
    case 'price-high':
      sorted.sort((a, b) => Number(b.price) - Number(a.price));
      break;
    case 'discount':
      sorted.sort((a, b) => {
        const aDiscount = Number(a.wasPrice || 0) - Number(a.price || 0);
        const bDiscount = Number(b.wasPrice || 0) - Number(b.price || 0);
        return bDiscount - aDiscount;
      });
      break;
    default:
      sorted.sort((a, b) => Number(a.price) - Number(b.price));
      break;
  }

  return sorted;
}

function renderCategories() {
  const categories = ['all', ...new Set(state.products.map((product) => (product.category || 'General').trim()).filter(Boolean))];
  categoryList.innerHTML = categories.map((category) => {
    const label = category === 'all' ? 'All deals' : category;
    const isActive = state.activeCategory === category;
    return `<button type="button" class="category-button" data-category="${category}" aria-pressed="${isActive}">${label}</button>`;
  }).join('');

  categoryList.querySelectorAll('.category-button').forEach((button) => {
    button.addEventListener('click', () => {
      state.activeCategory = button.dataset.category;
      render();
    });
  });
}

function renderProducts() {
  const products = getVisibleProducts();

  if (!products.length) {
    resultCount.textContent = 'No matching deals yet.';
    grid.innerHTML = `
      <div class="empty-state">
        <h3>No deals found</h3>
        <p>Try another search or choose a different category.</p>
      </div>
    `;
    return;
  }

  resultCount.textContent = `${products.length} deal${products.length === 1 ? '' : 's'} available`;
  grid.innerHTML = products.map((product, index) => {
    const image = product.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1200&q=80';
    const wasPrice = product.wasPrice && Number(product.wasPrice) > Number(product.price) ? `<span class="price-was">${formatPrice(product.wasPrice)}</span>` : '';
    const retailer = product.retailer || 'Retailer';
    const title = product.name || product.title || 'Product';
    const href = product.affiliateUrl || '#';
    return `
      <article class="product-card" style="animation-delay:${index * 40}ms">
        <div class="product-image-wrap">
          <img class="product-image" src="${image}" alt="${title}" loading="lazy">
          <span class="sample-tag">${retailer}</span>
        </div>
        <div class="product-content">
          <div class="product-meta">
            <span class="product-category">${product.category || 'Featured'}</span>
            <span>${retailer}</span>
          </div>
          <h3>${title}</h3>
          <div class="price-row">
            <span class="price-current">${formatPrice(product.price)}</span>
            ${wasPrice}
          </div>
          <a class="shop-button" href="${href}" target="_blank" rel="noreferrer sponsored noopener">Shop now</a>
        </div>
      </article>
    `;
  }).join('');
}

function render() {
  renderCategories();
  renderProducts();
}

async function loadProducts() {
  try {
    storeStatus.textContent = 'Loading deals...';
    const response = await fetch('/api/products');
    if (!response.ok) {
      throw new Error('Unable to load deals');
    }

    const payload = await response.json();
    state.products = payload.products || [];
    render();
    storeStatus.textContent = state.products.length ? `Showing ${state.products.length} deals.` : 'No deals available yet.';
  } catch (error) {
    console.error(error);
    storeStatus.textContent = 'We could not load the products feed right now.';
    grid.innerHTML = `
      <div class="empty-state">
        <h3>Feed unavailable</h3>
        <p>Please check the local server and try again.</p>
      </div>
    `;
  }
}

sortSelect.addEventListener('change', (event) => {
  state.sort = event.target.value;
  renderProducts();
});

searchForm.addEventListener('submit', (event) => {
  event.preventDefault();
  state.searchTerm = searchInput.value.trim();
  renderProducts();
});

searchInput.addEventListener('input', (event) => {
  state.searchTerm = event.target.value.trim();
  renderProducts();
});

loadProducts();
