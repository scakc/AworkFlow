from typing import Dict, List, Any, Optional, Set
import json
import uuid


class Node:
    """Base class for workflow nodes."""
    
    def __init__(self, node_id: str = None, label: str = None, **properties):
        self.id = node_id or str(uuid.uuid4())
        self.label = label or "Node"
        self.properties = properties
        self.incoming_edges = set()
        self.outgoing_edges = set()
        # Placeholder for connection points - not actively used in this visualization
        self.connection_points = {"left": None, "right": None} 
    
    def add_property(self, key: str, value: Any) -> None:
        """Add or update a property."""
        self.properties[key] = value
    
    def get_property(self, key: str, default: Any = None) -> Any:
        """Get a property value."""
        return self.properties.get(key, default)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert node to dictionary for serialization."""
        return {
            "id": self.id,
            "label": self.label,
            "type": self.__class__.__name__,
            "properties": self.properties
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Node':
        """Create a node from dictionary data."""
        node_id = data.get("id")
        label = data.get("label")
        properties = data.get("properties", {})
        return cls(node_id=node_id, label=label, **properties)


class Edge:
    """Class representing a connection between nodes."""
    
    def __init__(self, edge_id: str = None, source_id: str = None, target_id: str = None, 
                 label: str = None, source_endpoint: str = "0 0.5", target_endpoint: str = "1 0.5", 
                 **properties):
        self.id = edge_id or str(uuid.uuid4())
        self.source_id = source_id
        self.target_id = target_id
        self.label = label or ""
        self.source_endpoint = source_endpoint  # Default to left side of source node
        self.target_endpoint = target_endpoint  # Default to right side of target node
        self.properties = properties
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert edge to dictionary for serialization."""
        return {
            "id": self.id,
            "source": self.source_id,
            "target": self.target_id,
            "label": self.label,
            "sourceEndpoint": self.source_endpoint,
            "targetEndpoint": self.target_endpoint,
            "properties": self.properties
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Edge':
        """Create an edge from dictionary data."""
        return cls(
            edge_id=data.get("id"),
            source_id=data.get("source"),
            target_id=data.get("target"),
            label=data.get("label", ""),
            source_endpoint=data.get("sourceEndpoint", "0 0.5"),
            target_endpoint=data.get("targetEndpoint", "1 0.5"),
            **data.get("properties", {})
        )


class Graph:
    """Class representing a workflow graph."""
    
    def __init__(self, name: str = "Workflow"):
        self.name = name
        self.nodes: Dict[str, Node] = {}
        self.edges: Dict[str, Edge] = {}
    
    def add_node(self, node: Node) -> Node:
        """Add a node to the graph."""
        self.nodes[node.id] = node
        return node
    
    def add_edge(self, edge: Edge) -> Edge:
        """Add an edge to the graph."""
        self.edges[edge.id] = edge
        
        # Update node connections
        if edge.source_id in self.nodes:
            self.nodes[edge.source_id].outgoing_edges.add(edge.id)
        if edge.target_id in self.nodes:
            self.nodes[edge.target_id].incoming_edges.add(edge.id)
            
        return edge
    
    def connect(self, source: Node, target: Node, label: str = None, **properties) -> Edge:
        """Connect two nodes with an edge."""
        edge = Edge(source_id=source.id, target_id=target.id, label=label, **properties)
        return self.add_edge(edge)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert graph to dictionary for serialization."""
        return {
            "name": self.name,
            "nodes": [node.to_dict() for node in self.nodes.values()],
            "edges": [edge.to_dict() for edge in self.edges.values()]
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'Graph':
        """Create a graph from dictionary data."""
        graph = cls(name=data.get("name", "Workflow"))
        
        # Add nodes first
        for node_data in data.get("nodes", []):
            node = Node.from_dict(node_data)
            graph.add_node(node)
        
        # Then add edges
        for edge_data in data.get("edges", []):
            edge = Edge.from_dict(edge_data)
            graph.add_edge(edge)
            
        return graph
    
    def save(self, filepath: str) -> None:
        """Save the workflow to a .awf.json file."""
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    @classmethod
    def load(cls, filepath: str) -> 'Graph':
        """Load a workflow from a .awf.json file."""
        with open(filepath, 'r') as f:
            data = json.load(f)
        return cls.from_dict(data)