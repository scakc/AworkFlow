import { BaseNode } from './workflow-core';

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

  get_data() {
    // Get all properties except those from BaseNode
    const { id, label, position, ...additionalProps } = this;
    
    return {
      ...super.get_data(),
      ...additionalProps,
      description: this.description,
      class: 'DescriptionNode'
    };
  }
}
