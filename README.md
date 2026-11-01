# Game Platform

A blue platform where people build games and publish them. No AI and no API key needed.

## Run
1. Install Node.js 18+.
2. `npm start`, then open http://localhost:3000

## How it works
- Click **+** (top right) and create an account (email, password, username).
- **Build** tab: add Car, Road, Wall, Tree, Coin or Enemy and drag them around.
- **Code** tab: a code editor with file tabs, line numbers, Run/Stop and a console.
  Paste scripts from Claude or anyone else, or write your own.
- Tick "My game is finished", then **Publish**. The game appears on the home page.

## Script commands
- `scene.get("Car")`, `scene.getAll("Coin")`, `scene.remove(obj)`
- object: `x`, `y`, `angle`, `speed`, `color`, `turn(deg)`, `move(dx, dy)`, `hits(other)`
- `onKey("ArrowUp", fn)` runs every frame while the key is held
- `onUpdate(fn)` runs every frame
- `log(value)` prints to the console
- Multiplayer: `net.join("room1", msg => ...)` and `net.send({...})`

Data is stored in `data.json`. Published scripts run in a sandboxed frame. For a public site, use HTTPS and add rate limiting.
