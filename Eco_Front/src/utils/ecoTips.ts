// Tips écologiques aléatoires partagés dans l'application
export const ECO_TIPS = [
  "En achetant des produits proches de leur DLC, vous réduisez le gaspillage alimentaire !",
  "Chaque produit sauvé est un pas vers un avenir plus durable.",
  "Saviez-vous ? 1/3 de la nourriture mondiale est gaspillée chaque année.",
  "Votre achat aide les commerces locaux à réduire leurs pertes.",
  "Ensemble, luttons contre le gaspillage alimentaire !",
  "Les produits anti-gaspi ont le même goût et la même qualité !",
  "Choisir des produits proches de la DLC, c'est choisir la planète.",
  "Merci de contribuer à un monde plus responsable !",
  "Réduire le gaspillage, c'est préserver notre planète pour les générations futures.",
  "En France, chaque personne jette environ 30kg de nourriture par an.",
];

export const getRandomEcoTip = (): string => {
  return ECO_TIPS[Math.floor(Math.random() * ECO_TIPS.length)];
};
