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
  const { user: currentUser } = useSelector((state) => state.auth); // Ajout de l'utilisateur connecté
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [role, setRole] = useState('');
  const [department, setDepartment] = useState('');
  const [status, setStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const roles = useSelector((state) => state.auth.roles || []);
  const isEmployee = roles.includes('Employe');  // Vérifie si le rôle est "EMPLOYE"
  // useEffect(() => {
  //   dispatch(fetchUsers());
  //   dispatch(fetchDepartments());
  // }, [dispatch]);

  // Ajouter la fonction de réinitialisation des filtres
  const resetFilters = () => {
    setRole('');
    setDepartment('');
    setStatus('');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Ajout de la fonction de filtrage
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

  // Mise à jour des calculs de pagination pour utiliser les utilisateurs filtrés
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
    // Empêcher la modification si c'est l'utilisateur connecté
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
        Swal.fire(
          'Supprimé!',
          'L\'utilisateur a été supprimé avec succès.',
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
    if (selectedUsers.length === 0) {
      Swal.fire(
        'Attention!',
        'Veuillez sélectionner au moins un utilisateur à supprimer.',
        'warning'
      );
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
        Swal.fire(
          'Supprimé!',
          'Les utilisateurs ont été supprimés avec succès.',
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

  const toggleUserSelection = (id) => {
    setSelectedUsers(prev => 
      prev.includes(id) 
        ? prev.filter(userId => userId !== id)
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
                  <p className="mb-0">Une erreur est survenue lors du chargement des utilisateurs.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  

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
  
      // Cas normal : succès HTTP 200
      if (response.status === 200) {
        Swal.fire('Succès', 'Fichier importé avec succès', 'success');
        await dispatch(fetchUsers());
      }
    } catch (error) {
      const status = error?.response?.status;
  
      // ✅ Si le backend retourne 204 No Content ou 302 Redirect, on considère que l'import est OK
      if (status === 204 || status === 302 || !error.response) {
        Swal.fire('Import réussi', 'Employés importés (avec redirection ou sans réponse explicite).', 'success');
        await dispatch(fetchUsers());
      } else {
        console.error('Erreur lors de l’importation des employés:', error);
        Swal.fire('Erreur', error?.response?.data?.message || 'Une erreur est survenue lors de l’importation.', 'error');
      }
    }
  };
  
  return (
    <div className="card basic-data-table">
      {/* Header */}
      <div className="card-header d-flex flex-column flex-md-row gap-2 justify-content-between align-items-start align-items-md-center">
        <h5 className="card-title mb-0">Utilisateurs</h5>

        <div className="d-flex flex-wrap gap-2">
          <Link to="/users/add" className="btn btn-primary d-flex align-items-center">
            <Icon icon="mdi:plus" />
            <span className="d-none d-md-inline ms-1">Ajouter</span>
          </Link>

          <button 
            className="btn btn-danger d-flex align-items-center"
            onClick={handleBulkDelete}
            disabled={selectedUsers.length === 0}
          >
            <Icon icon="mdi:trash" />
            <span className="d-none d-md-inline ms-1">Supprimer</span>
          </button>

          <button 
  className="btn btn-outline-secondary d-flex align-items-center"
  onClick={() => window.open(`${import.meta.env.VITE_API_URL}api/export-employes`, '_blank')}
>
  <Icon icon="mdi:download" />
  <span className="d-none d-md-inline ms-1">Export</span>
</button>

          
{!isEmployee && (     
          <button
            className="btn btn-outline-secondary d-flex align-items-center"
            onClick={() => document.getElementById('fileInput').click()}
          >
          <Icon icon="mdi:upload" />
          <span className="d-none d-md-inline ms-1">Import</span>
          <input
            type="file"
            id="fileInput"
            style={{ display: 'none' }}
            onChange={handleImport}
            accept=".csv, .xlsx"
          />
          </button>
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
              <select className="form-select" value={role} onChange={e => setRole(e.target.value)}>
                <option value="">Rôle</option>
                <option value="Employe">Employé</option>
                <option value="Chef_Dep">Chef département</option>
                <option value="RH">RH</option>
              </select>
            </div>

            <div className="col-6 col-sm-4 col-md-3 col-lg-2">
              <select className="form-select" value={department} onChange={e => setDepartment(e.target.value)}>
                <option value="">Département</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.nom}</option>
                ))}
              </select>
            </div>

            <div className="col-6 col-sm-4 col-md-3 col-lg-2">
              <select className="form-select" value={status} onChange={e => setStatus(e.target.value)}>
                <option value="">Statut</option>
                <option value="Actif">Actif</option>
                <option value="Inactif">Inactif</option>
                <option value="Congé">Congé</option>
                <option value="Malade">Malade</option>
              </select>
            </div>

            <div className="col-6 col-sm-4 col-md-3 col-lg-3">
              <input
                type="text"
                className="form-control"
                placeholder="Rechercher par nom ou CIN..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            {(role || department || status || searchTerm) && (
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
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={() => {
                      if (selectedUsers.length === filteredUsers.length) {
                        setSelectedUsers([]);
                      } else {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      }
                    }}
                  />
                </th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Email</th>
                <th>Rôle</th>
                <th>Département</th>
                <th>Statut</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentItems.map((user) => {
                const department = departments.find(d => d.id === user.departement_id);
                const isCurrentUser = currentUser && currentUser.id === user.id;
                return (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td>{user.name}</td>
                    <td>{user.prenom}</td>
                    <td>{user.email}</td>
                    <td>{user.role}</td>
                    <td>{department ? department.nom : 'Non assigné'}</td>
                    <td>{user.statut}</td>
                    <td className="text-end">
                      <div className="d-flex justify-content-end gap-2">
                        <button
                          className={`btn btn-sm ${isCurrentUser ? 'btn-secondary' : 'btn-primary'} me-2`}
                          onClick={() => handleEdit(user.id)}
                          title={isCurrentUser ? "Utilisez la page de profil pour modifier vos informations" : "Modifier"}
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

export default UsersListPage;