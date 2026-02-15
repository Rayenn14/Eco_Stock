"""
Classificateur CNN pour epices - V2 avec detection OOD
======================================================
Utilise des prototypes pour rejeter les images hors distribution
"""

import os
os.environ['KMP_DUPLICATE_LIB_OK'] = 'TRUE'

import torch
import torch.nn as nn
import numpy as np
from torchvision import transforms, models
from typing import List, Dict, Any
from pathlib import Path
from PIL import Image
import cv2


class CNNClassifier:
    """
    Classificateur CNN pour epices avec detection Out-of-Distribution.

    Utilise des prototypes (centroides de classe) pour rejeter les images
    qui ne ressemblent pas aux epices connues.
    """

    def __init__(self, model_path: str, device: str = 'auto'):
        """
        Args:
            model_path: Chemin vers le modele CNN (.pt)
            device: 'cuda', 'cpu' ou 'auto'
        """
        self.model_path = Path(model_path)

        if not self.model_path.exists():
            raise FileNotFoundError(f"Modele CNN non trouve: {model_path}")

        # Determiner le device
        if device == 'auto':
            device = 'cuda' if torch.cuda.is_available() else 'cpu'

        self.device = torch.device(device)

        # Charger le checkpoint
        checkpoint = torch.load(str(model_path), map_location=self.device, weights_only=False)  # NOSONAR

        self.classes = checkpoint['classes']
        self.version = checkpoint.get('version', 'v1')

        # Charger les prototypes si disponibles (v2)
        self.prototypes = checkpoint.get('prototypes', None)
        self.radii = checkpoint.get('radii', None)
        self.has_ood_detection = self.prototypes is not None

        if self.has_ood_detection:
            print(f"    CNN avec detection OOD (prototypes)")

        # Reconstruire le modele
        num_features = checkpoint.get('num_features', 512)
        self.model = models.resnet18(weights=None)
        self.model.fc = nn.Linear(num_features, len(self.classes))
        self.model.load_state_dict(checkpoint['model_state_dict'])
        self.model = self.model.to(self.device)
        self.model.eval()

        # Extracteur de features (sans la derniere couche)
        self.feature_extractor = nn.Sequential(*list(self.model.children())[:-1])
        self.feature_extractor.eval()

        # Preprocessing
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])

    def _extract_features(self, image: np.ndarray) -> np.ndarray:
        """Extrait le vecteur de features d'une image."""
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        input_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)

        with torch.no_grad():
            features = self.feature_extractor(input_tensor)
            features = features.view(features.size(0), -1)

        return features[0].cpu().numpy()

    def _is_in_distribution(self, features: np.ndarray, margin: float = 1.0) -> tuple:
        """
        Verifie si les features sont dans la distribution connue.

        Args:
            features: Vecteur de features de l'image
            margin: Multiplicateur du rayon (1.0 = strict, 1.5 = permissif)

        Returns:
            (is_known, closest_class, distance_ratio)
        """
        if not self.has_ood_detection:
            return True, 0, 0.0

        min_ratio = float('inf')
        closest_class = 0

        for class_id, prototype in self.prototypes.items():
            distance = np.linalg.norm(features - prototype)
            radius = self.radii[class_id]
            ratio = distance / radius

            if ratio < min_ratio:
                min_ratio = ratio
                closest_class = class_id

        # Si le ratio est < margin, l'image est dans la distribution
        is_known = min_ratio < margin

        return is_known, closest_class, min_ratio

    def classify(
        self,
        image: np.ndarray,
        conf: float = 0.7,
        ood_margin: float = 1.0,
        disabled: bool = False
    ) -> List[Dict[str, Any]]:
        """
        Classifie une image d'epice avec detection OOD.

        Args:
            image: Image numpy (BGR)
            conf: Seuil de confiance minimum
            ood_margin: Marge pour la detection OOD (1.0=strict, 1.5=permissif)
            disabled: Si True, retourne liste vide

        Returns:
            Liste avec la classification (vide si image non reconnue)
        """
        if disabled:
            return []

        # Extraire les features
        features = self._extract_features(image)

        # Verifier si c'est dans la distribution
        is_known, closest_class, distance_ratio = self._is_in_distribution(features, ood_margin)

        if not is_known:
            # Image hors distribution - pas une epice connue
            return []

        # Classification standard
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        input_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]

        results = []
        for i, prob in enumerate(probabilities):
            prob_value = prob.item()
            if prob_value >= conf:
                results.append({
                    'name': self.classes[i],
                    'confidence': prob_value,
                    'source': 'cnn',
                    'ood_distance_ratio': distance_ratio
                })

        results.sort(key=lambda x: x['confidence'], reverse=True)

        return results

    def classify_with_rejection(
        self,
        image: np.ndarray,
        ood_margin: float = 1.2
    ) -> Dict[str, Any]:
        """
        Classifie avec possibilite de rejet.

        Returns:
            Dict avec 'is_spice', 'class', 'confidence', 'rejection_reason'
        """
        features = self._extract_features(image)
        is_known, closest_class, distance_ratio = self._is_in_distribution(features, ood_margin)

        if not is_known:
            return {
                'is_spice': False,
                'class': None,
                'confidence': 0.0,
                'rejection_reason': f'Hors distribution (ratio={distance_ratio:.2f})'
            }

        # Classification
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        input_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            top_prob, top_class = probabilities.max(0)

        return {
            'is_spice': True,
            'class': self.classes[top_class.item()],
            'confidence': top_prob.item(),
            'distance_ratio': distance_ratio
        }

    def classify_top1(self, image: np.ndarray) -> Dict[str, Any]:
        """Retourne uniquement la classe la plus probable (sans OOD)."""
        img_rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        img_pil = Image.fromarray(img_rgb)
        input_tensor = self.transform(img_pil).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            probabilities = torch.softmax(outputs, dim=1)[0]
            top_prob, top_class = probabilities.max(0)

        return {
            'name': self.classes[top_class.item()],
            'confidence': top_prob.item(),
            'source': 'cnn'
        }
