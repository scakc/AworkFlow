// workflow-factory.jsx
import { BaseNode, BaseEdge, BaseWorkflow } from './workflow-core';
import { DescriptionNode, StatusNode, GroupNode } from './basic-nodes';

// Registry of available node classes
export const nodeClasses = {
  'BaseNode': BaseNode,
  'DescriptionNode': DescriptionNode,
  'StatusNode': StatusNode,
  'GroupNode': GroupNode
};

// Add this function to get UI schema for a node type
export function getNodeUISchema(nodeType) {
  const NodeClass = nodeClasses[nodeType] || BaseNode;
  return NodeClass.getUISchema();
}

// Add this function to get all available node types
export function getAvailableNodeTypes() {
  return [
    { value: 'BaseNode', label: 'BaseNode' },
    { value: 'DescriptionNode', label: 'DescriptionNode' },
    { value: 'StatusNode', label: 'StatusNode' },
    { value: 'GroupNode', label: 'GroupNode' },
    { value: 'ResizableGroupNode', label: 'GroupNode' },
  ];
}

export function createNodeFromData(nodeData) {
  const className = nodeData.class || 'BaseNode';
  const NodeClass = nodeClasses[className] || BaseNode;
  
  // Create a base instance with required id and label
  const node = new NodeClass(nodeData.id, nodeData.label || '');
  
  // Copy all properties from nodeData to the node instance
  Object.assign(node, nodeData);
  
  return node;
}

export function createWorkflowFromData(data) {
  const nodes = data.nodes.map((nodeData) => createNodeFromData(nodeData));
  const edges = data.edges.map((edgeData) => new BaseEdge(edgeData.source, edgeData.target));
  
  return new BaseWorkflow(nodes, edges, data.viewport);
}
