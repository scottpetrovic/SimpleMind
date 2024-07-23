const mindmap = document.getElementById("mindmap");
const svgContainer = document.getElementById("svg-container");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");
let nodeId = 0;
let draggedNode = null;
let offsetX, offsetY;
let selectedNode = null;
let initialDragPosition = { x: 0, y: 0 };
let rootNode = null;
const defaultColor = "rgb(228, 228, 228)";

function createNode(nodeConfig) {

  /*
    const nodeConfig = {
        x_position: nodeData.x,
        y_position: nodeData.y,
        parent: null,
        node_id: nodeData.id,
        node_content: nodeData.content,
        is_root_node: false,
        color: 'green'
    };*/

  const localNodeId = nodeConfig.node_id || `node-${nodeId++}`; // Renamed variable to avoid shadowing
  const rootNodeClass = nodeConfig.is_root_node ? "root-node" : "";
  const backgroundColor = nodeConfig.color || defaultColor;
  const nodeContent = nodeConfig.node_content || `Node ${localNodeId}`; // Use the renamed variable

  const nodeHTMLTemplate = `
    <div id="${localNodeId}" class="node ${rootNodeClass} pop-in" style="left: ${nodeConfig.x_position}px; top: ${nodeConfig.y_position}px;">
      <span class="color-chip" style="background-color: ${backgroundColor};"></span>
      <span class="node-text">${nodeContent}</span>
      
      <div class="node-actions-container">
        <button class="add-child-btn pop-in" title="Add Child">
          <img class="icon" src="./icons/plus.svg" />
        </button>
        <button class="edit-btn pop-in" title="Edit Name">
          <img class="icon" src="./icons/edit-3.svg" />
        </button>
        ${!nodeConfig.is_root_node ? `<button class="delete-btn pop-in" title="Delete">
              <img class="icon" src="./icons/x.svg" /></button>` : ''}
      </div>

      </div>
  `;

  // put the HTML string template into an actual DOM element to work with
  // this allows us to do things like add event listeners
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = nodeHTMLTemplate.trim();
  const node = tempDiv.firstChild;

  // event listeners
  node.addEventListener("dblclick", () => editNode(node));
  node.addEventListener("mousedown", dragStart);
  node.addEventListener("click", selectNode);

  // Attach event listeners to buttons
  node.querySelector(".add-child-btn").onclick = (event) => {
    event.stopPropagation();
    addNode(node);
  };

  node.querySelector(".edit-btn").onclick = (event) => {
    event.stopPropagation();
    editNode(node);
  };

  if (!nodeConfig.is_root_node) {
    node.querySelector(".delete-btn").onclick = (event) => {
      event.stopPropagation();
      deleteNode(node);
      updateConnectors();
    };
  }

  mindmap.appendChild(node);

  if (nodeConfig.parent) {
    drawConnector(nodeConfig.parent, node);
  }

  return node;
}

function editNode(node) {
  // change selected node to make sure we apply results to correct one
  selectedNode = node;
  showDialog(node);
}

function isDialogOpen() {
  const dialog = document.getElementById("customDialog");
  return dialog.style.display === "block";
}

function confirmDialog() {
  const node_being_edited = selectedNode.getElementsByClassName("node-text")[0];
  node_being_edited.textContent = document.getElementById("textInput").value; // update text value
  // update color
  const color = document.querySelector('input[name="color"]:checked').value;
  selectedNode.getElementsByClassName("color-chip")[0].style.backgroundColor =
    color;

  hideDialog();
  updateConnectors(); // updates color of connectors
}

function showDialog(node) {
  document.getElementById("dialogOverlay").style.display = "block";
  document.getElementById("customDialog").style.display = "block";

  // get the node-text element's content and place it in input
  document.getElementById("textInput").value =
    node.getElementsByClassName("node-text")[0].textContent;

  // add the node's text color and select the appropriate radio button
  const color =
    node.getElementsByClassName("color-chip")[0].style.backgroundColor;
  const colorRadio = document.querySelector(`input[value="${color}"]`);

  colorRadio.checked = true;

  document.getElementById("textInput").focus();
  document.getElementById("textInput").select();
}

function hideDialog() {
  document.getElementById("dialogOverlay").style.display = "none";
  document.getElementById("customDialog").style.display = "none";
}

function drawConnector(parent, child) {
  const connector = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  connector.setAttribute("class", "connector");
  connector.setAttribute("data-parent", parent.id);
  connector.setAttribute("data-child", child.id);
  updateConnector(parent, child, connector);
  svgContainer.appendChild(connector);
}

function updateConnector(parent, child, connector) {
  const parentRect = parent.getBoundingClientRect();
  const childRect = child.getBoundingClientRect();
  const px = parentRect.left + parentRect.width / 2;
  const py = parentRect.top + parentRect.height / 2;
  const cx = childRect.left + childRect.width / 2;
  const cy = childRect.top + childRect.height / 2;

  // Calculate the angle in radians between the parent and child nodes
  const angle = Math.atan2(cy - py, cx - px);

  // Adjust the curvature based on the angle
  const curvatureFactor = Math.abs(Math.sin(angle)); // Example adjustment, feel free to modify

  const midX = (px + cx) / 2;
  const midY = (py + cy) / 2;
  const dx = cx - px;
  const dy = cy - py;

  // Determine if the child is below the parent and adjust the curve direction
  const isChildBelow = cy > py;
  const curveDirection = isChildBelow ? -1 : 1;

  // Apply curvature factor to control the shape dynamically, adjusting direction based on child's position
  const curveX = midX + dy * 0.5 * curvatureFactor * curveDirection;
  const curveY = midY - dx * 0.5 * curvatureFactor * curveDirection;

  const path = `M${px},${py} Q${curveX},${curveY} ${cx},${cy}`;
  connector.setAttribute("d", path);

  // Grab the color of the child node and apply it to the connector
  const colorChip = child.querySelector('.color-chip');
  const childColor = colorChip.style.backgroundColor;
  connector.setAttribute("stroke", childColor);
}

function dragStart(e) {
  e.stopPropagation();

  // shouldn't be dragging things when edit dialog is open
  if (isDialogOpen()) {
    return;
  }

  draggedNode = e.target;
  const rect = draggedNode.getBoundingClientRect();
  offsetX = e.clientX - rect.left;
  offsetY = e.clientY - rect.top;
  initialDragPosition = { x: e.clientX, y: e.clientY };

  document.addEventListener("mousemove", drag);
  document.addEventListener("mouseup", dragEnd);
}

function drag(e) {
  if (draggedNode) {
    const dx = e.clientX - initialDragPosition.x;
    const dy = e.clientY - initialDragPosition.y;
    moveNodeAndDescendants(draggedNode, dx, dy);
    initialDragPosition = { x: e.clientX, y: e.clientY };
    updateConnectors();
  }
}

function moveNodeAndDescendants(node, dx, dy) {
  const currentX = parseInt(node.style.left);
  const currentY = parseInt(node.style.top);
  node.style.left = `${currentX + dx}px`;
  node.style.top = `${currentY + dy}px`;

  const children = getChildren(node);
  children.forEach((child) => moveNodeAndDescendants(child, dx, dy));
}

function dragEnd() {
  draggedNode = null;
  document.removeEventListener("mousemove", drag);
  document.removeEventListener("mouseup", dragEnd);
}

function updateConnectors() {
  const connectors = svgContainer.getElementsByClassName("connector");
  Array.from(connectors).forEach((connector) => {
    const parent = document.getElementById(
      connector.getAttribute("data-parent")
    );
    const child = document.getElementById(connector.getAttribute("data-child"));
    if (parent && child) {
      updateConnector(parent, child, connector);
    }
  });
}

function selectNode(e) {
  if (selectedNode) {
    selectedNode.classList.remove("selected");
  }
  selectedNode = e.target;
  selectedNode.classList.add("selected");
}

function deleteNode(node) {
  const children = getChildren(node);
  children.forEach((child) => deleteNode(child));

  const connectors = svgContainer.querySelectorAll(
    `[data-parent="${node.id}"], [data-child="${node.id}"]`
  );
  connectors.forEach((connector) => connector.remove());

  node.remove();

  if (selectedNode === node) {
    selectedNode = null;
  }
}

function getChildren(node) {
  const connectors = svgContainer.querySelectorAll(
    `[data-parent="${node.id}"]`
  );
  return Array.from(connectors).map((connector) =>
    document.getElementById(connector.getAttribute("data-child"))
  );
}

function getParent(node) {
  const connector = svgContainer.querySelector(`[data-child="${node.id}"]`);
  return connector
    ? document.getElementById(connector.getAttribute("data-parent"))
    : null;
}

function exportMindmap() {
  const nodes = Array.from(document.getElementsByClassName("node"));
  const connectors = Array.from(
    svgContainer.getElementsByClassName("connector")
  );

  const mindmapData = {
    nodes: nodes.map((node) => ({
      id: node.id,
      content: node.textContent,
      color: node.getElementsByClassName("color-chip")[0].style.backgroundColor,
      x: parseInt(node.style.left),
      y: parseInt(node.style.top),
    })),
    connectors: connectors.map((connector) => ({
      parent: connector.getAttribute("data-parent"),
      child: connector.getAttribute("data-child"),
    })),
  };

  const jsonData = JSON.stringify(mindmapData, null, 2);
  const blob = new Blob([jsonData], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "mindmap.json";
  a.click();

  URL.revokeObjectURL(url);
}

function importMindmap(jsonData) {
  const mindmapData = JSON.parse(jsonData);

  // Clear existing mindmap
  mindmap.innerHTML = "";
  svgContainer.innerHTML = "";

  // Create nodes
  mindmapData.nodes.forEach((nodeData) => {
    const nodeConfig = {
      x_position: nodeData.x,
      y_position: nodeData.y,
      parent: null,
      node_id: nodeData.id,
      node_content: nodeData.content,
      is_root_node: false,
      color: nodeData.color,
    };

    createNode(nodeConfig);
  });

  // Create connectors
  mindmapData.connectors.forEach((connectorData) => {
    const parent = document.getElementById(connectorData.parent);
    const child = document.getElementById(connectorData.child);
    if (parent && child) {
      drawConnector(parent, child);
    }
  });

  // Set root node
  rootNode = document.getElementById(mindmapData.nodes[0].id);
  selectNode({ target: rootNode });

  updateConnectors();
}

function addNode(baseNode) {
  const offset = 40; // Offset both below and to the right

  let referenceNode = baseNode;
  const children = getChildren(baseNode); // Assuming children have a class 'node'
  if (children.length > 0) {
    referenceNode = children[children.length - 1]; // Use the last child as reference
  }

  // Get the reference node's position
  const referenceRect = referenceNode.getBoundingClientRect();

  //
  let newX = referenceRect.right + offset;
  if (children.length > 0) {
    newX -= baseNode.getBoundingClientRect().right; // if we are another child, just be it underneath
  }

  let newY = referenceRect.bottom + offset;

  const nodeConfig = {
    x_position: newX,
    y_position: newY,
    parent: baseNode,
    node_id: null,
    node_content: null,
    is_root_node: false,
    color: null,
  };

  // Assuming createNode is a function that creates the new node
  createNode(nodeConfig); // Pass additional parameters as needed
}

function createRootNode() {
    const nodeConfig = {
        x_position: 300,
        y_position: 300,
        parent: null,
        node_id: null,
        node_content: "Root Node",
        is_root_node: true,
        color: defaultColor,
      };
      
      rootNode = createNode(nodeConfig);
      selectNode({ target: rootNode });
}

exportBtn.addEventListener("click", exportMindmap);

importBtn.addEventListener("click", () => {
  importInput.click();
});

importInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      importMindmap(e.target.result);
    };
    reader.readAsText(file);
  }
});

// Event listeners for OK and Cancel dialog buttons
document.getElementById("okButton").addEventListener("click", function () {
    confirmDialog();
  });
  
document.getElementById("cancelButton").addEventListener("click", function () {
// Simply hide the dialog
hideDialog();
});

document.addEventListener("keydown", function (event) {
if (event.key === "Enter" && isDialogOpen()) {
    // Close the dialog or perform any action when the dialog is open and Enter is pressed
    confirmDialog(); // Assuming you have a function to close the dialog
}
});

// if someone clicks and starts dragging in the canvas, treat that as moving the root node
document.addEventListener("mousedown", (e) => {
    if (!e.target.classList.contains("node")) {
      const simulatedEvent = new MouseEvent("mousedown", {
        bubbles: true,
        cancelable: true,
        clientX: e.clientX,
        clientY: e.clientY,
      });
      rootNode.dispatchEvent(simulatedEvent);
    }
  });
  

createRootNode()


