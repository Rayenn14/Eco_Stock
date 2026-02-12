"""
Detecteur YOLO pour ingredients
===============================
"""

import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

import numpy as np
from typing import List, Dict, Any
from pathlib import Path


class YOLODetector:
    """Detecteur YOLO pour ingredients visibles."""

    def __init__(self, model_path: str, device: str = 'auto'):
        """
        Args:
            model_path: Chemin vers le modele YOLO (.pt)
            device: 'cuda', 'cpu' ou 'auto'
        """
        from ultralytics import YOLO
        import torch

        self.model_path = Path(model_path)

        if not self.model_path.exists():
            raise FileNotFoundError(f"Modele YOLO non trouve: {model_path}")

        # Determiner le device
        if device == 'auto':
            device = 'cuda' if torch.cuda.is_available() else 'cpu'

        self.device = device
        self.model = YOLO(str(model_path))

        # Classes detectees
        self.classes = ['tomate', 'oignon', 'ail', 'carotte', 'pomme_de_terre', 'oeuf', 'poulet']

    def detect(self, image: np.ndarray, conf: float = 0.5) -> List[Dict[str, Any]]:
        """
        Detecte les ingredients dans une image.

        Args:
            image: Image numpy (BGR)
            conf: Seuil de confiance minimum

        Returns:
            Liste de detections avec: name, confidence, bbox
        """
        results = self.model.predict(image, conf=conf, verbose=False, device=self.device)

        detections = []
        for result in results:
            for box in result.boxes:
                class_id = int(box.cls[0])
                confidence = float(box.conf[0])
                bbox = box.xyxy[0].tolist()

                # Nom de la classe
                if class_id < len(self.classes):
                    name = self.classes[class_id]
                else:
                    name = f"classe_{class_id}"

                detections.append({
                    'name': name,
                    'confidence': confidence,
                    'bbox': bbox,
                    'source': 'yolo'
                })

        return detections

    def get_annotated_image(self, image: np.ndarray, conf: float = 0.5) -> np.ndarray:
        """Retourne l'image avec les annotations YOLO."""
        results = self.model.predict(image, conf=conf, verbose=False, device=self.device)
        return results[0].plot()
