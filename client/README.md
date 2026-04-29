# Document-based app

This is a code bundle for Document-based app. The original project is available at https://www.figma.com/design/WOMwaJmXhRW9C4v3dXMxb2/Document-based-app.

## Running the code

Run `npm i` to install the dependencies.

Run `npm run dev` to start the development server.

## Mock API data and fallback

The app now stores mock datasets as JSON files under `src/mockapi/`.

- `src/mockapi/fallbackVisits.json`
- `src/mockapi/postVisitCustomers.json`
- `src/mockapi/visitRequests.json`

Visits are API-first. Fallback visits are only used when the API returns no visits and the flag below is enabled.

- `VITE_ENABLE_EMPTY_API_FALLBACK=true`

Add the flag to `.env` or `.env.local` when you want empty API responses to use `src/mockapi/fallbackVisits.json`.
