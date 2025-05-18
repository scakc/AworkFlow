import json
from pathlib import Path

class BaseNode:
    def __init__(self, id: str, name: str, description: str = ""):
        self.id = id
        self.name = name
        self.description = description

    def __repr__(self):
        return f"BaseNode(id={self.id}, name={self.name})"

class BaseEdge:
    def __init__(self, source: str, target: str):
        self.source = source
        self.target = target

    def __repr__(self):
        return f"BaseEdge(source={self.source}, target={self.target})"

def load_workflow_from_file(path: str):
    p = Path(path)
    if not p.exists():
        raise FileNotFoundError(f"Workflow file not found: {path}")

    with p.open("r", encoding="utf-8") as f:
        data = json.load(f)

    nodes = []
    for n in data.get("nodes", []):
        node = BaseNode(id=n["id"], name=n["name"], description=n.get("description", ""))
        nodes.append(node)

    edges = []
    for e in data.get("edges", []):
        edge = BaseEdge(source=e["source"], target=e["target"])
        edges.append(edge)

    return {
        "nodes": nodes,
        "edges": edges
    }
