import React, { useState } from "react";
import { Modal, Button, Form, Table, Collapse } from "react-bootstrap";
import MotifCollapse from "./MotifCollapse";

export default function SearchIncidentModal({ show, onHide, incidents, actions }) {
  const [searchField, setSearchField] = useState("motif");
  const [searchValue, setSearchValue] = useState("");
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    var seen = {};
    const val = searchValue.trim()?.toLowerCase();
    if (!val) return setResults([]);
    setResults(
      incidents.filter((inc) => {
        const field = inc[searchField];
        return field && field?.toString()?.toLowerCase()?.includes(val);
      }).filter(function(item) {
        var k = item.incident;
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
    );
  };

  // Associe les actions à l'incident
  const getActionsForIncident = (incidentNum) =>
    actions.filter((a) => a.incident === incidentNum);

  return (
    <Modal fullscreen={true} show={show} onHide={onHide} size="xl" >
      <Modal.Header closeButton>
        <Modal.Title>Recherche d'incidents</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSearch} className="mb-3">
          <Form.Group className="d-flex align-items-end">
            <Form.Label className="me-2 mb-0">Rechercher par</Form.Label>
            <Form.Select
              value={searchField}
              onChange={(e) => setSearchField(e.target.value)}
              className="me-2"
              style={{ width: 180 }}
            >
              <option value="motif">Motif</option>
              <option value="noSoc">NoSoc</option>
              <option value="noContrat">NoContrat</option>
              <option value="noDevis">NoDevis</option>
              <option value="noProspect">NoProspect</option>
              <option value="noPers">NoPers</option>
              <option value="noSinistre">NoSinistre</option>
            </Form.Select>
            <Form.Control
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder="Valeur à rechercher"
              className="me-2"
            />
            <Button type="submit" variant="primary">
              Rechercher
            </Button>
          </Form.Group>
        </Form>
        <Table striped bordered hover size="sm" responsive>
          <thead>
            <tr>
              <th>Numéro</th>
              <th>Motif</th>
              <th>Sujet</th>
              <th>Objet</th>
              <th>Actions associées</th>
              <th>NoSoc</th>
              <th>NoContrat</th>
              <th>NoDevis</th>
              <th>NoProspect</th>
              <th>NoPers</th>
              <th>NoSinistre</th>
            </tr>
          </thead>
          <tbody>
            {results.map((inc, idx) => (
              <tr key={inc.incident || idx}>
                <td title={inc.date}><a
                    href={inc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >{inc.incident}</a></td>
                <td>
                  <MotifCollapse motif={inc.motif} />
                </td>
                <td>{inc.sujet}</td>
                <td>{inc.object}</td>
                <td>
                  {getActionsForIncident(inc.incident).length > 0
                    ? getActionsForIncident(inc.incident)
                        .map(
                          (a) =>
                            `${a.type_action} (${a.destination || a.script || a.parent || a.probleme || ""})`
                        )
                        .join(", ")
                    : "-"}
                </td>
                <td>{inc.noSoc}</td>
                <td>{inc.noContrat}</td>
                <td>{inc.noDevis}</td>
                <td>{inc.noProspect}</td>
                <td>{inc.noPers}</td>
                <td>{inc.noSinistre}</td>
              </tr>
            ))}
          </tbody>
        </Table>
        {results.length === 0 && <div>Aucun résultat</div>}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}