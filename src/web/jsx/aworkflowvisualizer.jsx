import React, { useState, useEffect, useCallback, useRef } from "react";
import { ReactFlow,
  applyNodeChanges,
  applyEdgeChanges,
  Background,
  addEdge,
  Controls,
  useReactFlow,
  MiniMap,
  ReactFlowProvider
} from "@xyflow/react";
import "@xyflow/react/dist/style.css"; // New import for XYFlow
import { createWorkflowFromData } from "./core/workflow-factory";
import { customMap as basicNodesMap } from './core/basic-nodes';
import NodeCreationModal from "./nodecreationmodal";

export const nodeTypes = {
  ...basicNodesMap
}

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);
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

  const memory = useRef({
    nodes: [],
    edges: [],
    viewport: { x: 0, y: 0, zoom: 1 }
  });

  // the passed handler has to be memoized, otherwise the hook will not work correctly
  const onChange = useCallback(({ nodes, edges }) => {
    console.log("onChange", nodes, edges);

    setSelectedNodes(nodes.map((node) => node.id));
    setSelectedEdges(edges.map((edge) => edge.id));
  }, []);

  // Expose reference to the window object
  useEffect(() => {
    window.setWorkflowVisualizerRef({
      loadWorkflow, 
      getWorkflow,
      addNode,
      saveWorkflow,
      updateNodeDimensions,
      deleteNode,
      deleteEdge,
      onChange
    });
  }, []);

  // Add this hook for keyboard deletion
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Delete') {
        // Delete selected node if one is selected
        if (selectedNodes.length > 0) {
          console.log("deleted nodes", selectedNodes);
          deleteNode(selectedNodes.map((n) => n.id));
          setSelectedNodes([]);
          return;
        }
        
        // If no node is selected, check if an edge is selected
        // ReactFlow adds the 'selected' class to selected edges
        if (selectedEdges.length > 0) {
          console.log("deleted edges", selectedEdges);
          deleteEdge(selectedEdges.map((e) => e.id)); 
          setSelectedEdges([]);
          return 
        }
        

      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNodes, selectedEdges, deleteNode, deleteEdge]);

  const removeRedundandNodes = (nodes) => {
    const nodeIds = new Set();
    const uniqueNodes = [];

    nodes.forEach((node) => {
      if (!nodeIds.has(node.id)) {
        nodeIds.add(node.id);
        uniqueNodes.push(node);
      }
    });

    return uniqueNodes;
  }

  const removeUnconnectedEdges = (edges, nodes) => {
    const connectedNodeIds = new Set(nodes.map((node) => node.id));
    const connectedEdges = edges.filter((edge) => connectedNodeIds.has(edge.source) && connectedNodeIds.has(edge.target));

    return connectedEdges;
  };

  // make sure each parent node is before the child node in array  
  const sortNodes = (nodes) => {
    const sortedNodes = [];
    const nodeMap = new Map(nodes.map((node) => [node.id, node]));

    const processNode = (node) => {
      if (sortedNodes.includes(node)) {
        return;
      }

      if (node.parentId) {
        const parentNode = nodeMap.get(node.parentId);
        // console.log("found", parentNode, sortedNodes);
        if (parentNode) {
          processNode(parentNode);
        }
      }

      sortedNodes.push(node);
    };

    nodes.forEach((node) => {
      processNode(node);
    });

    return sortedNodes;
  };

  // Function to load workflow data
  const loadWorkflow = (data) => {
    // Create a workflow instance using our TypeScript classes
    const workflow = createWorkflowFromData(data);
    // Get the data representation
    const workflowData = workflow.get_data();
    // Map nodes
    var loadedNodes = removeRedundandNodes(workflowData.nodes.map((n, index) => {
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
        node_ = {...node_, type: n.type}
      }

      // check if data has parentid
      if (n.parentNodeId) {
        // check if parent exists
        const parent = workflowData.nodes.find((p) => p.id === n.parentNodeId);
        // console.log("parent", parent );

        if (parent) {
          // check if parent is a group node
          if (parent.type === 'GroupNode') {
              node_ = {...node_, parentId: n.parentNodeId }
          }
        }
        else {
          const {parentNodeId, ...newdata} = node_.data;
          node_ = {...node_, data: newdata}
        }
      }

      return node_;
    }));

    // make sure each parent node is before the child node in array
    loadedNodes = sortNodes(loadedNodes);

    // Map edges
    var loadedEdges = workflowData.edges.map((e) => ({
      id: `e${e.source}-${e.target}`,
      source: e.source,
      target: e.target,
    }));

    loadedEdges = removeUnconnectedEdges(loadedEdges, loadedNodes);

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

  // 
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
        n.data.style = n.data.style || {};
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
  const deleteNode = useCallback((nodeIds) => {
    console.log("ids", nodeIds);
    // Check if the node being deleted is a parent to any other nodes
    setNodes((nds) => {
      // First remove parent references from any child nodes
      var updatedNodes = nds.map(node => {
        if (nodeIds.includes(node.parentId)) {
          // Remove parent reference and update position to absolute
          const { parentId, ...nodeWithoutParent } = node;
          const { parentNodeId, ...nodeData } = nodeWithoutParent.data;
          const parentNodeInstance = nds.find(n => n.id === parentId);
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
      updatedNodes = updatedNodes.filter(node => !nodeIds.includes(node.id));
      memory.nodes = updatedNodes
      return updatedNodes;
    });
    
    setEdges((eds) => {
      var updated_edges = eds.filter(edge => !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target))
      memory.edges = updated_edges;
      return updated_edges;
    });
    
    console.log("second", memory);
    saveWorkflow(memory);

  }, []);

  // Add this function to delete edges
  const deleteEdge = useCallback((edgeIds) => {
    setEdges((eds) => eds.filter(edge => !edgeIds.includes(edge.id)));
    // Update memory
    memory.edges = memory.edges.filter(edge => !edgeIds.includes(edge.id));
    saveWorkflow(memory);
  }, []);

  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      // Apply changes using the built-in function
      const updatedNodes = applyNodeChanges(changes, nds);
      memory.nodes = updatedNodes;
      return updatedNodes;
    });
  }, [nodes]);

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
          if (node.parentId) {
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
      // console.log(nds);
      // return nds;
      // Get all group nodes except the current node
      const nodesToProcessIds = [node, ...selectedNodes.filter((n) => n.id !== node.id)].map((n) => n.id);
      const nodesToProcess = nds.filter((n) => nodesToProcessIds.includes(n.id));
      var remainingNodes = nds.filter((n) => !nodesToProcess.map((n) => n.id).includes(n.id));
      var updatesNodes = [];

      // TODO for all non group nodes find their parent group (if any instersection)
      // if nested intersection are there then choose the nesting that is lowest level
      for (let i = 0; i < nodesToProcess.length; i++) {
        const currentNode = nodesToProcess[i];
        const intersections = window.reactFlowUtils.getIntersectingNodes(currentNode);
        
        // filter all intersecting groupnodes
        const groupNodes = intersections.filter((n) => n.data.isGroup);

        // TODO
        // update functions to compute nested absolute position in nested groups 

        // if intersection is 0 delete parentNode and data.parentNodeId
        if (groupNodes.length === 0) {
          if (currentNode.parentId) {
            // console.log("Removing parent", currentNode);
            const parentNodeInstance = nds.find(n => n.id === currentNode.parentId);
            // get parents absolute position in html view
            // const parentHTMLPosTranslation = reactFlowInstance.current.screenToFlowPosition({x: parentNodeInstance.position.x + parentNodeInstance.style.width, y: parentNodeInstance.position.y + parentNodeInstance.style.height});
            // console.log("parentHTMLPosTranslation", parentHTMLPosTranslation);
            currentNode.position = {x: parentNodeInstance.position.x + currentNode.position.x, y: parentNodeInstance.position.y + currentNode.position.y}
            currentNode.data.position = currentNode.position;
            delete currentNode.parentId;
            delete currentNode.data.parentNodeId;
          }
        }
        else{
          // const nonGroupOrSelectedNodes = intersections.filter((n) => !n.data.isGroup).filter((n) => remainingNodes.map((n) => n.id).includes(n.id));
          // find the lowest level group node, i.e.: that is closese to tree leafs
          const nonGroupParentNodes = findLowestNodes(groupNodes);
          
          // if no group nodes are found then continue
          if (nonGroupParentNodes.length !== 0) {
            // pick the first one
            const parent = nonGroupParentNodes[0];

            if (parent && currentNode.parentId !== parent.id) {
              // check if parent is a group node
              if (parent.type === 'GroupNode') {
                currentNode.parentId = parent.id;
                currentNode.data.parentNodeId = parent.id;
                currentNode.position = {x: currentNode.position.x - parent.position.x, y: currentNode.position.y - parent.position.y}
                currentNode.data.position = currentNode.position;
              }
            }
          }
        }
        

        updatesNodes.push(currentNode);

        // // if current node is group node the assign nodeGroup Nodes parent as current node
        // if (currentNode.data.isGroup) {

        //   // add parent id and add to updated nodes
        //   for (let i = 0; i < nonGroupOrSelectedNodes.length; i++) {
        //     const n = nonGroupOrSelectedNodes[i];
        //     n.parentId = currentNode.id;
        //     n.parentNode = currentNode.id;
        //     n.data.parentNodeId = currentNode.id;
        //     n.position = {x: n.position.x - currentNode.position.x, y: n.position.y - currentNode.position.y}
        //     n.data.position = n.position;
        //     updatesNodes.push(n);
        //   }

        //   // remove them from remaining nodes
        //   remainingNodes = remainingNodes.filter((n) => !nonGroupOrSelectedNodes.map((n) => n.id).includes(n.id));
        // }
      }

      // add remaining nodes
      updatesNodes = updatesNodes.concat(remainingNodes);
      updatesNodes = sortNodes(updatesNodes);

      console.log("updated", updatesNodes);

      memory.nodes = updatesNodes;
      saveWorkflow(memory);
      return updatesNodes;
    });
  }, [nodes, selectedNodes]);
  
  // Add this function to your component
  const updateNodeDimensions = (nodeId, width, height) => {
    // console.log("here..")
    
    setNodes((nds) => {
      var updatedNodes = nds.map((n) => {
        if (n.id === nodeId) {
          return {
            ...n,
            data: {
              ...n.data,
              width,
              height
            },
            style: {
              ...n.style,
              width,
              height
            }
          };
        }
        return n;
      });
      
      memory.nodes = updatedNodes;
      saveWorkflow();
      return updatedNodes;
    });
  };

  const onEdgesChange = (changes) => {
    setEdges((eds) => {
      const updatedEdges = applyEdgeChanges(changes, eds);
  
      // Update memory with the new edges
      memory.edges = updatedEdges;
  
      return updatedEdges;
    });
  };

  const onSelectionChange = (selection) => {
    setSelectedNodes(selection.nodes);
    setSelectedEdges(selection.edges);
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

  // Handle node double-click for editing
  const onNodeDoubleClick = (event, node) => {
    event.stopPropagation();
    setEditingNode(node);
    setNodePosition(node.position);
    setShowNodeModal(true);
    setSelectedEdges([]);
    setSelectedNodes([]); 
  };

  // Handle background click to close properties panel
  const onPaneClick = (event) => {

    // stop prop...
    event.stopPropagation();
    // If shift key is pressed, create a new node
    if (event.shiftKey && reactFlowInstance) {
      const position = {
        x: event.clientX - memory.viewport.x,
        y: event.clientY - memory.viewport.y
      };
      setNodePosition(position);
      setShowNodeModal(true);
      return;
    }
    
    setSelectedNodes([]);
    setSelectedEdges([]);
    setEditingNode(null);
  };

  return (
    <ReactFlowProvider>
      <div style={{ height: '100vh', width: '100vw' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeDragStop={onNodeDragStop}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onNodeDoubleClick={onNodeDoubleClick}
        onPaneClick={onPaneClick}
        onInit={onLoad}
        onMoveEnd={onMoveEnd}
        onSelectionChange={onSelectionChange}
        defaultViewport={viewport}
      >
        <Background />
        <MiniMap />
        <Controls />
        <FlowUtilsProvider />
      {showNodeModal && <NodeCreationModal
          nodePosition={nodePosition}
          setShowNodeModal={setShowNodeModal}
          setNodes={setNodes}
          memory={memory}
          saveWorkflow={saveWorkflow}
          editingNode={editingNode}
          setEditingNode={setEditingNode}
      />}
      </ReactFlow>
      </div>
      </ReactFlowProvider>
  );
}