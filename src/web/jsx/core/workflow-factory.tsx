// workflow-factory.ts
import { BaseNode, BaseEdge, BaseWorkflow } from './workflow-core';
import { DescriptionNode, StatusNode } from './basic-nodes';

// Registry of available node classes
export const nodeClasses: { [key: string]: any } = {
  'BaseNode': BaseNode,
  'DescriptionNode': DescriptionNode,
  'StatusNode': StatusNode
};

// Add this function to get UI schema for a node type
export function getNodeUISchema(nodeType: string) {
  const NodeClass = nodeClasses[nodeType] || BaseNode;
  return NodeClass.getUISchema();
}

// Add this function to get all available node types
export function getAvailableNodeTypes() {
  return [
    { value: 'BaseNode', label: 'BaseNode' },
    { value: 'DescriptionNode', label: 'DescriptionNode' },
    { value: 'StatusNode', label: 'StatusNode' }
  ];
}

export function createNodeFromData(nodeData: any): BaseNode {
  const className = nodeData.class || 'BaseNode';
  const NodeClass = nodeClasses[className] || BaseNode;
  
  // Create a base instance with required id and label
  const node = new NodeClass(nodeData.id, nodeData.label || '');
  
  // Copy all properties from nodeData to the node instance
  Object.assign(node, nodeData);
  
  return node;
}


export function createWorkflowFromData(data: any): BaseWorkflow {
  const nodes = data.nodes.map((nodeData: any) => createNodeFromData(nodeData));
  const edges = data.edges.map((edgeData: any) => new BaseEdge(edgeData.source, edgeData.target));
  
  return new BaseWorkflow(nodes, edges, data.viewport);
}
