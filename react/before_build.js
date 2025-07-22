const fs = require('fs');
const path = require('path');

// Fonction pour copier un fichier
function copyFileSync(source, target) {
    let targetFile = target;

    // Si le fichier cible est un dossier, un nouveau fichier avec le même nom est créé
    if (fs.existsSync(target) && fs.lstatSync(target).isDirectory()) {
        targetFile = path.join(target, path.basename(source));
    }

    fs.writeFileSync(targetFile, fs.readFileSync(source));
}

// Fonction pour copier un dossier de manière récursive
function copyDirSync(source, target) {
    // Créer le dossier cible s'il n'existe pas
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target);
    }

    // Lire le contenu du dossier source
    const files = fs.readdirSync(source);

    // Parcourir chaque fichier/dossier dans le dossier source
    files.forEach(file => {
        const curSource = path.join(source, file);
        const curTarget = path.join(target, file);

        // Si c'est un dossier, appel récursif
        if (fs.lstatSync(curSource).isDirectory()) {
            copyDirSync(curSource, curTarget);
        } else {
            // Si c'est un fichier, copier le fichier
            copyFileSync(curSource, curTarget);
        }
    });
}

// Chemins des dossiers source et cible
const sourceDir = './clasp';
const targetDir = '../backend/frontend';

// Appel de la fonction pour copier le contenu
copyDirSync(sourceDir, targetDir);

console.log('Copie terminée !');
