import React, { useState } from 'react';
import { Modal, Spinner, Button, Table, Form } from 'react-bootstrap';


function getThumbnailUrl(file) {
  // Currently supports Google Drive, can be extended for other providers
  if (file.fileId && file.fileType && file.fileType.startsWith("image/")) {
    return "https://drive.google.com/thumbnail?id="+file.fileId+"&sz=w1000";
  }
  return file.fileUrl;
}

export const AllActionModal = ({
  show,
  onHide,
  actions,
  loadingActions,
  onSelectAction,
}) => {
  const [searchField, setSearchField] = useState('incident');
  const [searchValue, setSearchValue] = useState('');
  const [filteredActions, setFilteredActions] = useState(actions);

  React.useEffect(() => {
    setFilteredActions(actions);
  }, [actions]);

  const handleSearch = (e) => {
    e.preventDefault();
    const val = searchValue.trim().toLowerCase();
    if (!val) {
      setFilteredActions(actions);
      return;
    }
    setFilteredActions(
      actions.filter((action) => {
        const field = action[searchField];
        return field && field.toString().toLowerCase().includes(val);
      })
    );
  };

  return (
    <Modal show={show} onHide={onHide} size="xl" centered fullscreen={true}>
      <Modal.Header closeButton className="text-white" closeVariant="white">
        <Modal.Title>Toutes les actions</Modal.Title>
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
              <option value="incident">Numéro d'incident</option>
              <option value="type_action">Type d'action</option>
              <option value="destination">Destination</option>
              <option value="script">Script</option>
              <option value="parent">Parent</option>
              <option value="probleme">Problème</option>
              <option value="commentaire">Commentaire</option>
              <option value="user_action">Acteur</option>
              <option value="date_action">Date</option>
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
        {loadingActions ? (
          <Spinner animation="border" />
        ) : (
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Type d'action</th>
                <th>Destination</th>
                <th>Script</th>
                <th>Parent</th>
                <th>Problème</th>
                <th>Commentaire</th>
                <th>Pièces jointes</th>
                <th>Acteur</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredActions.map((action) => (
                <tr key={action.id || action.incident + action.date_action}>
                  <td>{action.incident}</td>
                  <td>{action.type_action}</td>
                  <td>{action.destination || ''}</td>
                  <td>{action.script || ''}</td>
                  <td>{action.parent || ''}</td>
                  <td>{action.probleme || ''}</td>
                  <td>{action.commentaire || ''}</td>
                  <td>{action.files && JSON.parse(action.files).map((f) => (
                <a
                  href={getThumbnailUrl(f)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {f.fileName}
                </a>
              ))}</td>
                  <td>{action.user_action || ''}</td>
                  <td>{action.date || ''}</td>
                  <td>
                    <Button
                      size="sm"
                      variant="info"
                      onClick={() => onSelectAction(action)}
                    >
                      Voir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Fermer
        </Button>
      </Modal.Footer>
    </Modal>
  );
}