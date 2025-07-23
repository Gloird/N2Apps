import "./App.css";
import "bootstrap/dist/css/bootstrap.min.css";
import React, { useState, useEffect } from "react";
import { Spinner, Alert, Table, Button, Card } from "react-bootstrap";
import Header from "./components/Header";
import ActionModal from "./components/ActionModal";
import Actions from "./components/Actions";
import SearchIncidentModal from "./components/SearchIncidentModal";
import { AllActionModal } from "./components/AllActionModal";

const DESTINATIONS = [
  "",
  "Contrat Mob",
  "Contrat PC2",
  "Contrat Habitation PC",
  "Contrat Habitation PE",
  "Contrat Host",
  "Editique",
  "Activité",
  "Sinistre Mob",
  "Sinistre Corp",
  "Sinistre Hab",
  "Sinistre Host",
  "G2A",
  "Macif.fr",
  "UNIC",
  "ECM",
  "RAD/LAD",
  "Autre",
];

function getStoredTheme() {
  return localStorage.getItem("theme");
}
function setStoredTheme(theme) {
  localStorage.setItem("theme", theme);
}
function getPreferredTheme() {
  const storedTheme = getStoredTheme();
  if (storedTheme) return storedTheme;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
function setTheme(theme) {
  if (theme === "auto") {
    document.documentElement.setAttribute(
      "data-bs-theme",
      window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    );
  } else {
    document.documentElement.setAttribute("data-bs-theme", theme);
  }
}

function App() {
  const [actionSelected, setActionSelected] = useState(null);
  const [show, setShow] = useState(false);
  const [incidents, setIncidents] = useState([]);
  const [loadingIncidents, setLoadingIncidents] = useState(false);
  const [error, setError] = useState("");
  const [lastRow, setLastRow] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [actions, setActions] = useState([]);
  const [loadingActions, setLoadingActions] = useState(false);
  const [showAllActions, setShowAllActions] = useState(false);
  const [theme, setThemeState] = useState(getPreferredTheme());

  // Fonction pour charger les incidents (toutes les pages)
  const fetchAllIncidents = () => {
    setRefreshing(true);
    setLoadingIncidents(true);
    setError("");
    let allIncidents = [];
    let lastRowFetched = null;

    function fetchPage() {
      if (window.google && window.google.script && window.google.script.run) {
        window.google.script.run
          .withSuccessHandler((result) => {
            result = JSON.parse(result);
            const data =
              result && result.incidents
                ? result.incidents
                : Array.isArray(result)
                ? result
                : [];
            lastRowFetched = result && result.lastRow ? result.lastRow : null;
            allIncidents = allIncidents.concat(data);
            setIncidents(allIncidents.reverse());
            setLastRow(lastRowFetched);
            setLoadingIncidents(false);
            setRefreshing(false);
          })
          .withFailureHandler((err) => {
            setError("Erreur lors du chargement des incidents");
            setLoadingIncidents(false);
            setRefreshing(false);
          })
          .getIncidents();
      } else {
        setError("google.script.run non disponible");
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
            console.log("Actions fetched:", data);
            setActions(Array.isArray(data) ? data.reverse() : []);
          } catch (e) {
            setError("Erreur lors du chargement des actions");
            console.error("Error parsing actions:", e);
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

  useEffect(() => {
    setTheme(theme);
    setStoredTheme(theme);
  }, [theme]);

  useEffect(() => {
    const handler = () => {
      if (getStoredTheme() !== "light" && getStoredTheme() !== "dark") {
        setThemeState(getPreferredTheme());
      }
    };
    window
      .matchMedia("(prefers-color-scheme: dark)")
      .addEventListener("change", handler);
    return () => {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .removeEventListener("change", handler);
    };
  }, []);

  const handleShow = () => setShow(true);
  const handleClose = () => {
    setShow(false);
    setActionSelected(null);
  };

  // Filtrer les incidents pour ne garder que les incidents uniques (par champ 'incident')
  const uniqueIncidents = (incidents) => incidents.filter(
    (inc, i, arr) =>
      arr.findIndex((inc2) => inc2.incident === inc.incident) === i
  );

  return (
    <div className="App" style={{ minHeight: "100vh" }}>
      <Header
        onAddAction={handleShow}
        onSearch={() => setShowSearch(true)}
        refreshing={refreshing}
        incidentsCount={incidents.length}
        lastRow={lastRow}
        theme={theme}
        onToggleTheme={() => setThemeState(theme === "dark" ? "light" : "dark")}
      />
      <div className="container mt-3">
        <Card className="mt-3">
          <Card.Header>
            <h5>Incidents entrant</h5>
          </Card.Header>
          <Card.Body>
            {loadingIncidents && (
              <Spinner animation="border" />
            )}
            {!loadingIncidents && incidents.length > 0 && (
              <>
                Statistics du jour :{" "}
                {
                  uniqueIncidents(incidents
                    .filter(
                      (inc) =>
                        new Date(inc.date).toDateString() ===
                        new Date().toDateString()
                    )).length
                }{" "}
                incidents et {actions.filter(
                      (act) =>
                        new Date(act.date).toDateString() ===
                        new Date().toDateString()
                    ).length} actions<br />
                Statistics de la semaine :{" "}
                {
                  incidents
                    .filter((inc) => {
                      const incidentDate = new Date(inc.date);
                      const startOfWeek = new Date();
                      startOfWeek.setDate(
                        startOfWeek.getDate() - startOfWeek.getDay()
                      );
                      return incidentDate >= startOfWeek;
                    }).length
                }{" "}
                incidents et {actions.filter((act) => {
                      const actionDate = new Date(act.date);
                      const startOfWeek = new Date();
                      startOfWeek.setDate(
                        startOfWeek.getDate() - startOfWeek.getDay()
                      );
                      return actionDate >= startOfWeek;
                    }).length} actions<br />
                Statistics du mois :{" "}
                {
                  uniqueIncidents(incidents
                    .filter((inc) => {
                      const incidentDate = new Date(inc.date);
                      const startOfMonth = new Date();
                      startOfMonth.setDate(1);
                      return incidentDate >= startOfMonth;
                    })).length
                }{" "}
                incidents et {actions.filter((act) => {
                      const actionDate = new Date(act.date);
                      const startOfMonth = new Date();
                      startOfMonth.setDate(1);
                      return actionDate >= startOfMonth;
                    }).length} actions<br />
              </>
            )}
          </Card.Body>
        </Card>
        <Card className="mt-3">
          <Card.Header>
            <h5>
              10 dernières actions{" "}
              <Button
                size="sm"
                variant="primary"
                onClick={() => setShowAllActions(true)}
              >
                voir tous
              </Button>
            </h5>
          </Card.Header>
          <Card.Body>
            <Actions
              loadingActions={loadingActions}
              actions={actions.slice(0, 10)}
              onSelected={(action) => {
                console.log("Action Selected", action);
                setActionSelected(action);
                setShow(true);
              }}
            />
            {error && (
              <Alert variant="danger" style={{ margin: 10 }}>
                {error}
              </Alert>
            )}
          </Card.Body>
        </Card>
      </div>
      {show && (
        <ActionModal
          show={show}
          onHide={handleClose}
          loadingIncidents={loadingIncidents}
          incidents={incidents}
          handleClose={handleClose}
          fetchLastActions={fetchActions}
          destinations={DESTINATIONS}
          onError={setError}
          action={actionSelected}
        />
      )}
      <SearchIncidentModal
        show={showSearch}
        onHide={() => setShowSearch(false)}
        incidents={incidents}
        actions={actions}
      />
      <AllActionModal
        show={showAllActions}
        onHide={() => setShowAllActions(false)}
        actions={actions}
        loadingActions={loadingActions}
        onSelectAction={(action) => {
          setActionSelected(action);
          setShow(true);
          setShowAllActions(false);
        }}
      />
    </div>
  );
}

export default App;
