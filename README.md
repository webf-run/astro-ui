# @webf/astro-ui

Reusable UI components for Astro.

## Installation

Install the package using npm:

npm install @webf/astro-ui

## Usage

```astro
---
import '@webf/astro-ui/style.css';
import { Link, SectionBadge } from '@webf/astro-ui';
---

<Link> Apply Now </Link>

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
lib/
├── blocks/
│ ├── Link.astro
│ ├── CompanyLogoCard.astro
│ ├── FeatureCard.astro
│ ├── Navbar.astro
│ ├── PlacementStatCard.astro
│ ├── SectionBadge.astro
│ └── StatCard.astro
├── styles/
│ ├── index.css
│ └── tokens.css
└── index.ts
