{
  "name": "SlideHeatmapSchema",
  "schema": {
    "type": "object",
    "properties": {
      "slide_heatmap": {
        "type": "object",
        "properties": {
          "slides": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "number": {
                  "type": "number",
                  "description": "スライド番号"
                },
                "title": {
                  "type": "string",
                  "description": "スライドのタイトル"
                },
                "improvement_count": {
                  "type": "number",
                  "description": "改善点の数"
                },
                "priority": {
                  "type": "string",
                  "description": "スライドの優先度"
                },
                "issues": {
                  "type": "array",
                  "items": {
                    "type": "string"
                  },
                  "description": "改善点のリスト"
                }
              },
              "required": ["number", "title", "improvement_count", "priority", "issues"]
            }
          }
        },
        "required": ["slides"]
      }
    },
    "required": ["slide_heatmap"]
  }
}

{
  "name": "StructureFlowSchema",
  "schema": {
    "type": "object",
    "properties": {
      "structure_flow": {
        "type": "object",
        "properties": {
          "nodes": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "id": {
                  "type": "string",
                  "description": "一意のID"
                },
                "type": {
                  "type": "string",
                  "enum": ["section", "subsection"],
                  "description": "ノードの種類"
                },
                "label": {
                  "type": "string",
                  "description": "セクション名"
                },
                "health_score": {
                  "type": "number",
                  "minimum": 0,
                  "maximum": 100,
                  "description": "健全性スコア"
                }
              },
              "required": ["id", "type", "label", "health_score"]
            }
          },
          "edges": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "from": {
                  "type": "string",
                  "description": "開始ノードID"
                },
                "to": {
                  "type": "string",
                  "description": "終了ノードID"
                },
                "type": {
                  "type": "string",
                  "enum": ["contains", "follows"],
                  "description": "エッジの種類"
                }
              },
              "required": ["from", "to", "type"]
            }
          },
          "improvements": {
            "type": "array",
            "items": {
              "type": "object",
              "properties": {
                "node_id": {
                  "type": "string",
                  "description": "対象ノードID"
                },
                "issue": {
                  "type": "string",
                  "description": "改善が必要な内容"
                },
                "priority": {
                  "type": "string",
                  "enum": ["high", "medium", "low"],
                  "description": "優先度"
                }
              },
              "required": ["node_id", "issue", "priority"]
            }
          }
        },
        "required": ["nodes", "edges", "improvements"]
      }
    },
    "required": ["structure_flow"]
  }
}