<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/2f67fe1b-b294-4ee6-bd45-36b7ab1e2389

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Blog Country Analytics

- Blog visits are counted on the server using the request IP. No GPS or browser geolocation permission is required.
- Public navigation across the SPA is tracked through `POST /api/posts/site/view`, so route changes inside the app are counted too.
- Site-wide country summary is available through `GET /api/posts/site/countries` and requires an authenticated `admin` or `editor` token.
- The total blog visit counter remains available through `GET /api/posts/blog/view`.
- Country summary is available through `GET /api/posts/blog/countries` and requires an authenticated `admin` or `editor` token.
- GeoIP lookup uses `https://ipwho.is/{ip}` by default. You can override the provider with the `GEOIP_LOOKUP_URL` environment variable. Use `{ip}` in the URL template where the IP should be inserted.
