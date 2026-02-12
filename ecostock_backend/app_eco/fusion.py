"""
Moteur de Fusion
================
Combine les resultats YOLO + CNN + OCR de maniere intelligente
"""

from typing import List, Dict, Any
import numpy as np


def to_python_type(value):
    """Convertit les types numpy en types Python natifs pour JSON."""
    if isinstance(value, (np.float32, np.float64)):
        return float(value)
    elif isinstance(value, (np.int32, np.int64)):
        return int(value)
    elif isinstance(value, np.ndarray):
        return value.tolist()
    elif isinstance(value, dict):
        return {k: to_python_type(v) for k, v in value.items()}
    elif isinstance(value, list):
        return [to_python_type(v) for v in value]
    return value


class FusionEngine:
    """
    Fusionne les resultats de detection multi-sources.

    Logique de fusion:
    1. YOLO avec haute confiance (>0.9) -> ingredient confirme
    2. YOLO avec confiance moyenne (0.5-0.9) -> verifier avec OCR
    3. CNN pour epices -> ajouter si confiance > seuil
    4. OCR -> ajouter les ingredients trouves dans le texte

    Evite les doublons et priorise par confiance.
    """

    def __init__(
        self,
        yolo_high_threshold: float = 0.9,
        yolo_medium_threshold: float = 0.5,
        cnn_threshold: float = 0.7,
        ocr_threshold: float = 0.5
    ):
        """
        Args:
            yolo_high_threshold: Seuil haute confiance YOLO
            yolo_medium_threshold: Seuil confiance moyenne YOLO
            cnn_threshold: Seuil confiance CNN
            ocr_threshold: Seuil confiance OCR
        """
        self.yolo_high = yolo_high_threshold
        self.yolo_medium = yolo_medium_threshold
        self.cnn_threshold = cnn_threshold
        self.ocr_threshold = ocr_threshold

    def fuse(
        self,
        yolo_results: List[Dict[str, Any]],
        cnn_results: List[Dict[str, Any]],
        ocr_results: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Fusionne les resultats des trois sources.

        Args:
            yolo_results: Detections YOLO
            cnn_results: Classifications CNN
            ocr_results: Textes OCR

        Returns:
            Dict avec ingredients fusionnes et scores
        """
        # Dictionnaire pour tracker les ingredients et leurs scores
        ingredient_scores = {}

        # 1. Traiter les resultats YOLO
        for det in yolo_results:
            name = det['name']
            conf = det['confidence']

            if name not in ingredient_scores:
                ingredient_scores[name] = {
                    'confidence': conf,
                    'sources': ['yolo'],
                    'yolo_conf': conf
                }
            else:
                # Garder la meilleure confiance
                if conf > ingredient_scores[name]['confidence']:
                    ingredient_scores[name]['confidence'] = conf
                    ingredient_scores[name]['yolo_conf'] = conf
                if 'yolo' not in ingredient_scores[name]['sources']:
                    ingredient_scores[name]['sources'].append('yolo')

        # 2. Traiter les resultats CNN
        for cls in cnn_results:
            name = cls['name']
            conf = cls['confidence']

            if conf >= self.cnn_threshold:
                if name not in ingredient_scores:
                    ingredient_scores[name] = {
                        'confidence': conf,
                        'sources': ['cnn'],
                        'cnn_conf': conf
                    }
                else:
                    # Booster la confiance si CNN confirme
                    ingredient_scores[name]['confidence'] = max(
                        ingredient_scores[name]['confidence'],
                        conf
                    )
                    ingredient_scores[name]['cnn_conf'] = conf
                    if 'cnn' not in ingredient_scores[name]['sources']:
                        ingredient_scores[name]['sources'].append('cnn')

        # 3. Traiter les resultats OCR
        for ocr in ocr_results:
            name = ocr['name']
            conf = ocr.get('confidence', 0.8)

            if name not in ingredient_scores:
                ingredient_scores[name] = {
                    'confidence': conf,
                    'sources': ['ocr'],
                    'ocr_conf': conf
                }
            else:
                # OCR confirme une detection existante -> boost
                ingredient_scores[name]['confidence'] = min(
                    1.0,
                    ingredient_scores[name]['confidence'] + 0.1
                )
                ingredient_scores[name]['ocr_conf'] = conf
                if 'ocr' not in ingredient_scores[name]['sources']:
                    ingredient_scores[name]['sources'].append('ocr')

        # 4. Booster les ingredients confirmes par plusieurs sources
        for name, data in ingredient_scores.items():
            num_sources = len(data['sources'])
            if num_sources >= 2:
                # Bonus pour confirmation multi-source
                data['confidence'] = min(1.0, data['confidence'] + 0.05 * num_sources)
                data['multi_source_confirmed'] = True
            else:
                data['multi_source_confirmed'] = False

        # 5. Creer la liste finale triee par confiance
        ingredients_list = sorted(
            ingredient_scores.keys(),
            key=lambda x: ingredient_scores[x]['confidence'],
            reverse=True
        )

        # Convertir tous les types numpy en types Python natifs (pour JSON)
        return {
            'ingredients': ingredients_list,
            'confidence_scores': to_python_type(ingredient_scores),
            'num_sources': {
                'yolo': len(yolo_results),
                'cnn': len(cnn_results),
                'ocr': len(ocr_results)
            }
        }

    def get_recipe_ingredients(
        self,
        fusion_results: Dict[str, Any],
        min_confidence: float = 0.5
    ) -> List[str]:
        """
        Retourne une liste propre d'ingredients pour une recette.

        Args:
            fusion_results: Resultats de la fusion
            min_confidence: Confiance minimum requise

        Returns:
            Liste des noms d'ingredients
        """
        ingredients = []
        for name in fusion_results['ingredients']:
            score = fusion_results['confidence_scores'][name]['confidence']
            if score >= min_confidence:
                ingredients.append(name)
        return ingredients
