
//structure actions
//id;incident;date_action;type_action;commentaire;destination;destination_autre;script;parent;probleme

const SHEET_ID_N2APPS = PropertiesService.getScriptProperties().getProperty('SHEET_ID_N2APPS')
const ENABLED_CHAT_MESSAGE = true;

/**
 * Fetches actions from the database.
 * @returns {Array} An array of action objects.
 */
function getActions(){
    const N2APPS = SpreadsheetApp.openById(SHEET_ID_N2APPS)
    const actions = N2APPS.getSheetByName("actions")
    const data = actions.getDataRange().getValues()
    const headers = data[0]
    const actionsList = []
    for (let i = 1; i < data.length; i++) {
        const action = {}
        for (let j = 0; j < headers.length; j++) {
            action[headers[j]] = data[i][j]
        }
        actionsList.push(action)
    }
    return actionsList
}

/**
 * Fetches an action by its ID.
 * @param {number} id - The ID of the action to fetch.
 * @returns {Object|null} The action object if found, otherwise null.
 **/
function getActionById(id){
    const actions = getActions()
    for (let i = 0; i < actions.length; i++) {
        if (actions[i].id == id) {
            return {...actions[i], index:i+1}
        }
    }
    return null
}

/**
 * Adds a new action to the database.
 * @param {Object} action - The action to add.
 * @returns {Object} The added action with its ID.
 */
function addAction(action) {
    if (!action || !action.incident || !action.type_action) {
        throw new Error(`Invalid action data - incident and type_action are required fields ${action.incident} ${action.type_action}`);
    }

    const N2APPS = SpreadsheetApp.openById(SHEET_ID_N2APPS);
    const actionsSheet = N2APPS.getSheetByName("actions");

    
    var user = Session.getActiveUser();
    var email = user.getEmail();
    var fullName = "";
     try {
        var people = People.People.get("people/me", { personFields: "names" });
        if (people.names && people.names.length > 0) {
            fullName = people.names[0].displayName;
        }
    } catch (e) {
        console.error("Error fetching user name:", e);
        fullName = email; // fallback
    }
    action.user_action = fullName;

    action.id = new Date().getTime(); // Use timestamp as unique ID
    var headers = actionsSheet.getRange(1, 1, 1, actionsSheet.getLastColumn()).getValues()[0];
    var row = headers.map(h => action[h] || "");
    actionsSheet.appendRow(row);
    

    let message = `${action.incident} : [${action.type_action === "Autre" ? action.type_action_autre : action.type_action}] ${action.destination === "Autre" ? action.destination_autre : action.destination} 
${action.commentaire}
${action.ticket_jira ? action.ticket_jira : ''}
${action.user_action} `
    if(ENABLED_CHAT_MESSAGE){
        sendMessage({ text: message, formattedText: message })
    }else{
        console.log("Chat message disabled, not sending:", message);
    }
    
    return action;
}

/**
 * Updates an existing action in the database.
 * @param {Object} action - The action to update.
 * @returns {Object} The updated action.
 */
function updateAction(action) {
    if (!action || !action.id) {
        throw new Error("Invalid action data");
    }

    const existingAction = getActionById(action.id);
    if (!existingAction) {
        throw new Error("Action does not exist");
    }

    const N2APPS = SpreadsheetApp.openById(SHEET_ID_N2APPS);
    const actionsSheet = N2APPS.getSheetByName("actions");
    const rowIndex = existingAction.index; // Assuming ID corresponds to row index

    
    var headers = actionsSheet.getRange(1, 1, 1, actionsSheet.getLastColumn()).getValues()[0];
    var row = headers.map(h => action[h] || "");
    console.log("Updating action at row index:", rowIndex, "with data:", row);
    actionsSheet.getRange(rowIndex+1, 1, 1, actionsSheet.getLastColumn()).setValues([row]);

    return action;
}

/**
 * Deletes an action from the database.
 * @param {number} id - The ID of the action to delete.
 */
function deleteAction(id) {
    const existingAction = getActionById(id);
    if (!existingAction) {
        throw new Error("Action does not exist");
    }
    const N2APPS = SpreadsheetApp.openById(SHEET_ID_N2APPS);
    const actionsSheet = N2APPS.getSheetByName("actions");
    const rowIndex = existingAction.id; // Assuming ID corresponds to row index
    actionsSheet.deleteRow(rowIndex + 1); // Delete the row
    return { success: true, message: "Action deleted successfully" };
}

/**
 * Fetches the last 10 actions from the database.
 * @returns {string} JSON string of the last 10 actions
 */
function getLastActions() {
  const sheet = SpreadsheetApp.openById(SHEET_ID_N2APPS).getSheetByName("actions");
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const actions = [];
  for (let i = data.length - 1; i > 0 && actions.length < 10; i--) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    actions.push(row);
  }
  return JSON.stringify(actions);
}

//structure incidents
//incident;date;motif;sujet;url;noSoc;noContrat;noDevis;noProspect;noPers;noSinistre;object

const SHEET_ID_N2INCIDENTS = PropertiesService.getScriptProperties().getProperty('SHEET_ID_N2INCIDENTS')

/**
 * Fetches incidents from the database.
 * @returns {Array} An array of incident objects.
 */
function getIncidents() {
    const N2INCIDENTS = SpreadsheetApp.openById(SHEET_ID_N2INCIDENTS);
    const incidentsSheet = N2INCIDENTS.getSheetByName("Incident entrant");

    const data = incidentsSheet.getDataRange().getValues();
    const headers = data[0];
    const incidentsList = [];
    for (let i = 1; i < data.length; i++) {
        const incident = {};
        for (let j = 0; j < headers.length; j++) {
            incident[headers[j]] = data[i][j];
        }
        incidentsList.push(incident);
    }
    return JSON.stringify({ incidents: incidentsList, lastRow: incidentsSheet.getLastRow()-1 });//-1 ligne pour supprimé le header
}

/**
 * Fetches an incident by its ID.
 * @param {number} noIncident - The ID of the incident to fetch.
 * @returns {Object|null} The incident object if found, otherwise null.
 */
function getIncidentById(noIncident) {
    const incidents = getIncidents();
    for (let i = 0; i < incidents.length; i++) {
        if (incidents[i].incident == noIncident) {
            return incidents[i];
        }
    }
    return null;
}

/** 
 * updates an existing incident in the database.
 * @param {Object} incident - The incident to add.
 * @returns {Object} The added incident with its ID.    
 **/
function updateIncident(incident) {
    if (!incident || !incident.incident) {
        throw new Error("Invalid incident data");
    }

    const existingIncident = getIncidentById(incident.incident);
    if (!existingIncident) {
        throw new Error("Incident does not exist");
    }

    const N2INCIDENTS = SpreadsheetApp.openById(SHEET_ID_N2INCIDENTS);
    const incidentsSheet = N2INCIDENTS.getSheetByName("Incident entrant");
    const rowIndex = existingIncident.incident; // Assuming incident ID corresponds to row index
    
    
    var headers = incidentsSheet.getRange(1, 1, 1, incidentsSheet.getLastColumn()).getValues()[0];
    var row = headers.map(h => incident[h] || "");
    incidentsSheet.getRange(rowIndex + 1, 1, 1, incidentsSheet.getLastColumn()).setValues([row]);

    return getIncidentById(incident.incident);
}

const FOLDER_ID_UPLOAD_FILE = PropertiesService.getScriptProperties().getProperty('FOLDER_ID_UPLOAD_FILE');

function uploadFile(fileContent, fileName, fileType) {
  try {
    // Convertir la chaîne Base64 en un tableau de bytes
    var bytes = Utilities.base64Decode(fileContent);

    // Créer un blob à partir des bytes
    var blob = Utilities.newBlob(bytes, fileType, fileName);

    // Spécifiez le dossier où vous voulez uploader les fichiers
    var folderId = FOLDER_ID_UPLOAD_FILE;
    var folder = DriveApp.getFolderById(folderId);

    // Créer le fichier dans Google Drive
    var file = folder.createFile(blob);
    return { status: 'success', fileId: file.getId() , fileUrl: file.getDownloadUrl()};
  } catch (error) {
    return { status: 'error', message: error.toString() };
  }
}