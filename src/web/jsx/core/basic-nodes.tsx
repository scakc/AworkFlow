import { BaseNode } from './workflow-core';

// Add this to basic-nodes.tsx
export class StatusNode extends BaseNode {
  status: string;
  
  constructor(id: string, label: string, status: string = 'NotStarted', props: Record<string, any> = {}) {
    const { position, ...otherProps } = props;
    super(id, label, position);
    this.status = status;
    
    // Add any additional properties
    Object.assign(this, otherProps);
  }
  
  // Override UI schema to add status field
  static getUISchema() {
    return {
      fields: {
        ...BaseNode.getUISchema().fields, // Inherit fields from BaseNode
        status: { 
          type: 'select', 
          label: 'Status', 
          required: true,
          options: [
            { value: 'NotStarted', label: 'NotStarted' },
            { value: 'InProgress', label: 'InProgress' },
            { value: 'Blocked', label: 'Blocked' },
            { value: 'Completed', label: 'Completed' }
          ]
        }
      }
    };
  }

  // Override getNodeStyle to return status-based colors
  static getNodeStyle(currentStatus: string) {
    switch (currentStatus) {
      case 'InProgress':
        return { backgroundColor: '#FFE082' }; // Pastel amber
      case 'Blocked':
        return { backgroundColor: '#EF9A9A' }; // Pastel red
      case 'Completed':
        return { backgroundColor: '#A5D6A7' }; // Pastel green
      default:
        return { backgroundColor: '#E0E0E0' }; // Pastel gray (Not Started)
    }
  }
  
  get_data() {
    return {
      ...super.get_data(),
      status: this.status,
      class: 'StatusNode',
      style: (this.constructor as typeof StatusNode).getNodeStyle(this.status)
    };
  }
}

export class DescriptionNode extends BaseNode {
  description: string;
  [key: string]: any; // Allow any additional properties

  constructor(id: string, label: string, description: string, props: Record<string, any> = {}) {
    const { position, ...otherProps } = props;
    super(id, label, position);
    this.description = description;
    
    // Add any additional properties
    Object.assign(this, otherProps);
  }

  // Override UI schema to add description field
  static getUISchema() {
    return {
      fields: {
        ...BaseNode.getUISchema().fields, // Inherit fields from BaseNode
        description: { type: 'textarea', label: 'Description', required: true }
      }
    };
  }

  // Define style for DescriptionNode
  static getNodeStyle(data: any) {
    return { backgroundColor: '#E0E0E0' }; // Light gray
  }

  get_data() {
    // Get all properties except those from BaseNode
    const { id, label, position, ...additionalProps } = this;
    
    return {
      ...super.get_data(),
      ...additionalProps,
      description: this.description,
      class: this.constructor.name,
      style: (this.constructor as typeof DescriptionNode).getNodeStyle(this)
    };
  }
}
