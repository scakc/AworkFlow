import React, { useState } from "react";
import ReactFlow, { applyNodeChanges, applyEdgeChanges } from "reactflow";
import "reactflow/dist/style.css";

export default function TestDraggable() {
  const [nodes, setNodes] = useState([
    { id: "1", data: { label: "A" }, position: { x: 0, y: 0 } },
    { id: "2", data: { label: "B" }, position: { x: 100, y: 100 } },
  ]);
  const [edges, setEdges] = useState([]);

  const onNodesChange = (changes) => setNodes((nds) => applyNodeChanges(changes, nds));
  const onEdgesChange = (changes) => setEdges((eds) => applyEdgeChanges(changes, eds));

  return (
    <div style={{ width: "100%", height: "400px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      />
    </div>
  );
}
