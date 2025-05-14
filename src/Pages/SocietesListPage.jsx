import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSocietes, deleteSocietes, createSociete, updateSociete } from '../Redux/Slices/societeSlice';
import { Icon } from '@iconify/react/dist/iconify.js';
import Swal from 'sweetalert2';
import SocieteFormModal from '../Components/SocieteFormModal'; // Assurez-vous que ce chemin est correct

const SocietesListPage = () => {
  const dispatch = useDispatch();
  const { items: societes, status: loading, error } = useSelector((state) => state.societes);
  const [selectedSocietes, setSelectedSocietes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentSociete, setCurrentSociete] = useState(null);

  useEffect(() => {
    dispatch(fetchSocietes());
  }, [dispatch]);

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredSocietes = societes.filter((societe) => {
    const searchTermLower = searchTerm.toLowerCase();
    return societe.nom.toLowerCase().includes(searchTermLower);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSocietes.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSocietes.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = e.target.value === 'all' ? filteredSocietes.length : parseInt(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pageNumbers.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) pageNumbers.push(i);
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) pageNumbers.push(i);
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) pageNumbers.push(i);
      }
    }
    return pageNumbers;
  };

  const handleOpenModal = (societe = null) => {
    setCurrentSociete(societe);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentSociete(null);
  };

  const handleSubmitModal = async (formData) => {
    try {
      if (currentSociete) {
        await dispatch(updateSociete({ ...formData, id: currentSociete.id })).unwrap();
        Swal.fire('Succès!', 'Société mise à jour avec succès.', 'success');
      } else {
        await dispatch(createSociete(formData)).unwrap();
        Swal.fire('Succès!', 'Société créée avec succès.', 'success');
      }
      dispatch(fetchSocietes()); // Re-fetch to update list
      handleCloseModal();
    } catch (err) {
      Swal.fire('Erreur!', `Une erreur est survenue: ${err.message || 'Veuillez réessayer.'}`, 'error');
    }
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
        await dispatch(deleteSocietes([id])).unwrap();
        Swal.fire('Supprimé!', 'La société a été supprimée avec succès.', 'success');
        dispatch(fetchSocietes()); // Re-fetch to update list
      } catch (error) {
        Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedSocietes.length === 0) {
      Swal.fire('Attention!', 'Veuillez sélectionner au moins une société à supprimer.', 'warning');
      return;
    }
    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Vous êtes sur le point de supprimer ${selectedSocietes.length} société(s). Cette action ne peut pas être annulée!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteSocietes(selectedSocietes)).unwrap();
        setSelectedSocietes([]);
        Swal.fire('Supprimé!', 'Les sociétés ont été supprimées avec succès.', 'success');
        dispatch(fetchSocietes()); // Re-fetch to update list
      } catch (error) {
        Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
      }
    }
  };

  const toggleSocieteSelection = (id) => {
    setSelectedSocietes(prev => prev.includes(id) ? prev.filter(societeId => societeId !== id) : [...prev, id]);
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
        <div className="alert alert-danger" role="alert">
          Erreur de chargement des sociétés: {typeof error === 'string' ? error : JSON.stringify(error)}
        </div>
      </div>
    );
  }

  return (
    <div className="container-fluid">
      <div className="row mb-3">
        <div className="col-md-6">
          <h2>Liste des Sociétés</h2>
        </div>
        <div className="col-md-6 text-md-end">
          <button className="btn btn-primary" onClick={() => handleOpenModal()}>
            <Icon icon="mdi:plus-circle-outline" className="me-1" />
            Ajouter une Société
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="row">
            <div className="col-md-4">
              <input 
                type="text" 
                className="form-control" 
                placeholder="Rechercher par nom..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="col-md-2">
                <button className="btn btn-secondary w-100" onClick={resetFilters}>Réinitialiser</button>
            </div>
            {selectedSocietes.length > 0 && (
              <div className="col-md-2">
                <button className="btn btn-danger w-100" onClick={handleBulkDelete}>
                  <Icon icon="mdi:delete-sweep-outline" className="me-1" />
                  Supprimer la sélection
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="table table-hover table-striped">
              <thead>
                <tr>
                  <th>
                    <input 
                      type="checkbox" 
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSocietes(currentItems.map(s => s.id));
                        } else {
                          setSelectedSocietes([]);
                        }
                      }}
                      checked={selectedSocietes.length === currentItems.length && currentItems.length > 0}
                    />
                  </th>
                  <th>Nom</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? currentItems.map((societe) => (
                  <tr key={societe.id}>
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedSocietes.includes(societe.id)}
                        onChange={() => toggleSocieteSelection(societe.id)}
                      />
                    </td>
                    <td>{societe.nom}</td>
                    <td>
                      <button className="btn btn-sm btn-outline-primary me-2" onClick={() => handleOpenModal(societe)} title="Modifier">
                        <Icon icon="mdi:pencil" />
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(societe.id)} title="Supprimer">
                        <Icon icon="mdi:delete" />
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="3" className="text-center">Aucune société trouvée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {totalPages > 1 && (
          <div className="card-footer d-flex justify-content-between align-items-center">
            <div>
              <select value={itemsPerPage} onChange={handleItemsPerPageChange} className="form-select form-select-sm d-inline-block" style={{width: 'auto'}}>
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
                <option value="all">Tout</option>
              </select>
              <span className="ms-2">par page</span>
            </div>
            <nav>
              <ul className="pagination pagination-sm mb-0">
                <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage - 1)}>&laquo;</button>
                </li>
                {getPageNumbers().map(number => (
                  <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
                    <button className="page-link" onClick={() => paginate(number)}>{number}</button>
                  </li>
                ))}
                <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                  <button className="page-link" onClick={() => paginate(currentPage + 1)}>&raquo;</button>
                </li>
              </ul>
            </nav>
          </div>
        )}
      </div>

      {isModalOpen && (
        <SocieteFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleSubmitModal}
          initialData={currentSociete}
        />
      )}
    </div>
  );
};

export default SocietesListPage;