# Local Fonts (No CDN)

This project expects the **IranSans** font to be served locally from:

`frontend/public/fonts/`

## Required file(s)

`IranSans.woff2`

## Notes

1. If you use different filenames (or multiple weights), update `frontend/src/app/globals.css` `@font-face` `src:` URLs accordingly.
2. If the font files are missing, the app will fall back to `Tahoma` (see `font-family` in `globals.css`).

