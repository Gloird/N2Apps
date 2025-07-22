import './App.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useState, useEffect } from 'react';
import { Spinner, Alert, Table } from 'react-bootstrap';
import Header from './components/Header';
import ActionModal from './components/ActionModal';
import Actions from './components/Actions';
import SearchIncidentModal from './components/SearchIncidentModal';

const DESTINATIONS = [
  '',
  'Contrat Mob',
  'Contrat PC2',
  'Contrat Habitation PC',
  'Contrat Habitation PE',
  'Contrat Host',
  'Editique',
  'Activité',
  'Sinistre Mob',
  'Sinistre Corp',
  'Sinistre Hab',
  'Sinistre Host',
  'G2A',
  'Macif.fr',
  'UNIC',
  'ECM',
  'RAD/LAD',
  'Autre',
];

function App() {
  const [show, setShow] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [error, setError] = useState('');
  const [lastRow, setLastRow] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);

  // Fonction pour charger les incidents (toutes les pages)
  const fetchAllIncidents = () => {
    setRefreshing(true);
    setLoadingIncidents(true);
    setError('');
    let allIncidents = [];
    let lastRowFetched = null;

    function fetchPage() {
      if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
          .withSuccessHandler((result) => {
            result = JSON.parse(result);
            const data = result && result.incidents ? result.incidents : (Array.isArray(result) ? result : []);
            lastRowFetched = result && result.lastRow ? result.lastRow : null;
            allIncidents = allIncidents.concat(data);
            setIncidents(allIncidents.reverse());
            setLastRow(lastRowFetched);
            setLoadingIncidents(false);
            setRefreshing(false);
          })
          .withFailureHandler((err) => {
            setError('Erreur lors du chargement des incidents');
            setLoadingIncidents(false);
            setRefreshing(false);
          })
          .getIncidents();
      } else {
        setError('google.script.run non disponible');
        setLoadingIncidents(false);
        setRefreshing(false);
      }
    }
    fetchPage();
  };

  // Récupération les actions
  const fetchActions = () => {
    setLoadingActions(true);
    if (window.google && window.google.script && window.google.script.run) {
      window.google.script.run
        .withSuccessHandler((result) => {
          try {
            const data = result;
            console.log('Actions fetched:', data);
            setActions(Array.isArray(data) ? data : []);
          } catch (e){
            setError('Erreur lors du chargement des actions');
            console.error('Error parsing actions:', e);
            setActions([]);
          }
          setLoadingActions(false);
        })
        .withFailureHandler(() => {
          setActions([]);
          setLoadingActions(false);
        })
        .getActions(); 
    } else {
      setActions([]);
      setLoadingActions(false);
    }
  };

  // Charger au montage et toutes les 5 minutes
  useEffect(() => {
    fetchAllIncidents();
    fetchActions();
    const interval = setInterval(() => {
      fetchAllIncidents();
      fetchActions();
    }, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  const handleShow = () => setShow(true);
  const handleClose = () => setShow(false);

  return (
    <div className="App app-dark-bg" style={{ minHeight: "100vh" }}>
      <Header
        onAddAction={handleShow}
        onSearch={() => setShowSearch(true)}
        refreshing={refreshing}
        incidentsCount={incidents.length}
        lastRow={lastRow}
      />
      <div className="container mt-3">
        <h5 style={{ color: "#fff" }}>10 dernières actions</h5>
        <Actions loadingActions={loadingActions} actions={actions.reverse().slice(0, 10)} />
        {error && (
          <Alert variant="danger" style={{ margin: 10 }}>{error}</Alert>
        )}
      </div>
      <ActionModal
        show={show}
        onHide={handleClose}
        loadingIncidents={loadingIncidents}
        incidents={incidents}
        handleClose={handleClose}
        fetchLastActions={fetchActions}
        destinations={DESTINATIONS}
        onError={setError}
      />
      <SearchIncidentModal
        show={showSearch}
        onHide={() => setShowSearch(false)}
        incidents={incidents}
        actions={actions}
      />
    </div>
  );
}

export default App;