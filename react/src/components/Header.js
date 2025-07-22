import React from 'react';
import { Button, Navbar, Container, Badge, Spinner } from 'react-bootstrap';

export default function Header({ onAddAction, onSearch, refreshing, incidentsCount, lastRow }) {
  return (
    <Navbar bg="dark" variant="dark" style={{ backgroundColor: '#282c34' }}>
      <Container>
        <Navbar.Brand>N2Apps - Incidents</Navbar.Brand>
        <div>
          <Button variant="info" onClick={onSearch} className="me-3">
            Recherche
          </Button>
          <Button variant="light" onClick={onAddAction} className="me-3">
            Ajouter une action
          </Button>
          <Badge bg="info">
            {refreshing ? (
              <>
                <Spinner animation="border" size="sm" /> Chargement...
              </>
            ) : (
              <>
                {incidentsCount} {lastRow ? `/ ${lastRow}` : ''} incidents
              </>
            )}
          </Badge>
        </div>
      </Container>
    </Navbar>
  );
}