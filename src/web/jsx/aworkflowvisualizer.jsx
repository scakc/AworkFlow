import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactFlow, {
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  addEdge,
  Controls,
  Handle,
  Position,
  useReactFlow,
  ReactFlowProvider,
  NodeResizer
} from "reactflow";
import "reactflow/dist/style.css";
import { createWorkflowFromData, nodeClasses } from "./core/workflow-factory";
import { customMap as basicNodesMap } from './core/basic-nodes';
import NodeCreationModal from "./nodecreationmodal";

const nodeTypes = {
  ...basicNodesMap
}

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
      var node_ = {
        id: n.id,
        data: { ...n },
        position: n.position || { x: index * 200, y: 100 },
        type: 'default',
        sourcePosition: 'right',
        targetPosition: 'left',
        style: n.style,
      };

      // Get style and type
      if (n.type) {
        console.log(n);
        node_ = {...node_, type: n.type}
      }

      // check if data has parentid
      if (n.parentNodeId) {
        // check if parent exists
        const parent = workflowData.nodes.find((p) => p.id === n.parentNodeId);

        if (parent) {
          // check if parent is a group node
          if (parent.type === 'GroupNode') {
              node_ = {...node_, parentNode: n.parentNodeId}
          }
        }
        else {
          const {parentNodeId, ...newdata} = node_.data;
          node_ = {...node_, data: newdata}
        }
      }

      return node_;
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
    // Check if the node being deleted is a parent to any other nodes
    setNodes((nds) => {
      // First remove parent references from any child nodes
      var updatedNodes = nds.map(node => {
        if (node.parentNode === nodeId) {
          // Remove parent reference and update position to absolute
          const { parentNode, ...nodeWithoutParent } = node;
          const { parentNodeId, ...nodeData } = nodeWithoutParent.data;
          const parentNodeInstance = nds.find(n => n.id === parentNode);
          const newPosition = {x: parentNodeInstance.position.x + node.position.x, y: parentNodeInstance.position.y + node.position.y}
          return {
            ...nodeWithoutParent,
            data: {...nodeData, position: newPosition},
            position: newPosition
          };
        }
        return node;
      });

      // Then filter out the deleted node
      updatedNodes = updatedNodes.filter(node => node.id !== nodeId);
      memory.nodes = updatedNodes
      return updatedNodes;
    });
    
    setEdges((eds) => {
      var updated_edges = eds.filter(edge => edge.source !== nodeId && edge.target !== nodeId)
      memory.edges = updated_edges;
      return updated_edges;
    });
    
    console.log("second", memory);
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
  const updateGroupNodeDimensions = (groupnode) => {
    const groupId = groupnode.id;
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

          var newWidth =  Math.max(groupnode.width, maxX + padding * 2);
          var newHeight = Math.max(groupnode.height, maxY + padding * 2);
          return {
            ...n,
            data: {
              ...n.data,
              width: newWidth,
              height: newHeight
            },
            style: {
              ...n.style,
              width: newWidth,
              height: newHeight
            }
          };
        }
        return n;
      });
    });
  };

  // Create a component that will use the useReactFlow hook
  function FlowUtilsProvider({ children }) {
    const reactFlowUtils = useReactFlow();
    
    // Make the utils available globally
    useEffect(() => {
      window.reactFlowUtils = reactFlowUtils;
    }, [reactFlowUtils]);
    
    return <>{children}</>;
  }

  const findLowestNodes = (nodes) => {
      // Create a set of all parent nodes
      const parentNodes = new Set();
      for (const node of nodes) {
          if (node.parentNode) {
              parentNodes.add(node.parent);
          }
      }
      
      // Return nodes that aren't parents
      return nodes.filter(node => !parentNodes.has(node));
  }

  // Update your onNodeDragStop function
  const onNodeDragStop = useCallback((event, node) => {
    // Update memory with the new node positions
    setNodes((nds) => {
      // Get all group nodes except the current node
      const nonGroupNodes = nds;
      console.log("N", nonGroupNodes);
      var updatesNodes = [];
      // TODO for all non group nodes find their parent group (if any instersection)
      // if nested intersection are there then choose the nesting that is lowest level
      for (let i = 0; i < nonGroupNodes.length; i++) {
        const node = nonGroupNodes[i];
        const intersections = window.reactFlowUtils.getIntersectingNodes(node);
        console.log("NI", intersections);
        
        // if intersection is 0 delete parentNode and data.parentNodeId
        if (intersections.length === 0) {
          if (node.parentNode) {
            const parentNodeInstance = nds.find(n => n.id === node.parentNode);
            node.position = {x: parentNodeInstance.position.x + node.position.x, y: parentNodeInstance.position.y + node.position.y}
            node.data.position = node.position;
            delete node.parentNode;
            delete node.data.parentNodeId;
          }

          updatesNodes.push(node);
          continue;
        }

        // filter all intersecting groupnodes
        const groupNodes = intersections.filter((n) => n.data.isGroup);
        console.log("GN", groupNodes);

        // find the lowest level group node, i.e.: that is closese to tree leafs
        const nonParentNodes = findLowestNodes(groupNodes);
        console.log("NPGN", nonParentNodes);
        
        // if no group nodes are found then continue
        if (nonParentNodes.length === 0) {
          updatesNodes.push(node);
          continue;
        }

        // pick the first one
        const parent = nonParentNodes[0];

        // check if parent is same 
        if (node.parentNode === parent.id) {
          updatesNodes.push(node);
          continue;
        }

        if (parent) {
          // check if parent is a group node
          if (parent.type === 'GroupNode') {
            node.parentNode = parent.id;
            node.data.parentNodeId = parent.id;
            node.position = {x: node.position.x - parent.position.x, y: node.position.y - parent.position.y}
            node.data.position = node.position;
          }
        }

        updatesNodes.push(node);
      }

      memory.nodes = updatesNodes;
      saveWorkflow();
      return updatesNodes;
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

    // 
    event.stopPropagation();

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
    <ReactFlowProvider>
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onNodeDragStop={onNodeDragStop}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={onNodeDoubleClick}
        onEdgeClick={onEdgeClick}
        onPaneClick={onPaneClick}
        onInit={onLoad}
        onMoveEnd={onMoveEnd}
        defaultViewport={viewport}
      >
        <Background />
        <Controls />
        <FlowUtilsProvider />
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
    </div></ReactFlowProvider>
  );
}
