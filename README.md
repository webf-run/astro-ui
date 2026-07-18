# @webf/astro-ui

Reusable UI components for Astro.

## Installation

Install the package using npm:

npm install @webf/astro-ui

## Usage

```astro
---
import '@webf/astro-ui/style.css';
import { Button, SectionBadge } from '@webf/astro-ui';
---

<Button> Apply Now </Button>

<SectionBadge> Featured </SectionBadge>
```

## Components

- Button
- Navbar
- FeatureCard
- StatCard
- CompanyLogoCard
- PlacementStatCard
- SectionBadge

## Development

Clone the repository:
git clone https://github.com/webf-run/astro-ui.git

install dependencies:

npm install

Run the build:

npm run build

## Project Structure

dist/
└── style.css
|
src/
├── components/
│ ├── Button.astro
│ ├── CompanyLogoCard.astro
│ ├── FeatureCard.astro
│ ├── Navbar.astro
│ ├── PlacementStatCard.astro
│ ├── SectionBadge.astro
│ └── StatCard.astro
├── styles/
│ └── index.css
└── index.ts
