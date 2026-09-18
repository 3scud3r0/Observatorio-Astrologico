# Third-party notices

## Swiss Ephemeris

This project uses the Swiss Ephemeris calculation engine in WebAssembly form.
Swiss Ephemeris is distributed by its authors under a dual licensing model:
GNU Affero General Public License (AGPL) or the Swiss Ephemeris Professional License.
This public repository is prepared for the AGPL option.

Upstream source: https://github.com/aloistr/swisseph
Documentation/licensing: https://www.astro.com/swisseph/

The deployment workflow downloads the standard ephemeris files `sepl_18.se1`,
`semo_18.se1`, and `seas_18.se1` from the official upstream repository at a pinned commit.

## @swisseph/browser

Browser/WebAssembly wrapper: `@swisseph/browser` 1.3.1, AGPL-3.0.
Repository: https://github.com/swisseph-js/swisseph

## Celestine-derived fallback house mathematics

Some fallback house-system mathematics in `index.html` was adapted from Celestine 0.2.1,
MIT License, Copyright (c) 2025 Anonyfox. This code remains only as a contingency when the
Swiss/WASM files cannot initialize.
Repository: https://github.com/Anonyfox/celestine

## Profecias o Ápice em 2036

The educational layer references and paraphrases documented astrological methodology from
José Alencastro's public blog. Links are provided in the application. These references are
used for study and method comparison; the application does not claim that symbolic or
predictive interpretations are scientifically validated.