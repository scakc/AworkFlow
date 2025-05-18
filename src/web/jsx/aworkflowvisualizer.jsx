import React, { useState, useEffect } from "react";
import ReactFlow, {
  applyNodeChanges,
  applyEdgeChanges,
  Background,
} from "reactflow";
import "reactflow/dist/style.css";

export default function WorkflowVisualizer() {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  const memory = {
    nodes: [],
    edges: [],
  };

  // Expose reference to the window object
  useEffect(() => {
    window.setWorkflowVisualizerRef({
      loadWorkflow, 
      getWorkflow,
    });
  }, []);

  // Function to load workflow data
  const loadWorkflow = (data) => {
    // Map nodes
    const loadedNodes = data.nodes.map((n, index) => ({
      id: n.id,
      data: { label: `${n.name}\n${n.description}` },
      position: { x: index * 200, y: 100 },
    }));

    // Map edges
    const loadedEdges = data.edges.map((e) => ({
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

  const getWorkflow = () => {
    return {
      nodes: memory.nodes.map((n) => ({
        id: n.id,
        name: n.data.label.split("\n")[0],
        description: n.data.label.split("\n")[1],
      })),
      edges: memory.edges.map((e) => ({
        source: e.source,
        target: e.target,
      })),
    }
  };

  const onNodesChange = (changes) => {
    setNodes((nds) => {
      const updatedNodes = applyNodeChanges(changes, nds);
  
      // Update memory with the new node positions
      memory.nodes = updatedNodes;
  
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

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Background />
      </ReactFlow>
    </div>
  );
}
