import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchUsers, deleteUsers } from '../Redux/Slices/userSlice';
import { fetchDepartments } from '../Redux/Slices/departementSlice';
import { Icon } from '@iconify/react/dist/iconify.js';
import Swal from 'sweetalert2';
import api from '../config/axios';

const UsersListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: users, status: loading, error } = useSelector((state) => state.users);
  const { items: departments } = useSelector((state) => state.departments);
  const { user: currentUser } = useSelector((state) => state.auth);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const roles = useSelector((state) => state.auth.roles || []);
  const isEmployee = roles.includes('Employe');

  const resetFilters = () => {
    setRole('');
    setDepartment('');
    setStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredUsers = users.filter((user) => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTermLower) ||
      user.prenom.toLowerCase().includes(searchTermLower) ||
      user.cin?.toLowerCase().includes(searchTermLower) ||
      user.email.toLowerCase().includes(searchTermLower);

    const matchesRole = !role || user.role.toLowerCase() === role.toLowerCase();
    const matchesDepartment = !department || user.departement_id === parseInt(department);
    const matchesStatus = !status || user.statut.toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesRole && matchesDepartment && matchesStatus;
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = e.target.value === 'all' ? filteredUsers.length : parseInt(e.target.value);
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
    if (currentUser && currentUser.id === id) {
      Swal.fire({
        title: 'Action non autorisée',
        text: 'Vous ne pouvez pas modifier votre profil depuis cette page. Veuillez utiliser la page de profil.',
        icon: 'warning',
        confirmButtonText: 'OK'
      });
      return;
    }
    navigate(`/users/${id}/edit`);
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
        await dispatch(deleteUsers([id])).unwrap();
        Swal.fire('Supprimé!', 'L\'utilisateur a été supprimé avec succès.', 'success');
      } catch (error) {
        Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedUsers.length === 0) {
      Swal.fire('Attention!', 'Veuillez sélectionner au moins un utilisateur à supprimer.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Vous êtes sur le point de supprimer ${selectedUsers.length} utilisateur(s). Cette action ne peut pas être annulée!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteUsers(selectedUsers)).unwrap();
        setSelectedUsers([]);
        Swal.fire('Supprimé!', 'Les utilisateurs ont été supprimés avec succès.', 'success');
      } catch (error) {
        Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
      }
    }
  };

  const toggleUserSelection = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(userId => userId !== id)
        : [...prev, id]
    );
  };

  const handleImport = async (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      Swal.fire('Erreur', 'Veuillez sélectionner un fichier', 'error');
      return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await api.post('/import-employes', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      if (response.status === 200) {
        Swal.fire('Succès', 'Fichier importé avec succès', 'success');
        await dispatch(fetchUsers());
      }
    } catch (error) {
      const status = error?.response?.status;
      
      if (status === 204 || status === 302 || !error.response) {
        Swal.fire('Import réussi', 'Employés importés avec succès.', 'success');
        await dispatch(fetchUsers());
      } else {
        console.error("Erreur lors de l'importation des employés:", error);
        Swal.fire('Erreur', error?.response?.data?.message || "Une erreur est survenue lors de l'importation.", 'error');
      }
    }
  };

  if (loading === 'loading') {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container-fluid">
        <div className="alert alert-danger rounded-lg shadow-sm" role="alert">
          <div className="d-flex align-items-center">
            <Icon icon="mdi:alert-circle" className="me-2 text-xl" />
            <div>
              <h5 className="alert-heading mb-1">Erreur de chargement</h5>
              <p className="mb-0">Une erreur est survenue lors du chargement des utilisateurs.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm">
      <div className="card-header bg-white py-3">
        <div className="d-flex flex-wrap justify-content-between align-items-center gap-3">
          <h5 className="card-title mb-0 text-primary">Gestion des Utilisateurs</h5>
          <div className="d-flex flex-wrap gap-2">
            <Link to="/users/add" className="btn btn-primary d-flex align-items-center">
              <Icon icon="mdi:plus" className="me-1" />
              <span className="d-none d-sm-inline">Ajouter</span>
            </Link>

            <button 
              className="btn btn-danger d-flex align-items-center"
              onClick={handleBulkDelete}
              disabled={selectedUsers.length === 0}
            >
              <Icon icon="mdi:trash" className="me-1" />
              <span className="d-none d-sm-inline">Supprimer</span>
            </button>

            <button 
              className="btn btn-outline-secondary d-flex align-items-center"
              onClick={() => window.open(`${import.meta.env.VITE_API_URL}api/export-employes`, '_blank')}
            >
              <Icon icon="mdi:download" className="me-1" />
              <span className="d-none d-sm-inline">Export</span>
            </button>

            {!isEmployee && (
              <div className="position-relative">
                <button
                  className="btn btn-outline-secondary d-flex align-items-center"
                  onClick={() => document.getElementById('fileInput').click()}
                >
                  <Icon icon="mdi:upload" className="me-1" />
                  <span className="d-none d-sm-inline">Import</span>
                </button>
                <input
                  type="file"
                  id="fileInput"
                  className="d-none"
                  onChange={handleImport}
                  accept=".csv, .xlsx"
                />
              </div>
            )}

            <button
              className="btn btn-outline-secondary d-sm-none"
              onClick={() => setFiltersOpen(!filtersOpen)}
            >
              <Icon icon="mdi:tune" />
            </button>
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className={`filters-container mb-4 ${filtersOpen ? 'd-block' : 'd-none'} d-sm-block`}>
          <div className="row g-3">
            <div className="col-12 col-sm-6 col-md-3">
              <select 
                className="form-select shadow-sm" 
                value={role} 
                onChange={e => setRole(e.target.value)}
              >
                <option value="">Tous les rôles</option>
                <option value="Employe">Employé</option>
                <option value="Chef_Dep">Chef département</option>
                <option value="RH">RH</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <select 
                className="form-select shadow-sm" 
                value={department} 
                onChange={e => setDepartment(e.target.value)}
              >
                <option value="">Tous les départements</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.nom}</option>
                ))}
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <select 
                className="form-select shadow-sm" 
                value={status} 
                onChange={e => setStatus(e.target.value)}
              >
                <option value="">Tous les statuts</option>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="Congé">Congé</option>
                <option value="Malade">Malade</option>
              </select>
            </div>

            <div className="col-12 col-sm-6 col-md-3">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control shadow-sm"
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
                {(role || department || status || searchTerm) && (
                  <button
                    className="btn btn-outline-secondary"
                    onClick={resetFilters}
                    title="Réinitialiser les filtres"
                  >
                    <Icon icon="mdi:close" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead className="bg-light">
              <tr>
                <th className="border-0">
                  <div className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selectedUsers.length === filteredUsers.length}
                      onChange={() => {
                        if (selectedUsers.length === filteredUsers.length) {
                          setSelectedUsers([]);
                        } else {
                          setSelectedUsers(filteredUsers.map(u => u.id));
                        }
                      }}
                    />
                  </div>
                </th>
                <th className="border-0">Nom</th>
                <th className="border-0">Prénom</th>
                <th className="border-0">Email</th>
                <th className="border-0">Rôle</th>
                <th className="border-0">Département</th>
                <th className="border-0">Statut</th>
                <th className="border-0 text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((user) => {
                const department = departments.find(d => d.id === user.departement_id);
                const isCurrentUser = currentUser && currentUser.id === user.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleUserSelection(user.id)}
                        />
                      </div>
                    </td>
                    <td>{user.name}</td>
                    <td>{user.prenom}</td>
                    <td>
                      <span className="text-truncate d-inline-block" style={{maxWidth: "200px"}}>
                        {user.email}
                      </span>
                    </td>
                    <td>
                      <span className={`badge bg-${user.role === 'RH' ? 'primary' : user.role === 'Chef_Dep' ? 'success' : 'info'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td>{department ? department.nom : 'Non assigné'}</td>
                    <td>
                      <span className={`badge bg-${
                        user.statut === 'Actif' ? 'success' :
                        user.statut === 'Inactif' ? 'danger' :
                        user.statut === 'Congé' ? 'warning' :
                        user.statut === 'Malade' ? 'info' : 'secondary'
                      }`}>
                        {user.statut}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className={`btn btn-sm ${isCurrentUser ? 'btn-secondary' : 'btn-primary'}`}
                          onClick={() => handleEdit(user.id)}
                          title={isCurrentUser ? "Utilisez la page de profil" : "Modifier"}
                          disabled={isCurrentUser}
                        >
                          <Icon icon="mdi:pencil" />
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(user.id)}
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

        <div className="d-flex flex-column flex-md-row justify-content-between align-items-center gap-3 mt-4">
          <div className="d-flex align-items-center gap-2">
            <select 
              className="form-select form-select-sm" 
              value={itemsPerPage} 
              onChange={handleItemsPerPageChange}
              style={{width: 'auto'}}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="all">Tous</option>
            </select>
            <span className="text-muted">entrées par page</span>
          </div>

          <nav aria-label="Page navigation">
            <ul className="pagination pagination-sm mb-0">
              <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => paginate(currentPage - 1)}
                  aria-label="Previous"
                >
                  <Icon icon="mdi:chevron-left" />
                </button>
              </li>
              {getPageNumbers().map((number) => (
                <li 
                  key={number} 
                  className={`page-item ${currentPage === number ? 'active' : ''}`}
                >
                  <button 
                    className="page-link" 
                    onClick={() => paginate(number)}
                  >
                    {number}
                  </button>
                </li>
              ))}
              <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                <button 
                  className="page-link" 
                  onClick={() => paginate(currentPage + 1)}
                  aria-label="Next"
                >
                  <Icon icon="mdi:chevron-right" />
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default UsersListPage;