<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/d08ba958-07e8-4855-8485-fece49ce886f

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set API keys in [.env.local](.env.local):
   - `VISUALSEARCH_API_KEY=...`
   - `SHOPPINGMUSE_API_KEY=...`
3. Run the app:
   `npm run dev`

## Vercel Environment Variables

Add the same variables in your Vercel project settings:

- `VISUALSEARCH_API_KEY`
- `SHOPPINGMUSE_API_KEY`
