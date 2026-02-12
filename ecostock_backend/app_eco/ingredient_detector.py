"""
Detecteur d'Ingredients Principal
=================================
Combine YOLO + CNN + OCR avec logique de fusion
"""

import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional, Union
from PIL import Image

# Import des sous-modules
from .yolo_detector import YOLODetector
from .cnn_classifier import CNNClassifier
from .ocr_reader import OCRReader
from .fusion import FusionEngine


class IngredientDetector:
    """
    Detecteur d'ingredients multi-couche.

    Combine:
    - YOLO: Detection d'objets (tomate, oignon, ail, carotte, pomme_de_terre, oeuf, poulet)
    - CNN: Classification d'epices (paprika, poivre)
    - OCR: Lecture de texte sur emballages

    Usage:
        detector = IngredientDetector()
        results = detector.detect("image.jpg")
    """

    def __init__(
        self,
        yolo_model_path: Optional[str] = None,
        cnn_model_path: Optional[str] = None,
        use_ocr: bool = True,
        ocr_languages: List[str] = ['fr', 'en'],
        device: str = 'auto'
    ):
        """
        Initialise le detecteur.

        Args:
            yolo_model_path: Chemin vers le modele YOLO (.pt)
            cnn_model_path: Chemin vers le modele CNN (.pt)
            use_ocr: Activer l'OCR pour lire le texte
            ocr_languages: Langues pour l'OCR
            device: 'cuda', 'cpu' ou 'auto'
        """
        # Chemins par defaut - cherche d'abord dans app_eco/models/, sinon chemin original
        module_path = Path(__file__).parent
        base_path = module_path.parent

        if yolo_model_path is None:
            # Priorite: app_eco/models/ puis chemin original
            local_yolo = module_path / "models/yolo_layer1.pt"
            if local_yolo.exists():
                yolo_model_path = local_yolo
            else:
                yolo_model_path = base_path / "runs/detect/models/yolo_layer1/train/weights/best.pt"

        if cnn_model_path is None:
            local_cnn = module_path / "models/cnn_spices.pt"
            if local_cnn.exists():
                cnn_model_path = local_cnn
            else:
                cnn_model_path = base_path / "models/cnn_spices/best.pt"

        # Initialiser les detecteurs
        print("Chargement des modeles...")

        self.yolo = YOLODetector(str(yolo_model_path), device=device)
        print(f"  YOLO charge: {self.yolo.classes}")

        self.cnn = CNNClassifier(str(cnn_model_path), device=device)
        print(f"  CNN charge: {self.cnn.classes}")

        self.use_ocr = use_ocr
        if use_ocr:
            self.ocr = OCRReader(languages=ocr_languages)
            print(f"  OCR charge: {ocr_languages}")
        else:
            self.ocr = None

        self.fusion = FusionEngine()
        print("Detecteur pret!")

    def detect(
        self,
        image: Union[str, np.ndarray, Image.Image],
        yolo_conf: float = 0.3,  # Seuil bas pour mieux detecter en cuisine
        cnn_conf: float = 0.7,
        ocr_conf: float = 0.5,
        ood_margin: float = 0.4,  # Marge tres stricte + radius ultra-strict
        use_cnn: bool = True,  # Active avec double restriction
        return_annotated: bool = False
    ) -> Dict[str, Any]:
        """
        Detecte les ingredients dans une image.

        Args:
            image: Chemin vers l'image, array numpy ou PIL Image
            yolo_conf: Seuil de confiance YOLO
            cnn_conf: Seuil de confiance CNN
            ocr_conf: Seuil de confiance OCR
            ood_margin: Marge OOD pour le CNN (0.8=strict, 1.5=permissif)
            use_cnn: Activer le CNN
            return_annotated: Retourner l'image annotee

        Returns:
            Dict avec:
            - ingredients: Liste des ingredients detectes
            - details: Details par source (yolo, cnn, ocr)
            - annotated_image: Image annotee (si return_annotated=True)
        """
        # Charger l'image
        img_array = self._load_image(image)

        # 1. Detection YOLO
        yolo_results = self.yolo.detect(img_array, conf=yolo_conf)

        # 2. Classification CNN avec detection OOD
        cnn_results = self.cnn.classify(img_array, conf=cnn_conf, ood_margin=ood_margin, disabled=not use_cnn)

        # 3. OCR (si active)
        ocr_results = []
        if self.use_ocr and self.ocr:
            ocr_results = self.ocr.read(img_array, conf=ocr_conf)

        # 4. Fusion des resultats
        fusion_results = self.fusion.fuse(
            yolo_results=yolo_results,
            cnn_results=cnn_results,
            ocr_results=ocr_results
        )

        # Preparer la reponse
        response = {
            'ingredients': fusion_results['ingredients'],
            'details': {
                'yolo': yolo_results,
                'cnn': cnn_results,
                'ocr': ocr_results
            },
            'confidence_scores': fusion_results['confidence_scores']
        }

        # Annoter l'image si demande
        if return_annotated:
            response['annotated_image'] = self._annotate_image(
                img_array, yolo_results, fusion_results['ingredients']
            )

        return response

    def detect_ingredients_only(
        self,
        image: Union[str, np.ndarray, Image.Image],
        conf: float = 0.5
    ) -> List[str]:
        """
        Version simplifiee - retourne juste la liste des ingredients.

        Args:
            image: Image a analyser
            conf: Seuil de confiance

        Returns:
            Liste des noms d'ingredients
        """
        results = self.detect(image, yolo_conf=conf, cnn_conf=conf, ocr_conf=conf)
        return results['ingredients']

    def _load_image(self, image: Union[str, np.ndarray, Image.Image]) -> np.ndarray:
        """Charge une image depuis differentes sources."""
        if isinstance(image, str):
            img = cv2.imread(image)
            if img is None:
                raise ValueError(f"Impossible de charger l'image: {image}")
            return img
        elif isinstance(image, Image.Image):
            return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
        elif isinstance(image, np.ndarray):
            return image
        else:
            raise TypeError(f"Type d'image non supporte: {type(image)}")

    def _annotate_image(
        self,
        image: np.ndarray,
        yolo_results: List[Dict],
        ingredients: List[str]
    ) -> np.ndarray:
        """Annote l'image avec les detections."""
        annotated = image.copy()

        # Dessiner les boxes YOLO
        for det in yolo_results:
            bbox = det['bbox']
            label = det['name']
            conf = det['confidence']

            x1, y1, x2, y2 = map(int, bbox)
            color = (0, 255, 0)  # Vert

            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, 2)
            cv2.putText(
                annotated,
                f"{label} {conf:.0%}",
                (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6,
                color,
                2
            )

        # Ajouter la liste des ingredients en haut
        y_offset = 30
        cv2.putText(
            annotated,
            f"Ingredients: {', '.join(ingredients)}",
            (10, y_offset),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.7,
            (255, 255, 255),
            2
        )

        return annotated
