# Whatadeal.uk

A public affiliate storefront with a private, password-protected CSV admin area. Run it through the Node server; opening `index.html` directly will not load the product API.

## Run locally

1. Install Node.js 20 or newer.
2. Run `npm install`.
3. Copy `.env.example` to `.env`. Set a unique admin username and long password, and set `SESSION_SECRET` to a random value of at least 32 characters. Keep `.env` private; it is ignored by Git.
4. Run `npm start` and open `http://127.0.0.1:3000` for the shop or `http://127.0.0.1:3000/admin` to manage the feed.

## Manage the feed

Sign in at `/admin` and upload a CSV. Use `products-template.csv` for a blank header row or `products-example.csv` to see the fields filled in. Replace all example values before uploading; its non-numeric price placeholder prevents it from being published unchanged. Required columns are `name` (or `title`) and `price`; optional columns are `category`, `retailer`, `wasPrice`, `image`, `affiliateUrl`, and `asin`. Common Amazon headers such as `item-name`, `item-price`, `item-image`, and `item-url` are also recognized.

When Supabase is configured, the original CSV is stored as `products.csv` in the private Storage bucket named by `SUPABASE_FEED_BUCKET` (default: `private-feeds`). Without Supabase, local development stores it under `FEED_DIR` (default: `private-data/`). Customers can see published product details and links, but cannot access the admin API or raw feed. The public API returns only the fields needed to render products. Keep feed backups and server access private too.

Product buttons use the CSV `affiliateUrl` when supplied. Amazon UK links receive `AMAZON_ASSOCIATE_TAG`; otherwise, a valid 10-character ASIN creates a tagged Amazon product link. If neither is supplied, the button links to a tagged Amazon search. Only use affiliate links authorized for your account.

## Deploy to Vercel with Supabase

1. In Supabase, create a **private** Storage bucket named `private-feeds`. Do not enable public access.
2. Push this repository to GitHub and import it in Vercel with the repository root as the project root. `vercel.json` routes the storefront, admin, and API through the Express function.
3. In Vercel Project Settings → Environment Variables, set `ADMIN_USER`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `AMAZON_ASSOCIATE_TAG`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, and `SUPABASE_FEED_BUCKET=private-feeds` for Production. Redeploy after adding them.
4. Open `https://your-domain/admin` to upload `products-template.csv` or your own feed. The source CSV stays in the private Supabase bucket; only sanitized product details are returned to the storefront.

Get the Supabase URL and service-role key from your Supabase project settings. Keep the service-role key server-side: never use a `NEXT_PUBLIC_` prefix, put it in browser code, or commit it to Git. The service-role key bypasses Storage access policies, so restrict it to Vercel environment variables and rotate it if exposed. Vercel deployments must use Supabase; local development can use either Supabase or the private local `FEED_DIR`.

The admin credentials/session secret previously entered in `.env.example` were exposed in the repository history. Rotate them before using this deployment; editing the example file does not invalidate previously exposed credentials.

Keep prices and availability accurate, and keep the affiliate disclosure prominent. Follow Amazon Associates terms and applicable UK advertising rules. A tracking ID alone does not enroll or approve an account.