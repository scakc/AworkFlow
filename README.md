# AWF - Advanced Workflow Framework

A framework for defining, visualizing, and editing workflow graphs.

## Features

- Python-based workflow definition with Node, Edge, and Graph classes
- JSON serialization to .awf.json format
- Web-based workflow editor and visualizer
- Interactive graph editing capabilities

## Getting Started

1. Define workflow components in Python using the core classes
2. Create workflow graphs programmatically or using the web editor
3. Save and load workflows in .awf.json format

## Usage

### Python API

```python
from src.workflow.core import Node, Edge, Graph

# Create a workflow
graph = Graph(name="My Workflow")

# Add nodes
start = graph.add_node(Node(label="Start"))
process = graph.add_node(Node(label="Process Data"))
end = graph.add_node(Node(label="End"))

# Connect nodes
graph.connect(start, process, label="Next")
graph.connect(process, end, label="Complete")

# Save workflow
graph.save("my_workflow.awf.json")
