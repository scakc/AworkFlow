// Cytoscape style configuration
const cytoscapeConfig = {
    style: [
        {
            selector: 'node',
            style: {
                'background-color': '#6FB1FC',
                'label': 'data(label)',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 100,
                'height': 60,
                'shape': 'roundrectangle',
                'border-width': 1,
                'border-color': '#000',
                'font-size': 12
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 2,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier',
                'label': 'data(label)',
                'font-size': 10,
                'text-rotation': 'autorotate',
                'text-margin-y': -10
            }
        },
        {
            selector: ':selected',
            style: {
                'background-color': '#ff7f00',
                'border-width': 3,
                'border-color': '#ff7f00'
            }
        },
        {
            selector: '.edge-source',
            style: {
              'border-color': '#00ff00'  // Highlight source node when drawing edge
            }
        }
    ],    
    layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
    }
};
