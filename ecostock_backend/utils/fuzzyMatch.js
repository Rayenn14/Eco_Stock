/**
 * Calcule la distance de Levenshtein entre deux chaînes
 * Utilisé pour le fuzzy matching d'ingrédients
 */
function levenshteinDistance(str1, str2) {
  const m = str1.length;
  const n = str2.length;
  const dp = new Array(m + 1).fill(null).map(() => new Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) {
    dp[i][0] = i;
  }

  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,      // deletion
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j - 1] + 1   // substitution
        );
      }
    }
  }

  return dp[m][n];
}

/**
 * Calcule un score de similarité entre deux chaînes (0 à 1)
 * 1 = identique, 0 = complètement différent
 */
function similarityScore(str1, str2) {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - (distance / maxLen);
}

/**
 * Normalise une chaîne pour la comparaison:
 * - Minuscules
 * - Suppression des accents
 * - Trim
 */
function normalize(str) {
  if (!str) return '';

  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replaceAll(/[\u0300-\u036f]/g, '') // Supprimer les accents
    .replaceAll(/[^a-z0-9\s-]/g, ''); // Garder seulement lettres, chiffres, espaces et tirets
}

/**
 * Trouve les meilleurs matchs pour un ingrédient
 * @param {string} input - L'entrée utilisateur
 * @param {Array} ingredients - Liste des ingrédients disponibles [{id, name}]
 * @param {number} threshold - Seuil de similarité (0 à 1, défaut 0.6)
 * @param {number} maxResults - Nombre maximum de résultats (défaut 5)
 * @returns {Array} Liste des matchs [{id, name, score, normalized}]
 */
function findBestMatches(input, ingredients, threshold = 0.6, maxResults = 5) {
  const normalizedInput = normalize(input);

  // Si l'input est vide, retourner les premiers résultats
  if (!normalizedInput) {
    return ingredients.slice(0, maxResults).map(ing => ({
      ...ing,
      score: 0,
      normalized: normalize(ing.name)
    }));
  }

  const matches = ingredients.map(ingredient => {
    const normalizedName = normalize(ingredient.name);

    // Score de correspondance exacte
    let score = 0;

    // Match exact (priorité maximale)
    if (normalizedName === normalizedInput) {
      score = 1.0;
    }
    // Commence par l'input (haute priorité)
    else if (normalizedName.startsWith(normalizedInput)) {
      score = 0.9;
    }
    // Contient l'input (moyenne priorité)
    else if (normalizedName.includes(normalizedInput)) {
      score = 0.8;
    }
    // Similarité par distance de Levenshtein
    else {
      score = similarityScore(normalizedInput, normalizedName);
    }

    return {
      ...ingredient,
      score,
      normalized: normalizedName
    };
  });

  // Filtrer par seuil et trier par score décroissant
  return matches
    .filter(match => match.score >= threshold)
    .sort((a, b) => b.score - a.score)
    .slice(0, maxResults);
}

module.exports = {
  levenshteinDistance,
  similarityScore,
  normalize,
  findBestMatches
};
