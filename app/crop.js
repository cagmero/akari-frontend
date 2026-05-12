const sharp = require('sharp');

async function cropImages() {
  try {
    await sharp('public/akari_icon_logo.png')
      .trim()
      .toFile('public/akari_icon_logo_cropped.png');
    console.log('Cropped icon logo');

    await sharp('public/akari_english_logo.png')
      .trim()
      .toFile('public/akari_english_logo_cropped.png');
    console.log('Cropped english logo');
  } catch (error) {
    console.error('Error cropping images:', error);
  }
}

cropImages();
