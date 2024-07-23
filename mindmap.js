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

function createNode(nodeConfig) {
  const node = document.createElement("div");

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

  if (nodeConfig.is_root_node) {
    node.className = "node root-node";
  } else {
    node.className = "node";
  }
  node.classList.add("pop-in");

  node.id = nodeConfig.node_id || `node-${nodeId++}`;
  node.style.left = `${nodeConfig.x_position}px`;
  node.style.top = `${nodeConfig.y_position}px`;

  // create a square for the color status
  const color = document.createElement("span");
  color.className = "color-chip";
  color.style.backgroundColor = nodeConfig.color || "rgb(228, 228, 228)";
  node.appendChild(color);

  // put text content in new span
  const text = document.createElement("span");
  text.className = "node-text";
  text.textContent = nodeConfig.node_content || `Node ${node.id}`;
  node.appendChild(text);

  node.addEventListener("dblclick", () => editNode(node));
  node.addEventListener("mousedown", dragStart);
  node.addEventListener("click", selectNode);

  // Create add child button or the node
  const addChildBtn = document.createElement("button");
  addChildBtn.innerHTML = '<img class="icon pop-in" src="./icons/plus.svg" />';
  addChildBtn.className = "add-child-btn"; // For styling
  addChildBtn.title = "Add Child";
  addChildBtn.onclick = (event) => {
    event.stopPropagation(); // Prevent click event from bubbling to parent nodes
    addNode(node); // Assuming you want to pass the node's id, not the uninitialized 'id' variable
  };
  node.appendChild(addChildBtn);

  // Create edit button
  const editBtn = document.createElement("button");
  editBtn.innerHTML = '<img class="icon pop-in" src="./icons/edit-3.svg" />';
  editBtn.className = "edit-btn"; // For styling
  editBtn.title = "Edit Name";
  editBtn.onclick = (event) => {
    event.stopPropagation(); // Prevent click event from bubbling to parent nodes
    editNode(node); // Assuming you want to pass the node's id, not the uninitialized 'id' variable
  };
  node.appendChild(editBtn);

  // Create delete button
  // root node cannot be deleted
  if (nodeConfig.is_root_node === false) {
    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = "Delete";
    deleteBtn.innerHTML = '<img class="icon pop-in" src="./icons/x.svg" />';
    deleteBtn.className = "delete-btn"; // For styling
    deleteBtn.title = "Delete";
    deleteBtn.onclick = (event) => {
      event.stopPropagation(); // Prevent click event from bubbling to parent nodes
      deleteNode(node);
      updateConnectors();
    };
    node.appendChild(deleteBtn);
  }

  mindmap.appendChild(node);

  if (nodeConfig.parent) {
    drawConnector(nodeConfig.parent, node);
  }

  return node;
}

function editNode(node) {
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
}

// Event listeners for OK and Cancel buttons
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

// Function to show the dialog
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

// Function to hide the dialog
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

// Create initial node
const isRootNode = true;

const nodeConfig = {
  x_position: 300,
  y_position: 300,
  parent: null,
  node_id: null,
  node_content: "Root Node",
  is_root_node: true,
  color: "rgb(228, 228, 228)",
};

rootNode = createNode(nodeConfig);
selectNode({ target: rootNode });

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