import React from "react";
import * as ReactDOMClient from "react-dom/client";
import WorkflowVisualizer from "./aworkflowvisualizer";


ReactDOMClient.createRoot(document.getElementById("root")).render(
    <WorkflowVisualizer />
);

// Global reference to the workflow visualizer
let workflowVisualizerRef = null;

// This function will be called when you click "Open"
window.handleOpen = async () => {
    const fileInput = document.getElementById("file-input");
    await fileInput.click();

    // lets wait till the user selects a file
    fileInput.onchange = async () => {

        // clear session storage
        sessionStorage.removeItem("workflowData");

        // Check if a file is selected
        const file = fileInput.files[0];

        if (!file) {
            alert("Please select a file first.");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
            const data = JSON.parse(e.target.result);
            if (workflowVisualizerRef) {
                workflowVisualizerRef.loadWorkflow(data);
            }
            window.console.log("Workflow loaded successfully:", data);
            } catch (err) {
            console.error("Invalid JSON file:", err);
            alert("Invalid JSON format.");
            }

            // save session storage
            window.console.log(workflowVisualizerRef);
            handleSaveSession();
        };
        reader.readAsText(file);
    }
    // Reset the file input value
    fileInput.value = "";
    
};

// Function to handle Add Node button click
window.handleAddNode = () => {
  if (workflowVisualizerRef) {
    const nodeName = prompt("Enter node name:", "New Node");
    if (nodeName) {
      const nodeDescription = prompt("Enter node description:", "Description");
      workflowVisualizerRef.addNode(nodeName, nodeDescription);
      // Save to session after adding node
      handleSaveSession();
    }
  } else {
    alert("Workflow visualizer not initialized.");
  }
};

// Function to handle updating node properties
window.handleUpdateNodeProperties = (nodeId) => {
  if (workflowVisualizerRef) {
    const name = document.getElementById('node-name').value;
    const description = document.getElementById('node-description').value;
    
    workflowVisualizerRef.updateNodeProperties(nodeId, name, description);
    
    // Save to session after updating node
    handleSaveSession();
  }
};

// Get reference from the component
window.setWorkflowVisualizerRef = (ref) => {
    workflowVisualizerRef = ref;    
};

// Save the loaded workflow to local session
window.handleSaveSession = () => {
    workflowVisualizerRef.saveWorkflow();
}

// Load the workflow from local session
window.handleLoadSession = () => {
    const data = sessionStorage.getItem("workflowData");
    if (data) {
        const parsedData = JSON.parse(data);
        workflowVisualizerRef.loadWorkflow(parsedData);
    } else {
        alert("No saved session found.");
    }
}

// Clear the session
window.handleClearSession = () => {
    sessionStorage.removeItem("workflowData");
}

// On page load, check if there is a saved session
window.onload = () => {
    const data = sessionStorage.getItem("workflowData");
    if (data) {
        const parsedData = JSON.parse(data);
        workflowVisualizerRef.loadWorkflow(parsedData);
    }
}