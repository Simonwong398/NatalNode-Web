# NatalNode Web

NatalNode Web is the independent website repository for NatalNode.com. This initial baseline contains only the Astro + React + TypeScript application shell needed to begin website development.

## Local development

```text
npm install
npm run dev
```

## Build

```text
npm run build
```

## Architecture boundary

The website boundary is:

```text
NatalNode.com → Website API / BFF → NatalNode Engine Public API → AstronomyProvider
```

Astronomy and scientific chart calculations belong to the NatalNode Engine. The website repository must not implement those calculations, embed astronomy data or algorithms, or access a provider directly. Provider-specific implementation is forbidden in this repository; future website features must depend on the NatalNode Engine public API instead.
