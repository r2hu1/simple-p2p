# How it works
its an simple p2p socket server that shares images between connected members (max 5)

# Run Locally
idk why it runs smoothly on localhost but it didn't when i hosted it anyways,
- `git clone https://github.com/r2hu1/[repo-name]`
- `cd [folder-name]`
- `npm i` or `pnpm i`
- `npm run dev`

visit `http://localhost:3010`

# Structure
- server.js
- app
-- home.html
-- share.html
-- receive.html

the server.js file is a basic socket.io and express.js server that make rooms, let user join room and share files.

# Next Step
i was hoping to build a serverless image,zip,code sharing web/pwa, currently skipping this project i will try to finish it latter but if you have done just submit a pull request i will merge it!!