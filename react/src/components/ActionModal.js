import React, { useState, useRef } from "react";
import { Modal, Button, Form, Row, Col, Badge, Spinner } from "react-bootstrap";
import MotifCollapse from "./MotifCollapse";
import { useEffect } from "react";

const DEFAULT_ACTION = {
  id: null,
  incident: "",
  incidentInput: "",
  type_action: "Transfert",
  commentaire: "",
  destination: "",
  destination_autre: "",
  script: "",
  parent: "",
  probleme: "",
  files: [],
  ticket_jira: "",
  type_action_autre: "",
};

function getThumbnailUrl(file) {
  // Currently supports Google Drive, can be extended for other providers
  if (file.fileId && file.fileType && file.fileType.startsWith("image/")) {
    return "https://drive.google.com/thumbnail?id="+file.fileId+"&sz=w1000";
  }
  return file.fileUrl;
}

export default function ActionModal({
  show,
  onHide,
  loadingIncidents,
  incidents,
  destinations,
  handleClose,
  onError,
  fetchLastActions,
  action,
}) {
  // Pour l'autocomplétion
  const [suggestions, setSuggestions] = useState([]);
  const [readOnly, setReadOnly] = useState(false);
  const inputFile = useRef(null);
  const [actionForm, setActionForm] = useState(DEFAULT_ACTION);
  const [loading, setLoading] = useState(false);
  const [loadingPieceJointe, setLoadingPieceJointe] = useState(false);

  useEffect(() => {
    console.log("ActionForm updated:", action);
    if (action === null || action === undefined) {
      // Réinitialiser le formulaire si aucune action n'est sélectionnée
      setActionForm(DEFAULT_ACTION);
      setReadOnly(false);
      return;
    } else {
      // Réinitialiser le formulaire si l'action est modifiée
      setActionForm(() => ({
        ...action,
        incidentInput: action.incident,
        files: action.files !== "" ? JSON.parse(action.files) : [],
      }));
      setReadOnly(true); // Passer en mode lecture seule si une action est sélectionnée
    }
  }, []);

  // Recherche de l'incident sélectionné ou saisi
  const selectedIncident = incidents.find(
    (inc) => inc.incident === (actionForm.incidentInput || actionForm.incident)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    const action = {
      ...actionForm,
      destination_autre:
        actionForm.destination === "Autre" ? actionForm.destination_autre : "",
      type_action:
        actionForm.type_action === "Autre"
          ? actionForm.type_action_autre
          : actionForm.type_action,
      date: new Date().toISOString(),
      files: JSON.stringify(actionForm.files),
    };
    if (window.google && window.google.script && window.google.script.run) {
      var callBackend = window.google.script.run
        .withSuccessHandler(() => {
          handleClose();
          setLoading(false);
          fetchLastActions(); // Recharger les actions après l'ajout
        })
        .withFailureHandler(() => {
          setLoading(false);
          onError("Erreur lors de l'enregistrement de l'action");
        });
      if (action.id === null || action.id === undefined) {
        callBackend.addAction(action);
      } else {
        callBackend.updateAction(action);
      }
    } else {
      setLoading(false);
      onError("google.script.run non disponible");
    }
  };

  const handleIncidentInput = (e) => {
    const value = e.target.value;
    handleActionFormChange("incident", value);
    // Suggestions sur les incidents commençant par la saisie
    if (value.length > 5) {
      var seen = {};
      setSuggestions(
        incidents
          .filter(
            (inc) =>
              inc.incident &&
              inc.incident
                ?.toString()
                ?.toLowerCase()
                ?.startsWith(value?.toLowerCase())
          )
          .filter(function (item) {
            var k = item.incident;
            return seen.hasOwnProperty(k) ? false : (seen[k] = true);
          })
          .slice(0, 10)
      );
    } else {
      setSuggestions([]);
    }
  };

  const handleActionFormChange = (field, value) => {
    setActionForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSuggestionClick = (incidentNum) => {
    handleActionFormChange("incident", incidentNum);
    setSuggestions([]);
  };

  const identiqueIncident = (field, value) => {
    try {
      console.log(`value = ${value} field = ${field}`);
      if (!value) {
        return;
      }
      var seen = {};
      return incidents
        .filter((inc) => {
          return (
            inc[field] &&
            actionForm.incident !== inc.incident &&
            inc[field]?.toString()?.toLowerCase() ===
              value?.toString()?.toLowerCase()
          );
        })
        .filter(function (item) {
          var k = item.incident;
          return seen.hasOwnProperty(k) ? false : (seen[k] = true);
        });
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const handleUploadFile = () => {
    setLoadingPieceJointe(true);
    if (window.google && window.google.script && window.google.script.run) {
      if (inputFile.current.files.length > 0) {
        const file = inputFile.current.files[0];
        const reader = new FileReader();

        reader.onload = function (e) {
          const fileContent = e.target.result.split(",")[1];
          const fileName = file.name;
          const fileType = file.type;
          window.google.script.run
            .withSuccessHandler((result) => {
              setLoadingPieceJointe(false);
              console.log("Fichier envoyé avec succès", result);
              setActionForm((prev) => ({
                ...prev,
                files: [
                  ...prev.files,
                  {
                    fileId: result.fileId,
                    fileUrl: result.fileUrl,
                    fileName: fileName,
                    fileType: fileType,
                  },
                ],
              }));
              inputFile.current.value = ""; // Réinitialiser le champ de fichier
            })
            .withFailureHandler(() => {
              setLoadingPieceJointe(false);
              onError("Erreur lors de l'envoi du fichier");
            })
            .uploadFile(fileContent, fileName, fileType);
        };

        reader.readAsDataURL(file);
      }
    } else {
      setLoadingPieceJointe(false);
      onError("google.script.run non disponible");
    }
  };

  const handleEditMode = () => {
    setReadOnly(false); // Passe la modal en mode édition
  };

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton closeVariant="white">
        {!readOnly && actionForm.id === null && (
          <Modal.Title>Ajouter une action sur un incident</Modal.Title>
        )}
        {readOnly && (
          <Modal.Title>
            Action sur l'incident {actionForm.incident} #{actionForm.id}
          </Modal.Title>
        )}
        {!readOnly && actionForm.id !== null && (
          <Modal.Title>
            Modifier l'action {actionForm.incident} #{actionForm.id}
          </Modal.Title>
        )}
      </Modal.Header>
      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Form.Group className="mb-3" style={{ position: "relative" }}>
            <Form.Label>Incident</Form.Label>
            <Form.Control
              type="text"
              placeholder="Numéro d'incident"
              value={actionForm.incident}
              onChange={handleIncidentInput}
              autoComplete="off"
            />
            {/* Suggestions d'autocomplétion */}
            {suggestions.length > 0 && (
              <div
                style={{
                  position: "absolute",
                  zIndex: 10,
                  backgroundColor: "#23272f",
                  border: "1px solid #ccc",
                  width: "100%",
                  maxHeight: 200,
                  overflowY: "auto",
                }}
              >
                {suggestions?.map((inc, idx) => (
                  <div
                    key={inc.incident || idx}
                    style={{ padding: "4px 8px", cursor: "pointer" }}
                    onClick={() => handleSuggestionClick(inc.incident)}
                  >
                    {inc.incident}
                  </div>
                ))}
              </div>
            )}
          </Form.Group>

          {/* Affichage des infos de l'incident si trouvé */}
          {selectedIncident && (
            <div className="mb-3 p-2 border rounded">
              {selectedIncident.url && (
                <div>
                  <a
                    href={selectedIncident.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {selectedIncident.incident}
                  </a>
                </div>
              )}
              {selectedIncident.object && (
                <div>
                  <b>Objet :</b> {selectedIncident.object}
                </div>
              )}
              {selectedIncident.sujet && (
                <div>
                  <b>Sujet :</b> {selectedIncident.sujet}{" "}
                </div>
              )}
              {selectedIncident.noSoc && (
                <div>
                  <b>NoSoc :</b> {selectedIncident.noSoc}
                  {selectedIncident.noSoc &&
                    identiqueIncident("noSoc", selectedIncident.noSoc).length >
                      0 && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        title={identiqueIncident(
                          "noSoc",
                          selectedIncident.noSoc
                        )
                          ?.map((inc) => inc.incident)
                          .join(",")}
                      >
                        {
                          identiqueIncident("noSoc", selectedIncident.noSoc)
                            .length
                        }{" "}
                        incidents
                      </Badge>
                    )}
                </div>
              )}
              {selectedIncident.noContrat && (
                <div>
                  <b>NoContrat :</b> {selectedIncident.noContrat}
                  {selectedIncident.noContrat &&
                    identiqueIncident("noContrat", selectedIncident.noContrat)
                      .length > 0 && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        title={identiqueIncident(
                          "noContrat",
                          selectedIncident.noContrat
                        )
                          ?.map((inc) => inc.incident)
                          .join(",")}
                      >
                        {
                          identiqueIncident(
                            "noContrat",
                            selectedIncident.noContrat
                          ).length
                        }{" "}
                        incidents
                      </Badge>
                    )}
                </div>
              )}
              {selectedIncident.noDevis && (
                <div>
                  <b>NoDevis :</b> {selectedIncident.noDevis}
                  {selectedIncident.noDevis &&
                    identiqueIncident("noDevis", selectedIncident.noDevis)
                      .length > 0 && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        title={identiqueIncident(
                          "noDevis",
                          selectedIncident.noDevis
                        )
                          ?.map((inc) => inc.incident)
                          .join(",")}
                      >
                        {
                          identiqueIncident("noDevis", selectedIncident.noDevis)
                            .length
                        }{" "}
                        incidents
                      </Badge>
                    )}
                </div>
              )}
              {selectedIncident.noProspect && (
                <div>
                  <b>NoProspect :</b> {selectedIncident.noProspect}
                  {selectedIncident.noProspect &&
                    identiqueIncident("noProspect", selectedIncident.noProspect)
                      .length > 0 && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        title={identiqueIncident(
                          "noProspect",
                          selectedIncident.noProspect
                        )
                          ?.map((inc) => inc.incident)
                          .join(",")}
                      >
                        {
                          identiqueIncident(
                            "noProspect",
                            selectedIncident.noProspect
                          ).length
                        }{" "}
                        incidents
                      </Badge>
                    )}
                </div>
              )}
              {selectedIncident.noPers && (
                <div>
                  <b>NoPers :</b> {selectedIncident.noPers}
                  {selectedIncident.noPers &&
                    identiqueIncident("noPers", selectedIncident.noPers)
                      .length > 0 && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        title={identiqueIncident(
                          "noPers",
                          selectedIncident.noPers
                        )
                          ?.map((inc) => inc.incident)
                          .join(",")}
                      >
                        {
                          identiqueIncident("noPers", selectedIncident.noPers)
                            .length
                        }{" "}
                        incidents
                      </Badge>
                    )}
                </div>
              )}
              {selectedIncident.noSinistre && (
                <div>
                  <b>NoSinistre :</b> {selectedIncident.noSinistre}
                  {selectedIncident.noSinistre &&
                    identiqueIncident("noSinistre", selectedIncident.noSinistre)
                      .length > 0 && (
                      <Badge
                        bg="secondary"
                        className="ms-2"
                        title={identiqueIncident(
                          "noSinistre",
                          selectedIncident.noSinistre
                        )
                          ?.map((inc) => inc.incident)
                          .join(",")}
                      >
                        {
                          identiqueIncident(
                            "noSinistre",
                            selectedIncident.noSinistre
                          ).length
                        }{" "}
                        incidents
                      </Badge>
                    )}
                </div>
              )}
              {/* Motif long, caché par défaut */}
              {selectedIncident.motif && (
                <div>
                  <b>Motif :</b>
                  <MotifCollapse motif={selectedIncident.motif} />
                </div>
              )}
            </div>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Type d'action</Form.Label>
            <Form.Control
              as="select"
              value={actionForm.type_action}
              onChange={(e) =>
                handleActionFormChange("type_action", e.target.value)
              }
            >
              <option>Transfert</option>
              <option>Cloturé</option>
              <option>Renvoyé</option>
              <option>Lié</option>
              <option>Message envoyé</option>
              <option>Reponse au refus</option>
              <option>Création JIRA</option>
              <option>Autre</option>
            </Form.Control>
            {actionForm.type_action === "Autre" && (
              <Form.Control
                className="mt-2"
                type="text"
                placeholder="Saisir le type d'action"
                value={actionForm.type_action_autre || ""}
                onChange={(e) =>
                  handleActionFormChange("type_action_autre", e.target.value)
                }
              />
            )}
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Commentaire</Form.Label>
            <Form.Control
              as="textarea"
              rows={2}
              value={actionForm.commentaire}
              onChange={(e) =>
                handleActionFormChange("commentaire", e.target.value)
              }
            />
          </Form.Group>
          <Form.Group className="mb-3">
            <Form.Label>Destination</Form.Label>
            <Form.Control
              as="select"
              value={actionForm.destination}
              onChange={(e) =>
                handleActionFormChange("destination", e.target.value)
              }
            >
              {destinations?.map((dest) => (
                <option key={dest}>{dest}</option>
              ))}
            </Form.Control>
            {actionForm.destination === "Autre" && (
              <Form.Control
                className="mt-2"
                type="text"
                placeholder="Saisir la destination"
                value={actionForm.destination_autre}
                onChange={(e) =>
                  handleActionFormChange("destination_autre", e.target.value)
                }
              />
            )}
          </Form.Group>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Parent</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Numéro d'incident parent"
                  value={actionForm.parent}
                  onChange={(e) =>
                    handleActionFormChange("parent", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Problème</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Numéro du problème"
                  value={actionForm.probleme}
                  onChange={(e) =>
                    handleActionFormChange("probleme", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>Script</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Numéro du script"
                  value={actionForm.script}
                  onChange={(e) =>
                    handleActionFormChange("script", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
            <Col>
              <Form.Group className="mb-3">
                <Form.Label>JIRA</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Numéro du JIRA"
                  value={actionForm.ticket_jira}
                  onChange={(e) =>
                    handleActionFormChange("ticket_jira", e.target.value)
                  }
                />
              </Form.Group>
            </Col>
          </Row>
          <Form.Group className="mb-3">
            <Form.Label>Piece Jointe</Form.Label>
            <Form.Text className="text-muted d-block">
              {actionForm.files.map((f) => (
                <a
                  href={getThumbnailUrl(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {f.fileName}
                </a>
              ))}
            </Form.Text>
            {!readOnly && (
              <>
                <Form.Control type="file" ref={inputFile} />
                <Button
                  variant="secondary"
                  className="mt-2"
                  onClick={handleUploadFile}
                  disabled={loadingPieceJointe}
                >
                {loadingPieceJointe && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                )}
                {!loadingPieceJointe && "Ajouter une pièce jointe"}
                </Button>
              </>
            )}
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          {readOnly === false && (
            <>
              <Button variant="secondary" onClick={onHide}>
                Annuler
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading && (
                  <Spinner
                    as="span"
                    animation="border"
                    size="sm"
                    role="status"
                    aria-hidden="true"
                  />
                )}
                {!loading && "Enregistrer"}
              </Button>
            </>
          )}
          {readOnly === true && (
            <>
              <Button
                variant="warning"
                onClick={() => {
                  // Appelle la fonction pour activer le mode édition (à définir dans le parent)
                  if (typeof handleEditMode === "function") handleEditMode();
                }}
              >
                Modifier
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  if (
                    window.confirm(
                      "Voulez-vous vraiment supprimer cette action ?"
                    )
                  ) {
                    if (
                      window.google &&
                      window.google.script &&
                      window.google.script.run
                    ) {
                      window.google.script.run
                        .withSuccessHandler(() => {
                          onHide();
                          fetchLastActions();
                        })
                        .withFailureHandler(() => {
                          onError("Erreur lors de la suppression de l'action");
                        })
                        .deleteAction(actionForm.id); // Assure-toi que l'id est bien passé
                    } else {
                      onError("google.script.run non disponible");
                    }
                  }
                }}
              >
                Supprimer
              </Button>
            </>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
