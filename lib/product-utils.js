function cleanText(value) {
  return String(value ?? '').trim();
}

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const cleaned = String(value).replace(/[£€,$]/g, '').replace(/,/g, '').trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function slugify(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60) || 'product';
}

function isAmazonUrl(value) {
  if (!value) return false;
  const normalized = value.toLowerCase();
  return normalized.includes('amazon.') || normalized.includes('amzn.to');
}

function addAffiliateQuery(url, tag) {
  if (!tag) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.set('tag', tag);
    return parsed.toString();
  } catch (error) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}tag=${encodeURIComponent(tag)}`;
  }
}

function buildAmazonSearchUrl(term, tag) {
  const query = encodeURIComponent(cleanText(term));
  const base = `https://www.amazon.co.uk/s?k=${query}`;
  return tag ? addAffiliateQuery(base, tag) : base;
}

function buildAmazonProductUrl(asin, tag) {
  if (!asin) return '';
  const base = `https://www.amazon.co.uk/dp/${asin}`;
  return tag ? addAffiliateQuery(base, tag) : base;
}

function normalizeProductRow(rawRow, index, associateTag = process.env.AMAZON_ASSOCIATE_TAG || 'whatadealuk20-21') {
  const name = cleanText(rawRow.name || rawRow.title || rawRow['item-name'] || rawRow['item name'] || `Product ${index + 1}`);
  const category = cleanText(rawRow.category || rawRow['item-category'] || rawRow['product-category']);
  const retailer = cleanText(rawRow.retailer || rawRow.brand || rawRow['item-retailer'] || 'General');
  const image = cleanText(rawRow.image || rawRow['item-image'] || rawRow['image-url'] || rawRow.thumbnail || '');
  const rawAffiliateUrl = cleanText(rawRow.affiliateUrl || rawRow['affiliate-url'] || rawRow['item-url'] || rawRow.url || rawRow.link || '');
  const asin = cleanText(rawRow.asin || rawRow['ASIN'] || rawRow['item-asin'] || '');
  const price = toNumber(rawRow.price || rawRow['item-price'] || rawRow['sale-price'] || rawRow['price']);
  const wasPrice = toNumber(rawRow.wasPrice || rawRow['was-price'] || rawRow['previous-price'] || rawRow['rrp'] || rawRow['list-price']);

  let affiliateUrl = rawAffiliateUrl;
  if (affiliateUrl && isAmazonUrl(affiliateUrl)) {
    affiliateUrl = addAffiliateQuery(affiliateUrl, associateTag);
  } else if (!affiliateUrl && asin) {
    affiliateUrl = buildAmazonProductUrl(asin, associateTag);
  } else if (!affiliateUrl) {
    affiliateUrl = buildAmazonSearchUrl(name, associateTag);
  }

  return {
    id: cleanText(rawRow.id || rawRow.slug || `${slugify(name)}-${index + 1}`),
    name,
    title: name,
    category,
    retailer,
    price: price ?? 0,
    wasPrice: wasPrice ?? null,
    image,
    affiliateUrl,
    asin,
    source: 'csv'
  };
}

module.exports = {
  cleanText,
  toNumber,
  normalizeProductRow,
  buildAmazonSearchUrl,
  buildAmazonProductUrl
};
