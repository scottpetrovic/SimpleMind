# Simple MindMap
Build a mind map to help organize your ideas or todo items. This was built as an Electron application to learn how it works.

<img src="screenshot.png" alt="Mind mapping software" />

## Feature Set
- Adding nodes, renaming nodes, deleting nodes
- Multiple levels of children
- dragging nodes around for positioning
- Export and Import mind map to JSON format.
- Color labeling
- Drag and drop to reparent node to another

## Building
You need node.js for this. I am on version 18

    npm install
    npm run start

## TODO
1. Ability to add icons to node. This will go above the node centered
1. Have first branch off root have text size slightly larger than other sub-children for better visual clarity
1. Play around with visual style a bit to see if I carn reduce visual noise with so many rectangles on screen (every node)
1. Undo/redo ability?
1. Ability to see/visualize node graph from a hierarchy (bulleted list)
1. Tab shortcut to add new child node
1. Theming support (light/dark/system)

## Packaging and Distributing
Electron doesn't come with this ability by default, so the NPM "@electron-forge/cli" 
package is used. All the NPM dependencies that contain "forge" in them are for this purpose.

This packaging is configured through forge.config.js

    npm run make

There will be an "out" folder created which contains the portable executable

