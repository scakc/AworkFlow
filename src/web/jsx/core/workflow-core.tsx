// workflow-core.ts
export class BaseNode {
  id: string;
  label: string;
  position?: { x: number; y: number };

  constructor(id: string, label: string, position?: { x: number; y: number }) {
    this.id = id;
    this.label = label;
    this.position = position;
  }

  static getUISchema() {
    return {
      fields: {
        label: { type: 'text', label: 'Name', required: true }
      }
    };
  }

  // Define style for DescriptionNode
  static getNodeStyle(data: any) {
    return { backgroundColor: '#E0E0E0' }; // Light gray
  }
  
  get_data() {
    return {
      id: this.id,
      label: this.label,
      position: this.position,
      class: this.constructor.name,
      style: (this.constructor as typeof BaseNode).getNodeStyle(this)
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
  viewport?: { x: number; y: number; zoom: number };

  constructor(nodes: BaseNode[], edges: BaseEdge[], viewport?: { x: number; y: number; zoom: number }) {
    this.nodes = nodes;
    this.edges = edges;
    this.viewport = viewport;
  }

  get_data() {
    return {
      nodes: this.nodes.map(node => node.get_data()),
      edges: this.edges.map(edge => edge.get_data()),
      viewport: this.viewport
    };
  }
}
