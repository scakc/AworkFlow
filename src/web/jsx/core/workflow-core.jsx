// workflow-core.jsx
export class BaseNode {
  constructor(id, label, position, width, height) {
    this.id = id;
    this.label = label;
    this.position = position;
    this.width = width || null;
    this.height = height || null;
    this.parentNodeId = null;
  }

  static getUISchema() {
    return {
      fields: {
        label: { type: 'text', label: 'Name', required: true }
      }
    };
  }

  // Define style for DescriptionNode
  getNodeStyle() {
    var ret_data = { backgroundColor: '#FFFFFF' }; 
    if (this.width) {
      ret_data.width = this.width;
    }

    if (this.height) {
      ret_data.height = this.height;
    }

    return ret_data;
  }
  
  get_data() {

    var ret_data = {
      id: this.id,
      label: this.label,
      position: this.position,
      class: this.constructor.name,
      style: this.getNodeStyle()
    };

    if (this.width) {
      ret_data.width = this.width;
    }

    if (this.height) {
      ret_data.height = this.height;
    }
    
    if (this.parentNodeId){
      ret_data.parentNodeId = this.parentNodeId;
    }

    return ret_data;
  }
}

export class BaseEdge {
  constructor(source, target) {
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
  constructor(nodes, edges, viewport) {
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
