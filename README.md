# osm-change-generator-server

----------------------------------

![badge-alerts-lgtm](https://img.shields.io/lgtm/alerts/github/MapColonies/osm-change-generator-server?style=for-the-badge)

![grade-badge-lgtm](https://img.shields.io/lgtm/grade/javascript/github/MapColonies/osm-change-generator-server?style=for-the-badge)

![snyk](https://img.shields.io/snyk/vulnerabilities/github/MapColonies/osm-change-generator-server?style=for-the-badge)

----------------------------------
A restful API for generating an osm-change from geojson and osm entity using the [osm-change-generator
](https://github.com/MapColonies/osm-change-generator).

## API 
Checkout the OpenAPI spec [here](/openapi3.yaml)

## Installation

Install deps with npm

```bash
npm install
```

## Run Locally

Clone the project

```bash

git clone https://github.com/MapColonies/osm-change-generator-server.git

```

Go to the project directory

```bash

cd osm-change-generator-server

```

Install dependencies

```bash

npm install

```

Start the server

```bash

npm run start

```

## Running Tests

To run tests, run the following command

```bash

npm run test

```

To only run unit tests:
```bash
npm run test:unit
```

To only run integration tests:
```bash
npm run test:integration
```
