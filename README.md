# Santa In High Def

Static website in `dist/`, deployed from GitHub main to Vercel. `/api/booking` is a server-side endpoint for Google Sheets submissions.

## Current status

Production is connected to the Google Sheets backend through an authorized Apps Script web app. Vercel production environment variables are configured. Online requests save to the Bookings tab and send private approval and Santa notifications. No approval-routing addresses appear in frontend code.

## One-time Google setup

1. Open your Santa booking spreadsheet in Google Drive.
2. Select **Extensions > Apps Script**. Replace Code.gs with the contents of `backend/Code.gs` from this repository. Save.
3. Select `setupBookingBackend` and click **Run**. Approve Google's requested permissions for spreadsheet access and sending email. Return to the spreadsheet to view the private setup value.
4. Add the displayed value directly to Vercel **Settings > Environment Variables** as `BOOKING_SHARED_SECRET`, with Production selected and secret/sensitive storage. Do not paste the value into chat, GitHub, or the sheet.
5. In Apps Script choose **Deploy > New deployment > Web app**. Set **Execute as: Me** and **Who has access: Anyone**, then click **Deploy**. The script rejects submissions without the private server secret. Copy the Web app URL ending in `/exec`.
6. Add the URL to Vercel as `GOOGLE_APPS_SCRIPT_URL`, Production only, then redeploy the latest production deployment. The URL is safe to share with your coding assistant; the secret is not.

## Connection checks

After setup, `GET /api/booking` returns `{"ready":true}` only when Google accepts the server's secret and the Bookings tab is available. The page then switches to secure online submission automatically. Each request gets a UUID; retries reuse it to prevent duplicate rows. Entries start as `New`, not confirmed bookings.

Private approval email goes to the Settings tab Approval email value. Santa receives the notification copy from the Settings tab Santa notification email value. Mail failures appear as `Failed` in the sheet. Retrying the same saved request retries failed notifications. Saving a request does not depend on email success.

Requesters see confirmation on the website, without internal email recipients. Changing a row to Approved does not send a customer email automatically; send confirmations directly after approving arrangements.

## Verification

A clearly labeled live connection test succeeded: the website displayed its request reference, the row saved to Google Sheets, and the notification status recorded Sent. The test was marked Cancelled with a note that no visit is scheduled. Keep customer data and backend credentials out of public GitHub files.
