import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Table } from 'react-bootstrap';

export default function Actions({loadingActions, actions,onSelected}){
    if(loadingActions) {
        return <Spinner animation="border" />
    }
    if(actions.length === 0){
        return <Alert variant="info">Aucune action récente</Alert>
    }
    return (
          <Table striped bordered hover size="sm" className='table'>
            <thead>
              <tr>
                <th scope="col">Incident</th>
                <th scope="col">Type d'action</th>
                <th scope="col">Commentaire</th>
                <th scope="col">Action</th>
                <th scope="col">Acteur</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action, idx) => (
                <tr key={idx} onClick={() => onSelected(action)} style={{ cursor: 'pointer' }}>
                  <td>{action.incident}</td>
                  <td>{action.type_action === 'Autre' ? action.type_action_autre : action.type_action} {action.destination === 'Autre' ? ` (${action.destination_autre})` : action.destination ? `(${action.destination}) ` : ''}</td>
                  <td>{action.commentaire}</td>
                  <td>{action.script ? `\nScript : ${action.script} ` : ''}{action.parent ? `\nParent : ${action.parent} ` : ''}{action.probleme ? `\nProbleme : ${action.probleme} ` : ''} {action.ticket_jira ? `\nJira : ${action.ticket_jira}` : ''}</td>
                  <td>{action.user_action}</td>
                </tr>
              ))}
            </tbody>
          </Table>)
    
}