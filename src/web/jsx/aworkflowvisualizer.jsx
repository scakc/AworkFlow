import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  addEdge,
  Controls,
  Handle,
  Position
} from "reactflow";
import "reactflow/dist/style.css";
import { createWorkflowFromData } from "./core/workflow-factory";

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // Inside your component, add a ref for the flow
  const reactFlowWrapper = useRef(null);

  const memory = {
    nodes: [],
    edges: [],
  };

  // Expose reference to the window object
  useEffect(() => {
    window.setWorkflowVisualizerRef({
      loadWorkflow, 
      getWorkflow,
      addNode,
      updateNodeProperties,
      saveWorkflow,
    });
  }, []);


  // Function to load workflow data
  const loadWorkflow = (data) => {
    // Create a workflow instance using our TypeScript classes
    const workflow = createWorkflowFromData(data);
    
    // Get the data representation
    const workflowData = workflow.get_data();
    
    // Map nodes
    const loadedNodes = workflowData.nodes.map((n, index) => ({
      id: n.id,
      data: { ...n },
      position: n.position || { x: index * 200, y: 100 },
      type: 'default',
      sourcePosition: 'right',
      targetPosition: 'left'
    }));

    // Map edges
    const loadedEdges = workflowData.edges.map((e) => ({
      id: `e${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);
    
    // Save to memory
    memory.nodes = loadedNodes;
    memory.edges = loadedEdges;
  };

  const saveWorkflow = (input_memory = null) => {

    if ((input_memory == undefined) || (input_memory == null)) {
      input_memory = memory;
    }

    const workflowData = getWorkflow(input_memory);
    console.log("saved", memory, workflowData);
    sessionStorage.setItem("workflowData", JSON.stringify(workflowData));
  };

  const getWorkflow = (memory) => {
    return {
      nodes: memory.nodes.map((n) => ({
        ...n.data, 
        id : n.id,
        position: n.position
      })),
      edges: memory.edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
    }
  };

  // Function to add a new node
  const addNode = (name = "New Node", description = "Description") => {
    const newId = `node_${Date.now()}`;
    const newNode = {
      id: newId,
      data: { name:`${name}`, description:`${description}`, label: `${name}` },
      position: { 
        x: Math.random() * 300 + 50, 
        y: Math.random() * 300 + 50 
      },
      type: 'default',
      sourcePosition: 'right',
      targetPosition: 'left'
    };

    // Use functional update to ensure we have the latest state
    setNodes(currentNodes => {
      const updatedNodes = [...currentNodes, newNode];
      // Update memory after state update
      memory.nodes = updatedNodes;
      return updatedNodes;
    });
    
    return newId;
  };

  // Function to update node properties
  const updateNodeProperties = (nodeId, name, description) => {
    setNodes(currentNodes => {
      const updatedNodes = currentNodes.map(node => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, label: name}
          };
        }
        return node;
      });
      
      memory.nodes = updatedNodes;
      console.log("updated", memory.nodes);
      saveWorkflow(memory);
      return updatedNodes;
    });

    // Hide the properties panel after update
    setSelectedNode(null);
  };

  const onNodesChange = (changes) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);
      return updatedNodes;
    });
  };

  // Add this handler function
  const onNodeDragStop = useCallback(() => {

    setNodes((nds) => {
      // Update memory with the new node positions
      memory.nodes = nds;

      saveWorkflow();
      return nds;
    });
  }, []);
  
  const onEdgesChange = (changes) => {
    setEdges((eds) => {
      const updatedEdges = applyEdgeChanges(changes, eds);
  
      // Update memory with the new edges
      memory.edges = updatedEdges;
  
      return updatedEdges;
    });
  };

  // Handle new edge connections
  const onConnect = useCallback((params) => {
    setEdges((eds) => {
      const updatedEdges = addEdge(params, eds);
      memory.edges = updatedEdges;
      return updatedEdges;
    });

    saveWorkflow();

  }, []);

  // Handle node selection
  const onNodeClick = (event, node) => {
    // Get the node DOM element
    const nodeElement = document.querySelector(`[data-id="${node.id}"]`);
    
    // Calculate panel position to appear to the right of the node
    let panelPosition = { x: 10, y: 10 };
    
    if (nodeElement) {
      const nodeRect = nodeElement.getBoundingClientRect();

      console.log(nodeRect);

      // Position the panel to the right of the node
      panelPosition = {
        x: nodeRect.left + 100, // 10px to the right of the node
        y: nodeRect.top
      };
      
      // Add width and height to the node object for reference
      node.width = nodeRect.width;
      node.height = nodeRect.height;
    }
    
    setSelectedNode({...node, panelPosition});
  };

  // Handle background click to close properties panel
  const onPaneClick = () => {
    setSelectedNode(null);
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
      >
        <Background />
      </ReactFlow>
      {selectedNode && (
        <div 
          className="floating-properties-panel"
          style={{
            position: "absolute",
            top: `${selectedNode.panelPosition?.y || 10}px`,
            left: `${selectedNode.panelPosition?.x + 10 || 10}px`,
            width: "250px",
            padding: "15px",
            backgroundColor: "white",
            boxShadow: "0 0 10px rgba(0,0,0,0.2)",
            zIndex: 10,
            borderRadius: "5px"
          }}
        >
          <h3>Node Properties</h3>
          <div>
            <label htmlFor="node-name">Name:</label>
            <input 
              type="text" 
              id="node-name" 
              defaultValue={selectedNode.data.name || selectedNode.data.label} 
            />
          </div>
          <div>
            <label htmlFor="node-description">Description:</label>
            <textarea 
              id="node-description" 
              defaultValue={selectedNode.data.description || ""}
            />
          </div>
          <button 
            onClick={() => {
              const name = document.getElementById('node-name').value;
              const description = document.getElementById('node-description').value;
              updateNodeProperties(selectedNode.id, name, description);
            }}
          >
            Update
          </button>
          <button 
            onClick={() => setSelectedNode(null)}
            style={{ marginLeft: "10px", backgroundColor: "#ccc" }}
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
