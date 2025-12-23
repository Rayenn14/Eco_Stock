// Messages de sensibilisation écologique affichés pendant les chargements

export const ecoTips = [
  "🌍 Chaque année, 1/3 de la nourriture produite est gaspillée dans le monde.",
  "♻️ Acheter des produits proches de leur date limite réduit le gaspillage alimentaire.",
  "🌱 Un fruit ou légume « moche » est tout aussi nutritif qu'un autre !",
  "💚 En France, chaque personne jette environ 30 kg de nourriture par an.",
  "🌿 Réduire le gaspillage, c'est préserver les ressources de notre planète.",
  "🌾 Produire de la nourriture consomme eau, énergie et terre. Ne gaspillons pas !",
  "🥕 Les fruits et légumes de saison ont une empreinte carbone plus faible.",
  "🌍 10% des émissions de gaz à effet de serre proviennent du gaspillage alimentaire.",
  "💧 Gaspiller 1kg de nourriture = gaspiller 1000L d'eau utilisés pour la produire.",
  "🌟 Acheter en anti-gaspillage permet aux commerçants de réduire leurs pertes.",
  "🍃 Les invendus alimentaires peuvent nourrir des millions de personnes chaque année.",
  "🌈 Privilégier les circuits courts favorise l'économie locale et réduit la pollution.",
  "🌍 La lutte contre le gaspillage commence dans notre assiette !",
  "💡 Planifier ses repas aide à acheter juste ce dont on a besoin.",
  "🌱 Les restes peuvent devenir de délicieuses nouvelles recettes !",
  "♻️ Composter ses déchets organiques enrichit la terre et réduit les déchets.",
  "🌿 Acheter des produits locaux réduit l'empreinte carbone du transport.",
  "🌾 Les associations récupèrent les invendus pour aider les plus démunis.",
  "💚 Ensemble, nous pouvons réduire le gaspillage de 50% d'ici 2030 !",
  "🌍 Chaque geste compte : n'achetons que ce que nous allons consommer.",
];

/**
 * Retourne un message écologique aléatoire
 */
export const getRandomEcoTip = (): string => {
  const randomIndex = Math.floor(Math.random() * ecoTips.length);
  return ecoTips[randomIndex];
};
