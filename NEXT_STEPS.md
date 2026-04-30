# Navkar Auction - Pre-Launch Checklist

✅ **Initial Setup Completed**:
- Environment variables configured in Vercel.
- Supabase Database setup (tables, functions, security rules).
- Realtime replication enabled on the items table.

Now that the backend is fully connected and ready, follow these final steps to launch your auction.

## 1. Import the Auction Items

You need to populate the live website with the items from your inventory.

1. Go to your live Vercel website URL.
2. Log in using the phone number or email you set as `ADMIN_PHONE` or `ADMIN_EMAIL` in Vercel.
3. Once logged in, navigate to the **Admin Dashboard** (click "Admin" in the navbar).
4. Click the **📥 Import Items** button in the top right.
5. Upload the `items_to_import.csv` file located in your project root.
6. Verify the imported items are correct. The `name` column is the product name, and `category` is the company/brand name.
*(Note: If you need to change the default starting price of ₹1,000, you can edit the CSV file on your computer before uploading, or delete and re-add specific items via the Admin dashboard).*

## 2. Configure & Launch the Auction

By default, the auction is in a "Paused/Not live" state to prevent early bidding.

1. On the Admin Dashboard, go to the **Settings** tab.
2. Under "Auction End Date/Time", select the exact date and time the auction should automatically close.
3. Click **Set Time**.
4. When you are ready for people to start bidding, click the **Go Live** button. 

> [!NOTE]
> Once you click "Go Live", logged-in users will immediately be able to place bids. You can pause the auction at any time by clicking "Pause Auction".

## 3. Perform a Live Test

Before announcing the auction to your users, it is highly recommended to perform a test:

- Open your site on your phone or in an incognito window.
- Log in as a regular user (not the admin).
- Place a test bid on an item.
- Check the Admin Dashboard (**Bids** tab) to ensure the bid was logged correctly with the user's real phone number and shop details.
- Check the public catalog to verify the item shows the new top bid (using an anonymous handle like "Bidder #1").

## 4. Monitor & Close the Auction

While the auction is live:
- Keep an eye on the **Bids** tab in the Admin Dashboard to see incoming bids in real-time.
- The auction will automatically stop accepting bids when the "Auction End Date/Time" is reached.
- If you need to forcefully close the auction early, you can use the **Close Auction (Final)** button in the Danger Zone of the Settings tab.
- Once closed, go to the **Winners** tab to export a CSV of all winning bids and contact information.
