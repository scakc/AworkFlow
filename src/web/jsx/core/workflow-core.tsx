// workflow-core.ts
export class BaseNode {
  id: string;
  label: string;
  position?: { x: number; y: number };

  constructor(id: string, label: string, position?: { x: number; y: number }) {
    this.id = id;
    this.label = label;
  }

  get_data() {
    return {
      id: this.id,
      label: this.label,
      position: this.position
    };
  }
}

export class BaseEdge {
  source: string;
  target: string;

  constructor(source: string, target: string) {
    this.source = source;
    this.target = target;
  }

  get_data() {
    return {
      source: this.source,
      target: this.target
    };
  }
}

export class BaseWorkflow {
  nodes: BaseNode[];
  edges: BaseEdge[];

  constructor(nodes: BaseNode[], edges: BaseEdge[]) {
    this.nodes = nodes;
    this.edges = edges;
  }

  get_data() {
    return {
      nodes: this.nodes.map(node => node.get_data()),
      edges: this.edges.map(edge => edge.get_data())
    };
  }
}
