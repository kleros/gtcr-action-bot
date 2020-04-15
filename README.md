<p align="center">
  <b style="font-size: 32px;">GeneralizedTCR Action Bot</b>
</p>

<p align="center">
  <a href="https://standardjs.com"><img src="https://img.shields.io/badge/code_style-standard-brightgreen.svg" alt="JavaScript Style Guide"></a>
  <a href="https://conventionalcommits.org"><img src="https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg" alt="Conventional Commits"></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen Friendly"></a>
</p>

This bot watches a GTCR Factory contract and all GTCR contracts spawned from it. It is a convenience tool and does primarily two things:
- Detects submissions that passed the challenge period and executes them for the user.
- Detects pending crowdfunding rewards that were not withdrawn, and withdraws them for the user.

## Prerequisites

- Tested on NodeJS version 11

## Get Started

1.  Clone this repo.
2.  Duplicate `.env.example`, rename it to `.env` and fill in the environment variables.
3.  Run `yarn` to install dependencies and then `yarn start` to run the service in development mode.

> To run the service in production mode use `yarn production`.

> To start with PM2 use `pm2 start yarn --name gtcr-action-bot -- production`

## Other Scripts

- `yarn format` - Lint, fix and prettify all the project.
.js files with styled components and .js files.
- `yarn run cz` - Run commitizen.

## Contributing

See CONTRIBUTING.md.