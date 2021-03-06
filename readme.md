# 21 days habit

If you want the 21-day habit formation guide to work, you have to recognize that forming a new habit is no easy undertaking. It won’t get formed on its own. And for that reason, you have to decide why and how important is that habit to you.
For that reason, we bring you 21 days habit, the tool to make it easier this journey of creating a habit. Motivating others and yourself to commit, by putting money on the line.

Hope you enjoy, and archive your goals!

## Project Layout

There are three top-level folders:

1. `/app` - contains the front-end application (On build)
2. `/contracts` - contains the solidity contract
3. `/tests` - contains tests for the solidity contract

## Setup

There are a few steps to get setup here:

 - Install [install Node.js](https://nodejs.org/en/)
 - Download this repository locally
 - Open the command line and navigate to your local copy of this repository
 - Run `npm install` to download all the dependencies

## Contracts

You can use hardhat commands to test and compile the contracts, among other things.

To learn more about these commands run `npx hardhat help`.

## Front-End (On Build)

To run the front-end application:

1. Compile the contracts with `npx hardhat compile` (this will make the artifacts accessible to `/app`)
2. Move into the `app` folder and run `parcel index.html`

You can learn more about Parcel [here](https://parceljs.org/).

## Tests

The tests are setup to point at already deployed to the need contracts. We'll need to fork mainnet to do this in our test blockchain.

### Forking Mainnet

In order to fork mainnet, we'll be pointing this repository at an [Alchemy API](https://alchemyapi.io/) endpoint. To do this, you'll need to sign up for Alchemy, create a mainnet project and get your HTTP endpoint.

Once you've done this we'll use [dotenv](https://www.npmjs.com/package/dotenv) to store the endpoint in a local `.env` file that won't accidentally get committed! Since this package is already in your dependencies all you'll need to do is create a new `.env` file at the top level of the repository and add the following entry into it:

```
FORKING_URL=https://eth-mainnet.alchemyapi.io/v2/<YOUR_API_KEY>
```

Replacing `<YOUR_API_KEY>` with the API key from Alchemy.

### Running Tests

The `hardhat.config.js` is already set up to fork mainnet at a recent block.

All we'll need to do to run the tests is run `npx hardhat test`.
