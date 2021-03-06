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

We recommend using [volta](https://volta.sh/)

- Tested on NodeJS version 14.

## Get Started

1.  Clone this repo.
2.  Duplicate `.env.example`, rename it to `.env` and fill in the environment variables.
3.  Run `yarn` to install dependencies and then `yarn start` to run the service

## Production

1. Create a `.env` file with the name of the network you wish to use. Example `.env.xdai`.
2. Look into `package.json` for the appropriate script (e.g. start:xdai). Create one if it does not yet exist.
3. Use PM2 like so: `pm2 start yarn --interpreter bash --name gtcr-action-bot-<network> -- start:<network>`, replacing `network` with the network name.

Example for xDai:
`pm2 start yarn --interpreter bash --name gab-xdai -- start:xdai`

## Contributing

See CONTRIBUTING.md.
