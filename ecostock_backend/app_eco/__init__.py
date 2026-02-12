"""
APP_ECO - Module de Detection d'Ingredients
============================================
Module reutilisable pour detecter les ingredients dans une image.
Combine YOLO (detection objets) + CNN (classification epices) + OCR (lecture texte)

Usage:
    from app_eco import IngredientDetector

    detector = IngredientDetector()
    results = detector.detect("image.jpg")

    print(results['ingredients'])  # Liste des ingredients detectes
"""

from .ingredient_detector import IngredientDetector

__version__ = "1.0.0"
__all__ = ['IngredientDetector']
