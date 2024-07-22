# Simple MindMap
An electron application that helps you gather your thoughts

## Feature Set
- Adding nodes, renaming nodes, deleting nodes
- Multiple levels of children
- dragging nodes around for positioning
- Export and Import data with JSON format.


## TODO
- Cannot do popups for editing...so need to do another way
- Create github project 
- How to create better Electron experience/UI to feel more like a VS code
- How to build binaries for Windows and Linux
- How to publish binaries out to github
- Node connector curve takes into account position
- Create toolbar for options instead of buttons

## Building
You need node.js for this.

    npm install
    npm run start


## Packaging and Distributing
Electron doesn't come with this ability by default, so the NPM "@electron-forge/cli" 
package is used. All the NPM dependencies that contain "forge" in them are for this purpose.

This packaging is configured through forge.config.js

   npm run make

There will be an "out" folder created which contains the portable executable

