// NodeCreationModal.jsx
import React, { useState, useEffect } from 'react';
import { getNodeUISchema, getAvailableNodeTypes, nodeClasses } from './core/workflow-factory';

const NodeCreationModal = ({ 
  nodePosition, 
  setShowNodeModal, 
  setNodes, 
  memory, 
  saveWorkflow,
  editingNode,
  setEditingNode
}) => {
    const [nodeType, setNodeType] = useState(editingNode ? editingNode.data.class : "DescriptionNode");
    const [formValues, setFormValues] = useState({});
    const [uiSchema, setUISchema] = useState({ fields: {} });
    
    // Add this function if it's not already defined
    const handleFieldChange = (fieldName, value) => {
    setFormValues(prev => ({
        ...prev,
        [fieldName]: value
    }));
    };

    // Get available node types
    const nodeTypes = getAvailableNodeTypes();
  
    // Update UI schema when node type changes or when editing an existing node
    useEffect(() => {
    const schema = getNodeUISchema(nodeType);
    setUISchema(schema);
    
    // Initialize form values with defaults or existing values
    const initialValues = {};
    
    // If editing a node, preserve all existing values first
    if (editingNode) {
        // Copy all existing data properties
        Object.keys(editingNode.data).forEach(key => {
        if (key !== 'class') { // Skip the class property
            initialValues[key] = editingNode.data[key];
        }
        });
    }
    
    // Then set default values for any fields in the schema that don't have values
    Object.keys(schema.fields).forEach(fieldName => {
        if (initialValues[fieldName] === undefined) {
        initialValues[fieldName] = '';
        }
    });
    
    setFormValues(initialValues);
    }, [nodeType, editingNode]);

    const handleSaveNode = () => {
        // Create data object with form values
        const data = { 
            ...formValues,
            class: nodeType 
        };

        // Get style based on node type and status
        console.log("check nodeclass", nodeClasses, nodeType, data.status)
        const style = nodeClasses[nodeType].getNodeStyle(data.status);

        if (editingNode) {
            // Update existing node
            setNodes(currentNodes => {
                const updatedNodes = currentNodes.map(node => {
                    if (node.id === editingNode.id) {
                    return {
                        ...node,
                        data: { ...node.data, ...data },
                        style: style // Add style here
                    };
                    }
                    return node;
                });
                
                // Update memory.nodes but don't save yet
                memory.nodes = updatedNodes;
                return updatedNodes;
            });
        } else {
            // Create new node
            const newId = `node_${Date.now()}`;
            const newNode = {
                id: newId,
                data: data,
                position: nodePosition,
                type: 'default',
                sourcePosition: 'right',
                targetPosition: 'left',
                style: style
            };

            setNodes(currentNodes => {
                const updatedNodes = [...currentNodes, newNode];
                memory.nodes = updatedNodes;
                return updatedNodes;
            });
        }

        // Close modal
        setShowNodeModal(false);
        if (editingNode) {
            setEditingNode(null);
        }

        saveWorkflow();
    };

    // Render field based on its type
    const renderField = (fieldName, fieldConfig) => {
        const { type, label, required } = fieldConfig;
        
        switch (type) {
        case 'textarea':
            return (
            <div key={fieldName}>
                <label>{label}:</label>
                <textarea 
                value={formValues[fieldName] || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                required={required}
                />
            </div>
            );
        case 'select':
            return (
                <div key={fieldName}>
                <label>{label}:</label>
                <select
                    value={formValues[fieldName] || ''}
                    onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                    required={required}
                >
                    {fieldConfig.options.map(option => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                    ))}
                </select>
                </div>
            );
        case 'text':
        default:
            return (
            <div key={fieldName}>
                <label>{label}:</label>
                <input 
                type="text" 
                value={formValues[fieldName] || ''}
                onChange={(e) => handleFieldChange(fieldName, e.target.value)}
                required={required}
                />
            </div>
            );
        }
    };

    return (
    <div className="node-creation-modal" style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '5px',
      boxShadow: '0 0 10px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}>
      <h3>{editingNode ? 'Edit Node' : 'Create New Node'}</h3>
      
      {/* Only show node type selector when creating a new node */}
        <div>
            <label>Node Type:</label>
            <select 
            value={nodeType} 
            onChange={(e) => setNodeType(e.target.value)}
            >
            {nodeTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
            ))}
            </select>
        </div>
      
      {/* Render fields based on UI schema */}
      {Object.entries(uiSchema.fields || {}).map(([fieldName, fieldConfig]) => 
        renderField(fieldName, fieldConfig)
      )}
      
      <div style={{ marginTop: '10px' }}>
        <button onClick={handleSaveNode}>
          {editingNode ? 'Update' : 'Create'}
        </button>
        <button 
          onClick={() => {
            setShowNodeModal(false);
            if (editingNode) {
              setEditingNode(null);
            }
          }}
          style={{ marginLeft: '10px', backgroundColor: '#ccc' }}
        >
          Cancel
        </button>
      </div>
    </div>
    );
};

export default NodeCreationModal;
