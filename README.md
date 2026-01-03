<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/12qcPm6CVVuHVNB1kqP9ncA-tGdlnlsjm

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Linting & formatting

This repo uses ESLint **flat config** (ESLint v9+): `eslint.config.js`.
The older `.eslintrc*` format is deprecated upstream, so new configuration should go into the flat config file.

- Lint: `npm run lint`
- Auto-fix: `npm run lint:fix`
- Format: `npm run format`
- Check formatting: `npm run format:check`
