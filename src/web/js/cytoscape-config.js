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
                'border-width': 2,
                'border-color': '#000',
                'font-size': 12
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
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
                'line-color': '#ff7f00',
                'target-arrow-color': '#ff7f00',
                'source-arrow-color': '#ff7f00',
                'border-width': 3,
                'border-color': '#ff7f00'
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
