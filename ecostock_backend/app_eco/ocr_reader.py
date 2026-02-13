"""
Lecteur OCR pour texte sur emballages
=====================================
"""

import numpy as np
from typing import List, Dict, Any
import cv2


class OCRReader:
    """Lecteur OCR pour extraire le texte des images."""

    # Mapping des mots-cles vers ingredients (FR, EN, IT, ES)
    KEYWORD_MAPPING = {
        # === LEGUMES ===
        'tomate': ['tomate', 'tomato', 'tomates', 'tomatoes', 'pomodoro', 'tomate cerise', 'cherry tomato'],
        'oignon': ['oignon', 'onion', 'oignons', 'onions', 'cipolla', 'cebolla', 'echalote', 'shallot'],
        'ail': ['ail', 'garlic', 'aglio', 'ajo', 'gousse'],
        'carotte': ['carotte', 'carrot', 'carottes', 'carrots', 'carota', 'zanahoria'],
        'pomme_de_terre': ['pomme de terre', 'potato', 'patate', 'pommes de terre', 'potatoes', 'frite', 'frites', 'patata', 'papa'],
        'courgette': ['courgette', 'zucchini', 'courgettes', 'zucchine', 'calabacin'],
        'aubergine': ['aubergine', 'eggplant', 'melanzana', 'berenjena'],
        'poivron': ['poivron', 'bell pepper', 'poivrons', 'peperone', 'pimiento'],
        'concombre': ['concombre', 'cucumber', 'cetriolo', 'pepino'],
        'salade': ['salade', 'salad', 'laitue', 'lettuce', 'lattuga', 'lechuga'],
        'epinard': ['epinard', 'spinach', 'epinards', 'spinaci', 'espinaca'],
        'brocoli': ['brocoli', 'broccoli', 'brocolis'],
        'chou': ['chou', 'cabbage', 'cavolo', 'col', 'chou-fleur', 'cauliflower'],
        'haricot': ['haricot', 'bean', 'haricots', 'haricot vert', 'green bean', 'fagiolo'],
        'petit_pois': ['petit pois', 'peas', 'petits pois', 'pisello', 'guisante'],
        'champignon': ['champignon', 'mushroom', 'champignons', 'mushrooms', 'fungo', 'seta'],
        'celeri': ['celeri', 'celery', 'sedano', 'apio'],
        'poireau': ['poireau', 'leek', 'poireaux', 'porro', 'puerro'],
        'navet': ['navet', 'turnip', 'rapa', 'nabo'],
        'radis': ['radis', 'radish', 'ravanello', 'rabano'],
        'betterave': ['betterave', 'beet', 'beetroot', 'barbabietola', 'remolacha'],
        'avocat': ['avocat', 'avocado', 'aguacate'],
        'mais': ['mais', 'corn', 'maize', 'granturco', 'maiz'],
        'asperge': ['asperge', 'asparagus', 'asparago', 'esparrago'],

        # === FRUITS ===
        'citron': ['citron', 'lemon', 'limone', 'limon'],
        'orange': ['orange', 'naranja', 'arancia'],
        'pomme': ['pomme', 'apple', 'mela', 'manzana'],
        'banane': ['banane', 'banana', 'platano'],
        'fraise': ['fraise', 'strawberry', 'fragola', 'fresa'],
        'raisin': ['raisin', 'grape', 'uva'],
        'poire': ['poire', 'pear', 'pera'],
        'peche': ['peche', 'peach', 'pesca', 'melocoton'],
        'abricot': ['abricot', 'apricot', 'albicocca', 'albaricoque'],
        'mangue': ['mangue', 'mango'],
        'ananas': ['ananas', 'pineapple', 'pina'],
        'cerise': ['cerise', 'cherry', 'ciliegia', 'cereza'],
        'framboise': ['framboise', 'raspberry', 'lampone', 'frambuesa'],
        'myrtille': ['myrtille', 'blueberry', 'mirtillo', 'arandano'],
        'melon': ['melon', 'melone'],
        'pasteque': ['pasteque', 'watermelon', 'anguria', 'sandia'],
        'kiwi': ['kiwi'],

        # === PROTEINES ===
        'oeuf': ['oeuf', 'oeufs', 'egg', 'eggs', 'uovo', 'uova', 'huevo'],
        'poulet': ['poulet', 'chicken', 'volaille', 'pollo', 'poultry'],
        'boeuf': ['boeuf', 'beef', 'manzo', 'ternera', 'steak', 'viande hachee', 'ground beef'],
        'porc': ['porc', 'pork', 'maiale', 'cerdo', 'cochon', 'jambon', 'ham', 'bacon', 'lard'],
        'agneau': ['agneau', 'lamb', 'agnello', 'cordero'],
        'veau': ['veau', 'veal', 'vitello', 'ternera'],
        'dinde': ['dinde', 'turkey', 'tacchino', 'pavo'],
        'canard': ['canard', 'duck', 'anatra', 'pato'],
        'poisson': ['poisson', 'fish', 'pesce', 'pescado'],
        'saumon': ['saumon', 'salmon', 'salmone'],
        'thon': ['thon', 'tuna', 'tonno', 'atun'],
        'crevette': ['crevette', 'shrimp', 'gambero', 'gamba', 'crevettes', 'shrimps'],
        'moule': ['moule', 'mussel', 'cozza', 'mejillon', 'moules', 'mussels'],
        'cabillaud': ['cabillaud', 'cod', 'merluzzo', 'bacalao'],
        'sardine': ['sardine', 'sardina'],
        'truite': ['truite', 'trout', 'trota', 'trucha'],

        # === PRODUITS LAITIERS ===
        'lait': ['lait', 'milk', 'latte', 'leche'],
        'beurre': ['beurre', 'butter', 'burro', 'mantequilla'],
        'fromage': ['fromage', 'cheese', 'formaggio', 'queso'],
        'creme': ['creme', 'cream', 'crema', 'creme fraiche'],
        'yaourt': ['yaourt', 'yogurt', 'yoghurt', 'yogur'],
        'mozzarella': ['mozzarella'],
        'parmesan': ['parmesan', 'parmigiano', 'parmesano'],
        'gruyere': ['gruyere', 'emmental'],

        # === EPICES ET AROMATES ===
        'paprika': ['paprika', 'pimenton', 'piment doux'],
        'poivre': ['poivre', 'pepper', 'poivre noir', 'black pepper', 'poivre blanc', 'white pepper', 'pepe'],
        'sel': ['sel', 'salt', 'sale', 'sal'],
        'cumin': ['cumin', 'cumino', 'comino'],
        'curry': ['curry', 'cari'],
        'curcuma': ['curcuma', 'turmeric'],
        'cannelle': ['cannelle', 'cinnamon', 'canela', 'cannella'],
        'gingembre': ['gingembre', 'ginger', 'zenzero', 'jengibre'],
        'muscade': ['muscade', 'nutmeg', 'noce moscata', 'nuez moscada'],
        'clou_de_girofle': ['clou de girofle', 'clove', 'chiodo di garofano', 'clavo'],
        'thym': ['thym', 'thyme', 'timo', 'tomillo'],
        'romarin': ['romarin', 'rosemary', 'rosmarino', 'romero'],
        'basilic': ['basilic', 'basil', 'basilico', 'albahaca'],
        'persil': ['persil', 'parsley', 'prezzemolo', 'perejil'],
        'coriandre': ['coriandre', 'coriander', 'cilantro', 'coriandolo'],
        'menthe': ['menthe', 'mint', 'menta'],
        'laurier': ['laurier', 'bay leaf', 'alloro', 'laurel'],
        'origan': ['origan', 'oregano', 'origano'],
        'aneth': ['aneth', 'dill', 'aneto', 'eneldo'],
        'safran': ['safran', 'saffron', 'zafferano', 'azafran'],
        'piment': ['piment', 'chili', 'chilli', 'peperoncino', 'chile', 'piment rouge'],
        'cayenne': ['cayenne', 'cayena'],
        'herbes_de_provence': ['herbes de provence', 'provencal herbs'],
        'ciboulette': ['ciboulette', 'chives', 'erba cipollina', 'cebollino'],
        'estragon': ['estragon', 'tarragon', 'estragone'],
        'sauge': ['sauge', 'sage', 'salvia'],
        'fenouil': ['fenouil', 'fennel', 'finocchio', 'hinojo'],
        'anis': ['anis', 'anise', 'anice'],
        'cardamome': ['cardamome', 'cardamom', 'cardamomo'],
        'cerfeuil': ['cerfeuil', 'chervil', 'cerfoglio', 'perifollo'],

        # === FECULENTS ET CEREALES ===
        'riz': ['riz', 'rice', 'riso', 'arroz'],
        'pates': ['pates', 'pasta', 'spaghetti', 'penne', 'tagliatelle', 'linguine', 'fusilli'],
        'pain': ['pain', 'bread', 'pane', 'pan'],
        'farine': ['farine', 'flour', 'farina', 'harina'],
        'quinoa': ['quinoa'],
        'couscous': ['couscous', 'cous cous'],
        'boulgour': ['boulgour', 'bulgur'],
        'semoule': ['semoule', 'semolina', 'semola'],
        'avoine': ['avoine', 'oat', 'oats', 'avena'],
        'ble': ['ble', 'wheat', 'grano', 'trigo'],

        # === LEGUMINEUSES ===
        'lentille': ['lentille', 'lentil', 'lenticchia', 'lenteja', 'lentilles', 'lentils'],
        'pois_chiche': ['pois chiche', 'chickpea', 'ceci', 'garbanzo', 'pois chiches', 'chickpeas'],
        'haricot_rouge': ['haricot rouge', 'red bean', 'kidney bean', 'fagiolo rosso', 'frijol rojo'],
        'haricot_blanc': ['haricot blanc', 'white bean', 'fagiolo bianco', 'alubia'],
        'soja': ['soja', 'soy', 'soya'],
        'tofu': ['tofu'],

        # === CONDIMENTS ET SAUCES ===
        'huile': ['huile', 'oil', 'olio', 'aceite', 'huile olive', 'olive oil'],
        'vinaigre': ['vinaigre', 'vinegar', 'aceto', 'vinagre'],
        'moutarde': ['moutarde', 'mustard', 'senape', 'mostaza'],
        'mayonnaise': ['mayonnaise', 'mayo', 'maionese', 'mayonesa'],
        'ketchup': ['ketchup'],
        'sauce_soja': ['sauce soja', 'soy sauce', 'salsa di soia', 'salsa de soja'],
        'miel': ['miel', 'honey', 'miele'],
        'sucre': ['sucre', 'sugar', 'zucchero', 'azucar'],
        'concentre_tomate': ['concentre de tomate', 'tomato paste', 'concentrato di pomodoro'],

        # === NOIX ET GRAINES ===
        'amande': ['amande', 'almond', 'mandorla', 'almendra', 'amandes', 'almonds'],
        'noix': ['noix', 'walnut', 'noce', 'nuez'],
        'noisette': ['noisette', 'hazelnut', 'nocciola', 'avellana'],
        'cacahuete': ['cacahuete', 'peanut', 'arachide', 'cacahuate', 'cacahuetes', 'peanuts'],
        'pistache': ['pistache', 'pistachio', 'pistacchio'],
        'noix_de_cajou': ['noix de cajou', 'cashew', 'anacardo'],
        'sesame': ['sesame', 'sesamo'],
        'lin': ['lin', 'flaxseed', 'lino'],
        'tournesol': ['tournesol', 'sunflower', 'girasole', 'girasol'],
    }

    def __init__(self, languages: List[str] = ['fr', 'en']):
        """
        Args:
            languages: Liste des langues pour l'OCR
        """
        self.languages = languages
        self.reader = None
        self._initialized = False

    def _init_reader(self):
        """Initialisation paresseuse de EasyOCR."""
        if not self._initialized:
            try:
                import easyocr
                import torch
                use_gpu = torch.cuda.is_available()
                print(f"[OCR] Initialisation EasyOCR (gpu={use_gpu})...")
                self.reader = easyocr.Reader(self.languages, gpu=use_gpu)
                self._initialized = True
                print("[OCR] EasyOCR pret!")
            except Exception as e:
                print(f"[OCR] Erreur initialisation: {e}")
                import traceback
                traceback.print_exc()
                self.reader = None

    def read(self, image: np.ndarray, conf: float = 0.5) -> List[Dict[str, Any]]:
        """
        Lit le texte dans une image et identifie les ingredients.

        Args:
            image: Image numpy (BGR)
            conf: Seuil de confiance minimum

        Returns:
            Liste des ingredients trouves via OCR
        """
        self._init_reader()

        if self.reader is None:
            return []

        try:
            # Lire le texte
            results = self.reader.readtext(image)

            found_ingredients = []
            all_text = []

            print(f"[OCR] Texte brut detecte ({len(results)} zones):")
            for (bbox, text, confidence) in results:
                print(f"  - '{text}' (conf={confidence:.2f})")
                if confidence >= conf:
                    all_text.append(text.lower())

            # Chercher les mots-cles
            full_text = ' '.join(all_text)
            print(f"[OCR] Texte filtre (conf>={conf}): '{full_text}'")

            for ingredient, keywords in self.KEYWORD_MAPPING.items():
                for keyword in keywords:
                    if keyword.lower() in full_text:
                        found_ingredients.append({
                            'name': ingredient,
                            'confidence': 0.8,  # Confiance fixe pour OCR
                            'source': 'ocr',
                            'matched_keyword': keyword
                        })
                        break  # Un seul match par ingredient

            return found_ingredients

        except Exception as e:
            print(f"Erreur OCR: {e}")
            return []

    def read_raw_text(self, image: np.ndarray, conf: float = 0.5) -> List[str]:
        """
        Retourne le texte brut trouve dans l'image.

        Args:
            image: Image numpy (BGR)
            conf: Seuil de confiance minimum

        Returns:
            Liste des textes trouves
        """
        self._init_reader()

        if self.reader is None:
            return []

        try:
            results = self.reader.readtext(image)
            return [text for (bbox, text, confidence) in results if confidence >= conf]
        except Exception as e:
            print(f"Erreur OCR: {e}")
            return []
