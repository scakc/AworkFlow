// workflow-factory.ts
import { BaseNode, BaseEdge, BaseWorkflow } from './workflow-core';
import { DescriptionNode } from './basic-nodes';

// Registry of available node classes
const nodeClasses: { [key: string]: any } = {
  'BaseNode': BaseNode,
  'DescriptionNode': DescriptionNode
};

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
