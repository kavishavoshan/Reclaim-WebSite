# Research Website (Static)

This folder contains a lightweight, static research project website for an **AI-powered Lost & Found** system.

## Requirements met

- **Static only**: HTML + CSS + JavaScript (no React, no external frameworks)
- **Lightweight**: no external fonts/CDNs; images are SVG; suitable for a **20 MB upload limit**
- **Research components included**:
  1. Uncertainty-Aware Multimodal Item Retrieval
  2. Multimodal Input Validation and Fraud Detection
  3. Device Behavior Anomaly Detection and Lost Item Risk Prediction
  4. Suspicious Behavior Detection Using Video Analytics

## Folder structure

```
research-website/
  index.html
  README.md
  assets/
    css/
      style.css
    js/
      main.js
    images/
      logo.svg
      hero-illustration.svg
    documents/
      .gitkeep
    slides/
      .gitkeep
```

## How to use

- Open `index.html` directly in a browser, or host the `research-website/` folder on any static host.
- Customize content directly in `index.html`.
- Styling is in `assets/css/style.css`.
- Interactions (theme toggle, mobile nav, active section highlighting, accordions) are in `assets/js/main.js`.

## Adding documents and slides

- Put PDFs in `assets/documents/` (e.g., `paper.pdf`, `poster.pdf`).
- Put slide decks in `assets/slides/` (e.g., `talk.pdf`, `demo.pptx`).
- Then update the links in the **Resources** section of `index.html` to point to specific files.

## Keeping uploads small

- Prefer **SVG** or **WebP** for images.
- Avoid large embedded videos; link to externally hosted videos instead.
- Compress PDFs before uploading.

