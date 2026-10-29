from supabase import create_client

# 🔑 Verified Database Credentials for zbmuicfcvpotdxhabcum
SUPABASE_URL = "https://supabase.co" 
SUPABASE_KEY = "sb_secret_rzkhQ"

# Initialize the Supabase Client
supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def generate_premium_retail_deals():
    deals_inventory = [
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
        }
    ]
    return deals_inventory

def upload_to_supabase(deals):
    print(f"Attempting to upload data to table layout...")
    success_count = 0
    
    for deal in deals:
        try:
            # FIXED: Explicitly catch and print any detailed response details or structural exceptions
            response = supabase.table('deals').insert(deal).execute()
            
            # Check if data was returned in response payload
            if hasattr(response, 'data') and response.data:
                success_count += 1
                print(f" -> Successfully Added: {deal['title']}")
            else:
                print(f" ❌ Server responded empty payload for: {deal['title']}")
                print(f" Raw response dump: {response}")
        except Exception as err:
            print(f" ❌ Database Error Crash on '{deal['title']}':\n {err}\n")
            
    print(f"\nDatabase sync complete! Successfully added {success_count} deals.")

if __name__ == "__main__":
    live_deals = generate_premium_retail_deals()
    upload_to_supabase(live_deals)
