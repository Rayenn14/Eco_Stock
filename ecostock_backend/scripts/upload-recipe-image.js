require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { uploadImage } = require('../services/cloudinary');
const db = require('../config/database');

async function uploadRecipeImage() {
  try {
    // Lire l'image
    const imagePath = 'C:\\Users\\evanl\\Downloads\\OIP.jpg';
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    console.log('Uploading image to Cloudinary...');

    // Upload sur Cloudinary dans le dossier recipe
    const imageUrl = await uploadImage(imageBase64, 'recipe', 'gratin-dauphinois');

    console.log('Image uploaded successfully:', imageUrl);

    // Mettre à jour la recette "Gratin dauphinois" dans la base de données
    const result = await db.query(
      `UPDATE recipes SET image_name = $1 WHERE LOWER(title) LIKE '%gratin dauphinois%' RETURNING id, title`,
      [imageUrl]
    );

    if (result.rows.length > 0) {
      console.log('Recipe updated:', result.rows[0]);
    } else {
      console.log('No recipe found with "gratin dauphinois" in title');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

uploadRecipeImage();
