"""
Serveur Flask pour la detection d'ingredients par IA.
Lance ce serveur separement du backend Node.js :
    python ai_server.py
Il tourne sur le port 5001.
"""

import base64
import io
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

from app_eco import IngredientDetector

app = Flask(__name__)
CORS(app)

# Charger le detecteur une seule fois au demarrage
print("[AI Server] Chargement des modeles IA...")
detector = IngredientDetector()
print("[AI Server] Modeles charges avec succes!")


@app.route('/api/ai/detect', methods=['POST'])
def detect_ingredients():
    """
    Recoit une image en base64 et retourne les ingredients detectes.
    Body JSON: { "image": "base64_string" }
    """
    try:
        data = request.get_json()

        if not data or 'image' not in data:
            return jsonify({'success': False, 'error': 'Image manquante'}), 400

        # Decoder l'image base64
        image_base64 = data['image']

        # Supprimer le prefix data:image/...;base64, si present
        if ',' in image_base64:
            image_base64 = image_base64.split(',')[1]

        image_bytes = base64.b64decode(image_base64)
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')

        # Passer l'image PIL directement - _load_image convertira RGB->BGR correctement
        results = detector.detect(
            image,
            yolo_conf=0.4,
            cnn_conf=0.5,
            ocr_conf=0.3,
            ood_margin=1.5
        )

        # Debug: afficher ce que chaque couche detecte
        details = results.get('details', {})
        yolo_det = details.get('yolo', [])
        cnn_det = details.get('cnn', [])
        ocr_det = details.get('ocr', [])
        print(f"[AI] YOLO ({len(yolo_det)}): {[d['name'] for d in yolo_det]}")
        print(f"[AI] CNN  ({len(cnn_det)}): {[d['name'] for d in cnn_det]}")
        print(f"[AI] OCR  ({len(ocr_det)}): {[d['name'] for d in ocr_det]}")
        print(f"[AI] Fusion -> {results['ingredients']}")

        # Formater la reponse
        ingredients = []
        for name in results['ingredients']:
            confidence = 0.0
            if name in results.get('confidence_scores', {}):
                confidence = results['confidence_scores'][name].get('confidence', 0.0)
            ingredients.append({
                'name': name,
                'confidence': round(confidence * 100)
            })

        # Trier par confiance decroissante
        ingredients.sort(key=lambda x: x['confidence'], reverse=True)

        return jsonify({
            'success': True,
            'ingredients': ingredients,
            'count': len(ingredients)
        })

    except Exception as e:
        print(f"[AI Server] Erreur: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/ai/health', methods=['GET'])
def health():
    """Endpoint de sante pour verifier que le serveur IA tourne."""
    return jsonify({'success': True, 'status': 'ok', 'message': 'AI Server is running'})


if __name__ == '__main__':
    print("[AI Server] Demarrage sur le port 5001...")
    app.run(host='0.0.0.0', port=5001, debug=False)
