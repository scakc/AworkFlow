class WorkflowEditor {
    constructor(containerId) {
        this.cy = cytoscape({
            container: document.getElementById(containerId),
            ...cytoscapeConfig
        });
        
        this.currentFile = null;
        this.selectedElement = null;
        this.edgeDrawMode = false;
        this.edgeSource = null;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // UI buttons
        document.getElementById('new-btn').addEventListener('click', () => this.newWorkflow());
        document.getElementById('open-btn').addEventListener('click', () => document.getElementById('file-input').click());
        document.getElementById('save-btn').addEventListener('click', () => this.saveWorkflow());
        document.getElementById('add-node-btn').addEventListener('click', () => this.addNodeMode());
        document.getElementById('add-edge-btn').addEventListener('click', () => this.toggleEdgeMode());
        document.getElementById('delete-btn').addEventListener('click', () => this.deleteSelected());
        
        // File input for opening files
        document.getElementById('file-input').addEventListener('change', (event) => {
            const file = event.target.files[0];
            if (file) {
                this.openWorkflow(file);
            }
        });
        
        // Cytoscape events
        this.cy.on('tap', (event) => {
            if (event.target === this.cy) {
                // Click on background
                if (this.edgeDrawMode) {
                    this.cancelEdgeMode();
                } else {
                    this.clearSelection();
                }
            }
        });
        
        this.cy.on('tap', 'node', (event) => {
            const node = event.target;
            
            if (this.edgeDrawMode) {
                if (this.edgeSource) {
                    // Complete edge drawing
                    this.addEdge(this.edgeSource, node);
                    this.cancelEdgeMode(); 
                } else {
                    // Start edge drawing
                    this.edgeSource = node;
                    node.addClass('edge-source');
                }
            } else {
                this.selectElement(node);
            }
        });
        
        this.cy.on('tap', 'edge', (event) => {
            if (!this.edgeDrawMode) {
                this.selectElement(event.target);
            }
        });
    }
    
    newWorkflow() {
        if (confirm('Create a new workflow? Unsaved changes will be lost.')) {
            this.cy.elements().remove();
            this.currentFile = null;
            this.clearSelection();
        }
    }
    
    openWorkflow(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.loadWorkflow(data);
                this.currentFile = file;
            } catch (error) {
                alert('Error loading workflow: ' + error.message);
            }
        };
        reader.readAsText(file);
    }
    
    saveWorkflow() {
        const data = this.exportWorkflow();
        const json = JSON.stringify(data, null, 2);
        
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = this.currentFile ? this.currentFile.name : 'workflow.awf.json';
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    loadWorkflow(data) {
        // Clear existing elements
        this.cy.elements().remove();
        
        // Add nodes
        (data.nodes || []).forEach(node => {
            this.cy.add({
                group: 'nodes',
                data: {
                    id: node.id,
                    label: node.label || 'Node',
                    type: node.type || 'Node',
                    properties: node.properties || {}
                },
                position: node.position || { 
                    x: Math.random() * 500, 
                    y: Math.random() * 500 
                }
            });
        });
        
        // Add edges
        (data.edges || []).forEach(edge => {
            this.cy.add({
                group: 'edges',
                data: {
                    id: edge.id,
                    source: edge.source,
                    target: edge.target,
                    label: edge.label || '',
                    properties: edge.properties || {}
                }
            });
        });
        
        // Apply layout
        this.cy.layout(cytoscapeConfig.layout).run();
    }
    
    exportWorkflow() {
        // Get node positions
        const nodes = this.cy.nodes().map(node => {
            const position = node.position();
            return {
                id: node.id(),
                label: node.data('label'),
                type: node.data('type') || 'Node',
                properties: node.data('properties') || {},
                position: {
                    x: position.x,
                    y: position.y
                }
            };
        });
        
        // Get edges
        const edges = this.cy.edges().map(edge => {
            return {
                id: edge.id(),
                source: edge.source().id(),
                target: edge.target().id(),
                label: edge.data('label') || '',
                properties: edge.data('properties') || {}
            };
        });
        
        return {
            name: "Workflow",
            nodes: nodes,
            edges: edges
        };
    }
    
    addNodeMode() {
        this.cancelEdgeMode();
        
        // Create a node at a random position
        const id = 'n' + Date.now();
        const node = this.cy.add({
            group: 'nodes',
            data: { 
                id: id, 
                label: 'New Node',
                type: 'Node',
                properties: {}
            },
            position: {
                x: this.cy.width() / 2,
                y: this.cy.height() / 2
            }
        });
        
        this.selectElement(node);
    }
    
    toggleEdgeMode() {
        this.edgeDrawMode = !this.edgeDrawMode;
        this.edgeSource = null;
        
        const btn = document.getElementById('add-edge-btn');
        if (this.edgeDrawMode) {
            btn.style.backgroundColor = '#ff7f00';
            btn.textContent = 'Cancel Edge';            
        } else {
            btn.style.backgroundColor = '';
            btn.textContent = 'Add Edge';            
        }
        
        this.cy.nodes().removeClass('edge-source');
    }
    
    cancelEdgeMode() {
        if (this.edgeDrawMode) {
            this.toggleEdgeMode();
        }
    }
    
    addEdge(source, target) {
        if (source.id() === target.id()) {
            return; // Don't allow self-loops for simplicity
        }
        
        const id = 'e' + Date.now();
        const edge = this.cy.add({
            group: 'edges',
            data: {
                id: id, 
                source: source.id(),
                target: target.id(),
                label: '',
                properties: {}
            }
        });
        
        this.selectElement(edge);
    }
    
    deleteSelected() {
        if (this.selectedElement) {
            this.cy.remove(this.selectedElement);
            this.clearSelection();
        }
    }
    
    selectElement(element) {
        this.clearSelection();
        this.selectedElement = element;       
        element.select();
        this.updatePropertiesPanel(element);
    }
    
    clearSelection() {
        this.cy.elements().unselect();
        this.selectedElement = null;
        this.updatePropertiesPanel(null);
    }
    
    updatePropertiesPanel(element) {
        const panel = document.getElementById('properties-content');
        
        if (!element) {
            panel.innerHTML = '<p>Select a node or edge to edit properties</p>';            
            return;
        }
        
        const isNode = element.isNode();
        const data = element.data();
        
        let html = `
            <div class="property-row">
                <label>ID</label>
                <input type="text" id="prop-id" value="${data.id}" readonly>
            </div>
            <div class="property-row">
                <label>Label</label>
                <input type="text" id="prop-label" value="${data.label || ''}">
            </div>
        `;
        
        if (isNode) {
            html += `
                <div class="property-row">
                    <label>Type</label>
                    <input type="text" id="prop-type" value="${data.type || 'Node'}">
                </div>
            `;
        }
        
        html += '<h4>Custom Properties</h4>';
        
        const properties = data.properties || {};
        Object.keys(properties).forEach(key => {
            html += `
                <div class="property-row" data-key="${key}">
                    <label>${key}</label>
                    <input type="text" value="${properties[key]}">
                    <button class="delete-prop">X</button>                    
                </div>
            `;
        });
        
        html += `
            <div class="property-row">
                <button id="add-prop-btn">Add Property</button>
            </div>
            <div class="property-row">                
                <button id="apply-props-btn">Apply Changes</button>
            </div>
        `;
        
        panel.innerHTML = html;
        
        // Add event listeners
        document.getElementById('apply-props-btn').addEventListener('click', () => {
            this.applyProperties(element);
        });
        
        document.getElementById('add-prop-btn').addEventListener('click', () => {
            this.addProperty();            
        });
                
        document.querySelectorAll('.delete-prop').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const row = e.target.closest('.property-row');
                row.remove();                
            });
        });
    }
    
    addProperty() {
        const key = prompt('Enter property name:');
        if (!key) return;
        
        const propertiesContent = document.getElementById('properties-content');
        const addPropBtn = document.getElementById('add-prop-btn').parentNode;
        
        const propertyRow = document.createElement('div');
        propertyRow.className = 'property-row';
        propertyRow.dataset.key = key;
        propertyRow.innerHTML = `
            <label>${key}</label>
            <input type="text" value="">
            <button class="delete-prop">X</button>
        `;        
        
        propertiesContent.insertBefore(propertyRow, addPropBtn);
        
        propertyRow.querySelector('.delete-prop').addEventListener('click', () => {
            propertyRow.remove();            
        });
    }
    
    applyProperties(element) {
        if (!element) return;
        
        const label = document.getElementById('prop-label').value;
        element.data('label', label);
        
        if (element.isNode()) {
            const type = document.getElementById('prop-type').value;
            element.data('type', type);
        }
        
        // Custom properties
        const properties = {};
        document.querySelectorAll('.property-row[data-key]').forEach(row => {
            const key = row.dataset.key;
            const value = row.querySelector('input').value;
            properties[key] = value;
        });
        
        element.data('properties', properties);
    }
}

// Initialize the editor when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.editor = new WorkflowEditor('cy');
});
