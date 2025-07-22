function doPost(e) {
  try {
    // Récupérer le blob du fichier envoyé depuis la requête POST
    var fileBlob = Utilities.newBlob(e.postData.contents, e.contentType, e.parameter.fileName);

    // Créer un fichier dans Google Drive
    var folderId = PropertiesService.getScriptProperties().getProperty('FOLDER_ID_UPLOAD_FILE'); 
    var folder = DriveApp.getFolderById(folderId);
    var file = folder.createFile(fileBlob);

    // Retourner une réponse de succès
    return ContentService.createTextOutput(JSON.stringify({status: 'success', fileId: file.getId()}))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    // Retourner une réponse en cas d'erreur
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
