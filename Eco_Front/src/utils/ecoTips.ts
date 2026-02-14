/**
 * Liste des conseils écologiques pour sensibiliser les utilisateurs
 */
export const ECO_TIPS = [
  "Acheter local réduit l'empreinte carbone liée au transport.",
  "Les produits proches de leur DLC sont aussi nutritifs et sûrs à consommer.",
  "En France, 10 millions de tonnes de nourriture sont gaspillées chaque année.",
  "Congeler les aliments avant leur DLC permet de les conserver plusieurs mois.",
  "Un repas anti-gaspi sauve l'équivalent de 2,5 kg de CO2.",
  "30% du gaspillage alimentaire se produit au niveau de la distribution.",
  "Les fruits et légumes \"moches\" ont les mêmes qualités nutritionnelles.",
  "Planifier ses repas réduit le gaspillage de 25%.",
  "Chaque ménage français jette en moyenne 29 kg de nourriture par an.",
  "Les dates de péremption sont souvent indicatives, fiez-vous à vos sens.",
  "Le compostage transforme les déchets organiques en engrais naturel.",
  "Les restes peuvent être transformés en délicieuses nouvelles recettes.",
  "Acheter en vrac réduit les emballages plastiques inutiles.",
  "Les produits de saison sont plus savoureux et écologiques.",
  "Conserver correctement ses aliments prolonge leur durée de vie.",
  "Le gaspillage alimentaire représente 8% des émissions mondiales de gaz à effet de serre.",
  "Donner aux associations aide les personnes dans le besoin.",
  "Une pomme jetée a nécessité 70 litres d'eau pour sa production.",
  "Réutiliser les contenants réduit la production de déchets.",
  "Les circuits courts favorisent l'économie locale et réduisent la pollution."
];

/**
 * Retourne un conseil écologique aléatoire
 */
export const getRandomEcoTip = (): string => {
  const randomIndex = Math.floor(Math.random() * ECO_TIPS.length);
  return ECO_TIPS[randomIndex];
};
