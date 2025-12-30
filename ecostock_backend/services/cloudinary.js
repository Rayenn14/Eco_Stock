const cloudinary = require('cloudinary').v2;

// Configuration Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Upload une image base64 vers Cloudinary
 * @param {string} imageBase64 - Image en format base64
 * @param {string} folder - Dossier de destination (optionnel)
 * @param {string} publicId - Public ID personnalisé (optionnel)
 * @returns {Promise<string>} - URL de l'image uploadée
 */
const uploadImage = async (imageBase64, folder = 'ecostock', publicId = null) => {
  try {
    console.log('[Cloudinary] Uploading image to folder:', folder);

    const uploadOptions = {
      folder: folder,
      resource_type: 'auto',
      quality: 'auto:good',
      fetch_format: 'auto'
    };

    // Ajouter le public_id si fourni
    if (publicId) {
      uploadOptions.public_id = publicId;
      uploadOptions.overwrite = true;
    }

    const result = await cloudinary.uploader.upload(imageBase64, uploadOptions);

    console.log('[Cloudinary] Upload successful:', result.secure_url);
    return result.secure_url;
  } catch (error) {
    console.error('[Cloudinary] Upload error:', error);
    throw new Error('Erreur lors de l\'upload de l\'image sur Cloudinary');
  }
};

/**
 * Supprime une image de Cloudinary
 * @param {string} publicId - Public ID de l'image (extrait de l'URL)
 * @returns {Promise<void>}
 */
const deleteImage = async (publicId) => {
  try {
    console.log('[Cloudinary] Deleting image:', publicId);
    await cloudinary.uploader.destroy(publicId);
    console.log('[Cloudinary] Image deleted successfully');
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    throw new Error('Erreur lors de la suppression de l\'image');
  }
};

module.exports = {
  uploadImage,
  deleteImage,
  cloudinary
};
