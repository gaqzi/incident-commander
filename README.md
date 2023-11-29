Incident Commander
==================
This Incident Commander tool helps you keep track of everything that's going on when you're managing an incident.

Features:
- Keeping track of all the current issues affecting your systems
- Managing a list of actions per issue
- Tracking who is working on what action(s)
- Reminding you when to ask for updates from people
- Making it easy to copy business & tech summaries to your clipboard so you can keep others updated


## See a fully-working demo deployment of the tool
Feel free to try out the tool at our hosted copy. Please note that we don't make any effort to persist any data you create in the demo tool.

**[Use the demo tool](https://gaqzi.github.io/incident-commander/)**

There is also a video on the demo page with a narrated walkthrough of the features.

## How the tool works
The tool is a client-side web app. Once it loads the web page, it can work completely offline. 

In order to support 'multiplayer' interactions (multiple people editing the same incident at the same time), the tool uses [a WebSocket relay server](./socket_relay_server/) to sync [Y.js CRDT changes](https://github.com/yjs/yjs) between all parties viewing the same incident. 

## How to run your own copy of the tool

1. Deploy your own copy of the Socket Relay Server

    a. The socket relay server for the demo is deployed on [Fly.io](https://fly.io/). If you want an easy way to deploy your own, try that. See [Fly.io's speedrun docs page](https://fly.io/docs/speedrun/) for info on how to launch your own copy of the relay server.

    b. ```cp .env.example .env```
    
    c. Take the URL of your deployed relay server and put it in the `NEXT_PUBLIC_YJS_SOCKET_SERVER` var in `.env`.

2. Run `npm run build` to build a static copy of the app suitable for deploying wherever you want. We use GitHub pages for this. See our [GitHub deployment workflow](./.github/workflows/test-and-deploy.yml) for inspiration.

## How to develop the tool
See the [CONTRIBUTING](./CONTRIBUTING.md) file.