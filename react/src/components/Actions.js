import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Table } from 'react-bootstrap';

export default function Actions({loadingActions, actions}){
    if(loadingActions) {
        return <Spinner animation="border" />
    }
    if(actions.length === 0){
        return <Alert variant="info">Aucune action récente</Alert>
    }
    return (
          <Table striped bordered hover size="sm">
            <thead>
              <tr>
                <th>Incident</th>
                <th>Type d'action</th>
                <th>Action</th>
                <th>Acteur</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, idx) => (
                <tr key={idx}>
                  <td>{action.incident}</td>
                  <td>{action.type_action === 'Autre' ? action.type_action_autre : action.type_action}</td>
                  <td>{action.destination === 'Autre' ? action.destination_autre+' ': action.destination ? action.destination+' ' : ''}{action.script ? action.script+' ' : ''}{action.parent ? action.parent+' ' : ''}{action.probleme ? action.probleme+' ' : ''}</td>
                  <td>{action.user_action}</td>
                </tr>
              ))}
            </tbody>
          </Table>)
    
}