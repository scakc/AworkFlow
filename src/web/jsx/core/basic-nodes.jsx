import { BaseNode } from './workflow-core';
// Add this import at the top of your basic-nodes.jsx file
import React from 'react';
import { Handle, Position, NodeResizer } from 'reactflow';


// Add this to basic-nodes.jsx
export class StatusNode extends BaseNode {
  constructor(id, label, status = 'NotStarted', props = {}) {
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
  getNodeStyle() {
    var currentStatus = this.status;
    var ret_data = {};
    switch (currentStatus) {
      case 'InProgress':
        ret_data = { backgroundColor: '#FFE082' }; // Pastel amber
        break;
      case 'Blocked':
        ret_data = { backgroundColor: '#EF9A9A' }; // Pastel red
        break;
      case 'Completed':
        ret_data = { backgroundColor: '#A5D6A7' }; // Pastel green
        break;
      default:
        ret_data = { backgroundColor: '#E0E0E0' }; // Pastel gray (Not Started)
    }

    if (this.width) {
      ret_data.width = this.width;
    }

    if (this.height) {
      ret_data.height = this.height;
    }

    return ret_data;
  }
  
  get_data() {
    return {
      ...super.get_data(),
      status: this.status,
      class: 'StatusNode',
      style: this.getNodeStyle(this.status)
    };
  }
}

export class DescriptionNode extends BaseNode {
  constructor(id, label, description, props = {}) {
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
  getNodeStyle() {
    var ret_data = { backgroundColor: '#A2BFFE' }; // Light Blue
    
    if (this.width) {
      ret_data.width = this.width;
    }

    if (this.height) {
      ret_data.height = this.height;
    }

    return ret_data;
  }

  get_data() {
    // Get all properties except those from BaseNode
    const { id, label, position, ...additionalProps } = this;
    
    return {
      ...super.get_data(),
      ...additionalProps,
      description: this.description,
      class: this.constructor.name,
      style: this.getNodeStyle(this)
    };
  }
}

export class GroupNode extends BaseNode {
  constructor(id, label, props = {}) {
    const { position, width = 300, height = 200, ...otherProps } = props;
    super(id, label, position);
    this.width = width;
    this.height = height;
    this.children = []; // IDs of child nodes
    
    // Add any additional properties
    Object.assign(this, otherProps);
  }
  
  // Override UI schema to add group-specific fields
  static getUISchema() {
    return {
      fields: {
        ...BaseNode.getUISchema().fields
      }
    };
  }

  // Define style for GroupNode
  getNodeStyle() {
    var ret_data = { 
      backgroundColor: 'rgba(240, 240, 240, 0.7)',
      border: '1px solid #ddd',
      borderRadius: '5px',
      padding: '10px',
      zIndex: -1 // Ensure group nodes are rendered below other nodes
    };

    if (this.width) {
      ret_data.width = this.width;
    }

    if (this.height) {
      ret_data.height = this.height;
    }

    return ret_data;
  }
  
  get_data() {
    return {
      ...super.get_data(),
      width: this.width,
      height: this.height,
      children: this.children,
      class: 'GroupNode',
      isGroup: true,
      type: 'GroupNode',
      style: this.getNodeStyle()
    };
  }
}

// Add this component at the end of your basic-nodes.jsx file
export const ResizableGroupNode = ({ id, data, selected }) => {

  const nodeResizeHandler = (evt, params) => {
    // Update node dimensions in your state
    const { width, height } = params;
    window.handleResizeNode(id, width, height);
  };

  return (
    <>
      <NodeResizer 
        minWidth={200}
        minHeight={150}
        isVisible={selected}
        zIndex={-1}
        onResize={nodeResizeHandler}
        onResizeEnd={nodeResizeHandler}
      />
      <div style={{ 
        height: '100%',
        backgroundColor: data.style?.backgroundColor || 'rgba(240, 240, 240, 0.7)',
        border: data.style?.border || '1px solid #ddd',
        borderRadius: data.style?.borderRadius || '5px'
      }}>
        <div style={{ fontWeight: 'bold', marginBottom: '8px' }}>
          {data.label}
        </div>
        <Handle type="target" position={Position.Left} />
        <Handle type="source" position={Position.Right} />
      </div>
    </>
  );
};

export const customMap = {
  'GroupNode': ResizableGroupNode
};