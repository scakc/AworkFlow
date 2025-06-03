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
import { createWorkflowFromData, nodeClasses } from "./core/workflow-factory";
import NodeCreationModal from "./nodecreationmodal";

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedEdge, setSelectedEdge] = useState(null);
  const [showNodeModal, setShowNodeModal] = useState(false);
  const [nodePosition, setNodePosition] = useState({ x: 0, y: 0 });
  const [editingNode, setEditingNode] = useState(null);
  const [viewport, setViewport] = useState({ x: 0, y: 0, zoom: 1 });
  const reactFlowInstance = useRef(null);

  const onLoad = useCallback((instance) => {
    reactFlowInstance.current = instance;
  }, []);

  const onMoveEnd = useCallback((event, viewport) => {
    memory.viewport = viewport;
    saveWorkflow();
  }, []);

  // Function to check if a node is inside a group node
  const isNodeInsideGroup = (nodePosition, groupNode) => {
    var isNodeInside = (
      nodePosition.x > groupNode.position.x &&
      nodePosition.x < groupNode.position.x + parseInt(groupNode.data.width) &&
      nodePosition.y > groupNode.position.y &&
      nodePosition.y < groupNode.position.y + parseInt(groupNode.data.height)
    );
    console.log(nodePosition, groupNode, isNodeInside);
    return isNodeInside
  };

  // Inside your component, add a ref for the flow
  const reactFlowWrapper = useRef(null);

  const memory = useRef({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  });

  // Expose reference to the window object
  useEffect(() => {
    window.setWorkflowVisualizerRef({
      loadWorkflow, 
      getWorkflow,
      addNode,
      updateNodeProperties,
      saveWorkflow,
      deleteNode,
      deleteEdge
    });
  }, []);

  // Add this hook for keyboard deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete') {
        // Delete selected node if one is selected
        if (selectedNode) {
          deleteNode(selectedNode.id);
          setSelectedNode(null);
          return;
        }
        
        // If no node is selected, check if an edge is selected
        // ReactFlow adds the 'selected' class to selected edges
        console.log("deleted", selectedEdge);
        if (selectedEdge) {
          deleteEdge(selectedEdge);
          setSelectedEdge(null);
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, selectedEdge, deleteNode, deleteEdge]);

  // Function to load workflow data
  const loadWorkflow = (data) => {
    console.log(data);
    // Create a workflow instance using our TypeScript classes
    const workflow = createWorkflowFromData(data);
    
    // Get the data representation
    const workflowData = workflow.get_data();
    
    // Map nodes
    const loadedNodes = workflowData.nodes.map((n, index) => {
      // Get style based on node class and data
      return {
        id: n.id,
        data: { ...n },
        position: n.position || { x: index * 200, y: 100 },
        type: 'default',
        sourcePosition: 'right',
        targetPosition: 'left',
        style: n.style
      };
    });

    // Map edges
    const loadedEdges = workflowData.edges.map((e) => ({
      id: `e${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
    }));

    setNodes(loadedNodes);
    setEdges(loadedEdges);

    // Load viewport if available
    if (workflowData.viewport) {
      setViewport(workflowData.viewport);
      
      // Try to set viewport on the instance if available
      if (reactFlowInstance.current) {
        reactFlowInstance.current.setViewport(workflowData.viewport);
      } else {
        // If instance not available yet, try again after a short delay
        setTimeout(() => {
          if (reactFlowInstance.current) {
            reactFlowInstance.current.setViewport(workflowData.viewport);
          }
        }, 100);
      }
    }
    
    // Save to memory
    memory.nodes = loadedNodes;
    memory.edges = loadedEdges;
  };
    
  const saveWorkflow = (input_memory = null) => {
    if ((input_memory == undefined) || (input_memory == null)) {
      input_memory = memory;
    }

    // Check if viewport is available, if not try to get it from reactFlowInstance
    if (!input_memory.viewport || 
        (input_memory.viewport.x === 0 && input_memory.viewport.y === 0 && input_memory.viewport.zoom === 1)) {
      
      if (reactFlowInstance.current) {
        input_memory.viewport = reactFlowInstance.current.getViewport();
      }
    }

    // If still no viewport, wait a bit and try again
    if (!input_memory.viewport || 
        (input_memory.viewport.x === 0 && input_memory.viewport.y === 0 && input_memory.viewport.zoom === 1)) {
      
      setTimeout(() => {
        if (reactFlowInstance.current) {
          input_memory.viewport = reactFlowInstance.current.getViewport();
        }
        
        // Now save with the updated viewport
        const workflowData = getWorkflow(input_memory);
        sessionStorage.setItem("workflowData", JSON.stringify(workflowData));
        localStorage.setItem("workflowData", JSON.stringify(workflowData));
      }, 100);
      
      return; // Exit early, the timeout will handle saving
    }

    // If we have a viewport, save immediately
    const workflowData = getWorkflow(input_memory);
    sessionStorage.setItem("workflowData", JSON.stringify(workflowData));
    localStorage.setItem("workflowData", JSON.stringify(workflowData));
  };

  const getWorkflow = (input_memory=null) => {

    if ((input_memory == undefined) || (input_memory == null)) {
      input_memory = memory;
    }

    // check if viewport info exists 
    if (!input_memory.viewport) {
      console.log("Missing viewport");
      input_memory.viewport = { x: 0, y: 0, zoom: 1 };
    }

    return {
      nodes: input_memory.nodes.map((n) => {
        // Extract all data except style
        const { style, ...nodeData } = n.data;
        
        return {
          ...nodeData, 
          id: n.id,
          position: n.position
        };
      }),
      edges: input_memory.edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
      viewport: input_memory.viewport
    };
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

  // Add this function to your WorkflowVisualizer component
  const deleteNode = useCallback((nodeId) => {
    setNodes((nds) => nds.filter(node => node.id !== nodeId));
    setEdges((eds) => eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId));
    
    // Update memory
    memory.nodes = memory.nodes.filter(node => node.id !== nodeId);
    memory.edges = memory.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);
    saveWorkflow(memory);
  }, []);

  // Add this function to delete edges
  const deleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter(edge => edge.id !== edgeId));
    
    // Update memory
    memory.edges = memory.edges.filter(edge => edge.id !== edgeId);
    saveWorkflow(memory);
  }, []);

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

  // Function to update group node dimensions based on its children
  const updateGroupNodeDimensions = (groupId) => {
    setNodes(nds => {
      const childrenOfGroup = nds.filter(n => n.parentNode === groupId);
      if (childrenOfGroup.length === 0) return nds;
      
      // Find min/max positions of all children
      let minX = Infinity, minY = Infinity;
      let maxX = -Infinity, maxY = -Infinity;
      
      childrenOfGroup.forEach(child => {
        const nodeWidth = 150;  // Approximate node width
        const nodeHeight = 50;  // Approximate node height
        
        minX = Math.min(minX, child.position.x);
        minY = Math.min(minY, child.position.y);
        maxX = Math.max(maxX, child.position.x + nodeWidth);
        maxY = Math.max(maxY, child.position.y + nodeHeight);
      });
      
      // Add padding
      const padding = 30;
      
      // Update the parent group node dimensions
      return nds.map(n => {
        if (n.id === groupId) {
          return {
            ...n,
            data: {
              ...n.data,
              width: Math.max(200, maxX + padding * 2),
              height: Math.max(150, maxY + padding * 2)
            }
          };
        }
        return n;
      });
    });
  };

  // Update your onNodeDragStop function
  const onNodeDragStop = useCallback((event, node) => {
    // First, check if the node is being dragged out of its parent
    if (node.parentNode) {
      const parentNode = nodes.find(n => n.id === node.parentNode);
      const parent_position = parentNode.position;
      const node_absolute_position = { x: node.position.x + parent_position.x, y: node.position.y + parent_position.y }
      if (parentNode && !isNodeInsideGroup(node_absolute_position, parentNode)) {
        // Node was dragged outside its parent, remove the parent relationship
        setNodes(nds => {
          const updatedNodes = nds.map(n => {
            if (n.id === node.id) {
              const { parentNode, ...nodeWithoutParent } = n;
              return {
                ...nodeWithoutParent,
                position: {
                  x: parentNode.position.x + n.position.x,
                  y: parentNode.position.y + n.position.y
                }
              };
            }
            return n;
          });
          memory.nodes = updatedNodes;
          return updatedNodes;
        });
      }

      updateGroupNodeDimensions(parentNode);
    } else {
      // Check if the node was dragged into any group node
      const groupNodes = nodes.filter(n => n.data.isGroup && n.id !== node.id);
      
      for (const groupNode of groupNodes) {
        if (isNodeInsideGroup(node.position, groupNode)) {
          // Node was dragged inside a group, make it a child
          setNodes(nds => {
            const updatedNodes = nds.map(n => {
              if (n.id === node.id) {
                return {
                  ...n,
                  parentNode: groupNode.id,
                  extent: 'parent',
                  position: {
                    x: n.position.x - groupNode.position.x,
                    y: n.position.y - groupNode.position.y
                  }
                };
              }
              return n;
            });
            memory.nodes = updatedNodes;
            return updatedNodes;
          });

          updateGroupNodeDimensions(groupNode);
          break;
        }
      }
    }

    // Update memory with the new node positions
    setNodes((nds) => {
      memory.nodes = nds;
      saveWorkflow();
      return nds;
    });
  }, [nodes]);
  
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

  // Handle node double-click for editing
  const onNodeDoubleClick = (event, node) => {
    event.stopPropagation();
    setEditingNode(node);
    setNodePosition(node.position);
    setShowNodeModal(true);
  };

  // Add this handler for edge selection
  const onEdgeClick = (event, edge) => {
    setSelectedEdge(edge.id);
    // console.log("Edge clicked:", selectedEdge); // Debug log
    setSelectedNode(null); // Deselect any selected node
  };

  // Handle background click to close properties panel
  const onPaneClick = (event) => {

    // If shift key is pressed, create a new node
    if (event.shiftKey && reactFlowInstance.current) {
      const position = reactFlowInstance.current.project({
        x: event.clientX,
        y: event.clientY
      });
      setNodePosition(position);
      setShowNodeModal(true);
      return;
    }
    
    setSelectedNode(null);
    setSelectedEdge(null);
    setEditingNode(null);
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
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onInit={onLoad}
        onMoveEnd={onMoveEnd}
        defaultViewport={viewport}
      >
        <Background />
        <Controls />
      </ReactFlow>
      {showNodeModal && <NodeCreationModal
          nodePosition={nodePosition}
          setShowNodeModal={setShowNodeModal}
          setNodes={setNodes}
          memory={memory}
          saveWorkflow={saveWorkflow}
          editingNode={editingNode}
          setEditingNode={setEditingNode}
        />}
    </div>
  );
}
