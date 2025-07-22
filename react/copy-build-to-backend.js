const fs = require('fs');
const path = require('path');

const buildDir = path.resolve(__dirname, 'build');
const cssDir = path.resolve(buildDir, 'static', 'css');
const jsDir = path.resolve(buildDir, 'static', 'js');
const backendDir = path.resolve(__dirname, '../appscript');
const frontendDir = path.join(backendDir, 'frontend');
const indexHtmlPath = path.join(buildDir, 'index.html');
const targetHtmlPath = path.join(frontendDir, 'index.html');

// Crée le dossier frontend s'il n'existe pas
if (!fs.existsSync(frontendDir)) {
  fs.mkdirSync(frontendDir);
}else{
  fs.rmSync(frontendDir, { recursive: true, force: true });
  fs.mkdirSync(frontendDir);
}

// Fonction utilitaire pour inliner un fichier dans une balise
function inlineFile(filePath, tag) {
  const content = fs.readFileSync(filePath, 'utf8');
  if (tag === 'js') return `<script>${content}</script>`;
  if (tag === 'css') return `<style>${content}</style>`;
  return '';
}

// Lis le index.html généré par React
let html = fs.readFileSync(indexHtmlPath, 'utf8');

// Concatène tous les scripts inlinés dans l'ordre
let inlinedScripts = '';

// Supprime les liens vers favicon, manifest, logo, etc.
html = html.replace(/<link[^>]+(icon|manifest|apple-touch-icon)[^>]*>/g, '');

// Expression régulière pour capturer le href
const regexLink = /<link[^>]* href=["']([^"']*)["'][^>]*>/g;

// Fonction de remplacement
html = html.replace(regexLink, (match, href) => {
  if(href.startsWith('http') || href.startsWith('//')) {
    // Si c'est un lien externe, on le garde tel quel
    return match;
  }
  inlinedScripts += `<?!= include('frontend${href.replace('/static/css','').replace('.css','.html')}'); ?>`;
  return ''
});


// Expression régulière pour capturer le src
const regexScript = /<script[^>]* src=["']([^"']*)["'][^>]*><\/script>/g;

// Fonction de remplacement
html = html.replace(regexScript, (match, src) => {
  if(src.startsWith('http') || src.startsWith('//')) {
    // Si c'est un lien externe, on le garde tel quel
    return match;
  }
  inlinedScripts += `<?!= include('frontend${src.replace('/static/js','').replace('.js','.html')}'); ?>`;
  return ''
});




// Ajoute un script de debug pour vérifier que le JS est bien exécuté
inlinedScripts += `<script>\nconsole.log('JS React inliné exécuté');\nvar rootDiv = document.getElementById('root');\nif(rootDiv) { rootDiv.insertAdjacentHTML('beforeend', '<div style=\\'color:green;font-weight:bold\\'>[DEBUG] JS React chargé</div>'); }\n</script>\n`;

// Injecte les scripts juste avant </body>
html = html.replace(/<\/body>/i, inlinedScripts + `<script src="https://cdn.jsdelivr.net/npm/react/umd/react.production.min.js" crossorigin></script>
<script
  src="https://cdn.jsdelivr.net/npm/react-dom/umd/react-dom.production.min.js"
  crossorigin></script>`);


function copyFilesRecursively(source, targetDir) {
    // Create target directory if it doesn't exist
    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(source);

    files.forEach(file => {
        const currentPath = path.join(source, file);
        const stat = fs.statSync(currentPath);

        if (stat.isDirectory()) {
            // Recursively copy files from subdirectories
            copyFilesRecursively(currentPath, targetDir);
        } else if(file.endsWith('.html')) {
            // Copy file
            const targetPath = path.join(targetDir, file);
            fs.copyFileSync(currentPath, targetPath);
            console.log(`Copied: ${currentPath} to ${targetPath}`);
        }
    });
}


// Fonction pour créer un fichier HTML avec le contenu JS
function createHtmlForJs(filePath, outputDir) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.js');
    const htmlContent = `<script>
        ${fileContent}
    </script>`;

    const outputPath = path.join(outputDir, `${fileName}.html`);
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`Created HTML for JS: ${outputPath}`);
}

// Fonction pour créer un fichier HTML avec la balise link pour CSS
function createHtmlForCss(filePath, outputDir) {
    const fileContent = fs.readFileSync(filePath, 'utf8');
    const fileName = path.basename(filePath, '.css');
    const htmlContent = `<style>
        ${fileContent}
    </style>`;

    const outputPath = path.join(outputDir, `${fileName}.html`);
    fs.writeFileSync(outputPath, htmlContent);
    console.log(`Created HTML for CSS: ${outputPath}`);
}

// Fonction pour parcourir les fichiers d'un répertoire
function processDirectory(directoryPath, outputDir) {
    const files = fs.readdirSync(directoryPath);

    files.forEach(file => {
        const filePath = path.join(directoryPath, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            processDirectory(filePath, outputDir); // Appel récursif pour les sous-répertoires
        } else if (path.extname(file) === '.js') {
            createHtmlForJs(filePath, outputDir);
        } else if (path.extname(file) === '.css') {
            createHtmlForCss(filePath, outputDir);
        }
    });
}

// Démarrer le traitement
processDirectory(cssDir, cssDir);
processDirectory(jsDir, jsDir);


copyFilesRecursively(buildDir, frontendDir)

// Écrit le HTML final dans backend/frontend/index.html
fs.writeFileSync(targetHtmlPath, html, 'utf8');
console.log('index.html avec JS/CSS inlinés et liens statiques supprimés copié dans backend/frontend/');
