import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchAbsenceRequests, deleteAbsenceRequests } from '../Redux/Slices/absenceRequestSlice';
import { fetchUsers } from '../Redux/Slices/userSlice';
import { Icon } from '@iconify/react/dist/iconify.js';
import Swal from 'sweetalert2';

const AbsenceRequestsListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: absenceRequests, status: loading, error } = useSelector((state) => state.absenceRequests);
  const { items: users } = useSelector((state) => state.users);
  const [selectedRequests, setSelectedRequests] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [type, setType] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const roles = useSelector((state) => state.auth.roles || []);

  // useEffect(() => {
  //   dispatch(fetchAbsenceRequests());
  //   dispatch(fetchUsers());
  // }, [dispatch]);

  // Ajouter la fonction de réinitialisation des filtres
  const resetFilters = () => {
    setType('');
    setStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Ajouter la logique de filtrage
  const filteredRequests = absenceRequests.filter((request) => {
    const user = users.find(u => u.id === request.user_id);
    const userName = user ? `${user.name} ${user.prenom}`.toLowerCase() : '';
    const searchLower = searchTerm.toLowerCase();
    
    const matchesSearch = userName.includes(searchLower) || 
                         request.type.toLowerCase().includes(searchLower) ||
                         request.motif?.toLowerCase().includes(searchLower);
    
    const matchesType = !type || request.type.toLowerCase() === type.toLowerCase();
    const matchesStatus = !status || request.statut.toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  // Mise à jour des calculs de pagination pour utiliser les demandes filtrées
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = e.target.value === 'all' ? filteredRequests.length : parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pageNumbers.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pageNumbers.push(i);
        }
      }
    }
    
    return pageNumbers;
  };

  const handleEdit = (id) => {
    navigate(`/absences/${id}/edit`);
  };

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: "Cette action ne peut pas être annulée!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteAbsenceRequests([id])).unwrap();
        Swal.fire(
          'Supprimé!',
          'La demande d\'absence a été supprimée avec succès.',
          'success'
        );
      } catch (error) {
        Swal.fire(
          'Erreur!',
          'Une erreur est survenue lors de la suppression.',
          'error'
        );
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRequests.length === 0) {
      Swal.fire(
        'Attention!',
        'Veuillez sélectionner au moins une demande à supprimer.',
        'warning'
      );
      return;
    }

    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Vous êtes sur le point de supprimer ${selectedRequests.length} demande(s). Cette action ne peut pas être annulée!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteAbsenceRequests(selectedRequests)).unwrap();
        setSelectedRequests([]);
        Swal.fire(
          'Supprimé!',
          'Les demandes ont été supprimées avec succès.',
          'success'
        );
      } catch (error) {
        Swal.fire(
          'Erreur!',
          'Une erreur est survenue lors de la suppression.',
          'error'
        );
      }
    }
  };

  const toggleRequestSelection = (id) => {
    setSelectedRequests(prev => 
      prev.includes(id) 
        ? prev.filter(reqId => reqId !== id)
        : [...prev, id]
    );
  };

  if (loading === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="row">
          <div className="col-12">
            <div className="alert alert-danger" role="alert">
              <div className="d-flex align-items-center">
                <Icon icon="mdi:alert-circle" className="me-2" />
                <div>
                  <h5 className="alert-heading">Erreur de chargement</h5>
                  <p className="mb-0">Une erreur est survenue lors du chargement des demandes d'absence.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card basic-data-table">
      {/* Header */}
      <div className="card-header d-flex flex-column flex-md-row gap-2 justify-content-between align-items-start align-items-md-center">
        <h5 className="card-title mb-0">Demandes d'absence</h5>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/absences/add" className="btn btn-primary d-flex align-items-center">
            <Icon icon="mdi:plus" />
            <span className="d-none d-md-inline ms-1">Ajouter</span>
          </Link>

          <button 
            className="btn btn-danger d-flex align-items-center"
            onClick={handleBulkDelete}
            disabled={selectedRequests.length === 0}
          >
            <Icon icon="mdi:trash" />
            <span className="d-none d-md-inline ms-1">Supprimer</span>
          </button>
          {(roles.includes("RH") || roles.includes("Chef_Dep")) && (
       <>
          <button className="btn btn-outline-secondary d-flex align-items-center">
            <Icon icon="mdi:download" />
            <span className="d-none d-md-inline ms-1">Export</span>
          </button>

          <button className="btn btn-outline-secondary d-flex align-items-center">
            <Icon icon="mdi:upload" />
            <span className="d-none d-md-inline ms-1">Import</span>
          </button>
          </>
          )}
          <button
            className="btn btn-outline-secondary d-inline d-md-none"
            onClick={() => setFiltersOpen(!filtersOpen)}
          >
            <Icon icon="mdi:tune" />
          </button>
        </div>
      </div>

      <div className="card-body">
        {/* Filters */}
        <div className={`filters-container mb-4 ${filtersOpen ? 'd-block' : 'd-none'} d-md-block`}>
          <div className="row g-3 align-items-center">
            <div className="col-6 col-sm-4 col-md-3 col-lg-2">
              <select className="form-select" value={type} onChange={e => setType(e.target.value)}>
                <option value="">Type</option>
                <option value="Congé">Congé</option>
                <option value="maladie">Maladie</option>
                <option value="autre">Autre</option>
              </select>
            </div>

            <div className="col-6 col-sm-4 col-md-3 col-lg-2">
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Statut</option>
                <option value="en_attente">En attente</option>
                <option value="validé">Validé</option>
                <option value="rejeté">Rejeté</option>
                <option value="approuvé">Approuvé</option>
              </select>
            </div>

            <div className="col-6 col-sm-4 col-md-3 col-lg-3">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {(type || status || searchTerm) && (
              <div className="col-auto">
                <button
                  className="btn btn-link text-danger"
                  onClick={resetFilters}
                  title="Réinitialiser les filtres"
                  style={{ padding: '6px 10px' }}
                >
                  <Icon icon="mdi:close" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    className="form-check-input"
                    checked={selectedRequests.length === absenceRequests.length}
                    onChange={() => {
                      if (selectedRequests.length === absenceRequests.length) {
                        setSelectedRequests([]);
                      } else {
                        setSelectedRequests(absenceRequests.map(r => r.id));
                      }
                    }}
                  />
                </th>
                <th>Employé</th>
                <th>Type</th>
                <th>Date de début</th>
                <th>Date de fin</th>
                <th>Statut</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((request) => {
                const user = users.find(u => u.id === request.user_id);
                return (
                  <tr key={request.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedRequests.includes(request.id)}
                        onChange={() => toggleRequestSelection(request.id)}
                      />
                    </td>
                    <td>{user ? `${user.name} ${user.prenom}` : 'Utilisateur inconnu'}</td>
                    <td>{request.type}</td>
                    <td>{new Date(request.dateDebut).toLocaleDateString()}</td>
                    <td>{new Date(request.dateFin).toLocaleDateString()}</td>
                    <td>
                    <span
  className={`badge ${
    request.statut === 'validé'
      ? 'bg-success'
      : request.statut === 'rejeté'
      ? 'bg-danger'
      : request.statut === 'approuvé'
      ? 'bg-primary'      // couleur de votre choix
      : 'bg-warning'
  }`}
>                        {request.statut}
                      </span>
                    </td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className="btn btn-sm btn-primary me-2"
                          onClick={() => handleEdit(request.id)}
                          title="Modifier"
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(request.id)}
                          title="Supprimer"
                        >
                          <Icon icon="mdi:delete" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="d-flex align-items-center gap-2">
            <span>Afficher</span>
            <select className="form-select form-select-sm w-auto" value={itemsPerPage} onChange={handleItemsPerPageChange}>
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="all">Tous</option>
            </select>
            <span>entrées</span>
          </div>

          <div className="d-flex gap-2">
            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <Icon icon="mdi:chevron-left" />
            </button>

            {getPageNumbers().map((number) => (
              <button
                key={number}
                className={`btn btn-sm ${currentPage === number ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => paginate(number)}
              >
                {number}
              </button>
            ))}

            <button
              className="btn btn-outline-secondary btn-sm"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <Icon icon="mdi:chevron-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AbsenceRequestsListPage;