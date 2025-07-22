import React, { useState } from "react";
import { Modal, Button, Form, Row, Col, Spinner, Badge } from "react-bootstrap";
import MotifCollapse from "./MotifCollapse";

export default function ActionModal({
  show,
  onHide,
  loadingIncidents,
  incidents,
  destinations,
  handleClose,
  onError,
  fetchLastActions,
}) {
  // Pour l'autocomplétion
  const [suggestions, setSuggestions] = useState([]);
  const [actionForm, setActionForm] = useState({
    incident: "",
    incidentInput: "",
    type_action: "Transfert",
    commentaire: "",
    destination: "Equipe A",
    destination_autre: "",
    script: "",
    parent: "",
    probleme: "",
  });

  // Recherche de l'incident sélectionné ou saisi
  const selectedIncident = incidents.find(
    (inc) => inc.incident === (actionForm.incidentInput || actionForm.incident)
  );

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = {
      ...actionForm,
      destination_autre:
        actionForm.destination === "Autre" ? actionForm.destination_autre : "",
      type_action:
        actionForm.type_action === "Autre"
          ? actionForm.type_action_autre
          : actionForm.type_action,
      date_action: new Date().toISOString(),
    };
    if (window.google && window.google.script && window.google.script.run) {
      window.google.script.run
        .withSuccessHandler(() => {
          handleClose();
          fetchLastActions(); // Recharger les actions après l'ajout
        })
        .withFailureHandler(() => {
          onError("Erreur lors de l'enregistrement de l'action");
        })
        .addAction(action);
    } else {
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

  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>Ajouter une action sur un incident</Modal.Title>
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
                {suggestions.map((inc, idx) => (
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
                          .map((inc) => inc.incident)
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
                          .map((inc) => inc.incident)
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
                          .map((inc) => inc.incident)
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
                          .map((inc) => inc.incident)
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
                          .map((inc) => inc.incident)
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
                          .map((inc) => inc.incident)
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
              <option>Renvoyer</option>
              <option>Lié</option>
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
              {destinations.map((dest) => (
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
          <Form.Group className="mb-3">
            <Form.Label>Script</Form.Label>
            <Form.Control
              as="text"
              placeholder="Numéro du script"
              value={actionForm.script}
              onChange={(e) => handleActionFormChange("script", e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Annuler
          </Button>
          <Button variant="primary" type="submit">
            Enregistrer
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
