import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { fetchPointages, deletePointages, updatePointage, createPointage, validerPointage, invaliderPointage } from '../Redux/Slices/pointageSlice';
import { fetchUsers } from '../Redux/Slices/userSlice';
import { fetchAbsenceRequests } from '../Redux/Slices/absenceRequestSlice';
import { fetchSocietes } from '../Redux/Slices/societeSlice'; // Ajout de l'import pour fetchSocietes
import { fetchDepartments } from '../Redux/Slices/departementSlice';
import { Icon } from '@iconify/react/dist/iconify.js';
import Swal from 'sweetalert2';
import * as XLSX from 'xlsx';


const PointagesListPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { items: pointages, status: loading, error } = useSelector((state) => state.pointages);
  const { items: users } = useSelector((state) => state.users);
  const { items: societes } = useSelector((state) => state.societes); // Récupération des sociétés
  const { items: absenceRequests } = useSelector((state) => state.absenceRequests);
  const { items: departments } = useSelector((state) => state.departments);
  const { user: currentUser } = useSelector((state) => state.auth); // Récupérer l'utilisateur actuel
  const canValidateAll = currentUser && ['RH', 'Chef_Dep', 'Chef_Projet'].includes(currentUser.role);
  const canInvalidateAllForRH = currentUser && currentUser.role === 'RH'; // Ajout pour le bouton Invalider Tout

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filters, setFilters] = useState({
    date: '',
    user: '',
    status: '',
    societe: '', // Ajout du filtre société
  });
  
  const [editablePointages, setEditablePointages] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [usersForPointage, setUsersForPointage] = useState([]);
  const [usersWithAbsence, setUsersWithAbsence] = useState([]);

  useEffect(() => {
    dispatch(fetchPointages());
    dispatch(fetchUsers());
    dispatch(fetchAbsenceRequests());
    dispatch(fetchSocietes()); // Appel pour récupérer les sociétés
    dispatch(fetchDepartments());
  }, [dispatch]);
  const handleInvaliderTout = async () => {
    console.log("Pointages affichés (currentItems) : ", currentItems);
  
    // Sélectionner les pointages affichés qui sont validés
    const pointagesAInvalider = currentItems.filter(p => p.valider === 1);
  
    if (pointagesAInvalider.length === 0) {
      Swal.fire('Information', 'Aucun pointage validé à invalider parmi les éléments affichés.', 'info');
      return;
    }
  
    const result = await Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: `Vous êtes sur le point d'invalider ${pointagesAInvalider.length} pointage(s).`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, invalider !',
      cancelButtonText: 'Annuler'
    });
  
    if (result.isConfirmed) {
      try {
        const promises = pointagesAInvalider.map(p => dispatch(invaliderPointage(p.id)).unwrap());
        await Promise.all(promises);
  
        Swal.fire(
          'Succès !',
          `${pointagesAInvalider.length} pointage(s) ont été invalidés.`,
          'success'
        );
  
        dispatch(fetchPointages()); // Rafraîchir les données après l'invalidation
      } catch (error) {
        console.error("Erreur lors de l'invalidation : ", error);
        Swal.fire('Erreur !', 'Une erreur est survenue lors de l\'invalidation.', 'error');
      }
    }
  };

  // Helper function to get the leave type and status
  const getLeaveInfo = useCallback((userId) => {
    const selectedDateObj = new Date(selectedDate);
    
    const userAbsence = absenceRequests.find(request => {
      const startDate = new Date(request.dateDebut);
      const endDate = new Date(request.dateFin);
      return request.user_id === userId && 
             request.statut === 'approuvé' &&
             selectedDateObj >= startDate && 
             selectedDateObj <= endDate;
    });

    if (userAbsence) {
      return {
        type: userAbsence.type,
        motif: userAbsence.motif || 'N/A',
        endDate: userAbsence.dateFin
      };
    }
    return null;
  }, [absenceRequests, selectedDate]);

  useEffect(() => {
    const activeFilteredUsers = users.filter(user => {
      const userSociete = societes.find(s => s.id === user.societe_id);
      const societeMatch = !filters.societe || (userSociete && userSociete.id === parseInt(filters.societe));
      const userMatchFilter = !filters.user || user.id === parseInt(filters.user);
      return user.statut !== 'Inactif' && societeMatch && userMatchFilter;
    });

    if (activeFilteredUsers.length > 0 && Array.isArray(absenceRequests)) {
      const newEditablePointages = {};
      const currentUsersForPointage = [];
      const currentUsersWithAbsence = [];

      activeFilteredUsers.forEach(user => {
        const existingPointage = pointages.find(p => 
          p.user_id === user.id && 
          new Date(p.date).toISOString().split('T')[0] === selectedDate
        );
        
        const userAbsenceInfo = getLeaveInfo(user.id);

        if (userAbsenceInfo && (userAbsenceInfo.type === 'Congé' || userAbsenceInfo.type === 'maladie' || userAbsenceInfo.type === 'Autre absence')) {
          newEditablePointages[user.id] = {
            id: existingPointage?.id || null,
            user_id: user.id,
            date: selectedDate,
            heureEntree: null, 
            heureSortie: null, 
            statutJour: userAbsenceInfo.type,
            overtimeHours: 0, 
            valider: existingPointage?.valider || 0,
            isAbsent: true,
            absenceEndDate: userAbsenceInfo.endDate
          };
          currentUsersWithAbsence.push({ 
            ...user, 
            absenceType: userAbsenceInfo.type, 
            absenceMotif: userAbsenceInfo.motif,
            absenceEndDate: userAbsenceInfo.endDate
          });
        } else {
          newEditablePointages[user.id] = {
            id: existingPointage?.id || null,
            user_id: user.id,
            date: selectedDate,
            heureEntree: existingPointage?.heureEntree || '',
            heureSortie: existingPointage?.heureSortie || '',
            statutJour: existingPointage?.statutJour || (userAbsenceInfo ? userAbsenceInfo.type : ''),
            overtimeHours: existingPointage?.overtimeHours || 0,
            valider: existingPointage?.valider || 0,
            isAbsent: !!userAbsenceInfo,
            absenceEndDate: userAbsenceInfo ? userAbsenceInfo.endDate : null
          };
          if (!userAbsenceInfo || (userAbsenceInfo.type !== 'Congé' && userAbsenceInfo.type !== 'maladie' && userAbsenceInfo.type !== 'Autre absence')) {
            currentUsersForPointage.push(user);
          } else if (userAbsenceInfo) { 
             currentUsersWithAbsence.push({ 
                ...user, 
                absenceType: userAbsenceInfo.type, 
                absenceMotif: userAbsenceInfo.motif,
                absenceEndDate: userAbsenceInfo.endDate
             });
          }
        }
      });
      setEditablePointages(newEditablePointages);
      setUsersForPointage(currentUsersForPointage);
      setUsersWithAbsence(currentUsersWithAbsence);
    } else {
      setEditablePointages({});
      setUsersForPointage([]);
      setUsersWithAbsence([]);
    }
  }, [users, pointages, selectedDate, absenceRequests, filters, societes, getLeaveInfo]);

  // Filter pointages based on filters
  const filteredPointages = pointages.filter(pointage => {
    const pointageDate = new Date(pointage.date);
    const filterDate = filters.date ? new Date(filters.date) : null;
    
    return (
      (!filters.date || pointageDate.toDateString() === filterDate.toDateString()) &&
      (!filters.user || pointage.user_id === parseInt(filters.user)) &&
      (!filters.status || pointage.statutJour === filters.status) &&
      (!filters.societe || pointage.societe_id === parseInt(filters.societe)) // Ajout du filtre société
    );
  });

  // Pagination calculations
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPointages.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPointages.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = e.target.value === 'all' ? pointages.length : parseInt(e.target.value);
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

 
  // Import from Excel
  const handleFileImport = (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      // Transform the data to match your API format
      const transformedData = jsonData.map(row => ({
        user_id: findUserIdByName(row['Employé']),
        date: row['Date'],
        heureEntree: row['Heure d\'entrée'],
        heureSortie: row['Heure de sortie'],
        statutJour: getStatusValue(row['Statut']),
        overtimeHours: row['Heures supplémentaires']
      }));

      // Dispatch the create action for each pointage
      transformedData.forEach(pointage => {
        dispatch(createPointage(pointage));
      });

      Swal.fire(
        'Succès!',
        'Les pointages ont été importés avec succès.',
        'success'
      );
    };

    reader.readAsArrayBuffer(file);
  };

  const findUserIdByName = (fullName) => {
    const [name, prenom] = fullName.split(' ');
    const user = users.find(u => u.name === name && u.prenom === prenom);
    return user ? user.id : null;
  };

  const getStatusValue = (label) => {
    switch (label) {
      case 'Présent': return 'present';
      case 'Absent': return 'absent';
      case 'Retard': return 'retard';
      default: return 'present';
    }
  };

  const handleFieldChange = (userId, field, value) => {
    setEditablePointages(prev => ({
      ...prev,
      [userId]: {
        ...prev[userId],
        [field]: value
      }
    }));
  };

  const handleSavePointage = async (userId) => {
    const pointage = editablePointages[userId];
    try {
      const pointageData = {
        user_id: userId,
        date: selectedDate,
        heureEntree: pointage.statutJour === 'absent' ? null : pointage.heureEntree,
        heureSortie: pointage.statutJour === 'absent' ? null : pointage.heureSortie,
        statutJour: pointage.statutJour,
        overtimeHours: pointage.statutJour === 'absent' ? 0 : (pointage.overtimeHours || 0)
      };

      const existingPointage = pointages.find(p => 
        p.user_id === userId && 
        new Date(p.date).toISOString().split('T')[0] === selectedDate
      );

      if (existingPointage) {
        const updateData = [{
          id: existingPointage.id,
          ...pointageData
        }];
        await dispatch(updatePointage(updateData[0])).unwrap();
      } else {
        await dispatch(createPointage(pointageData)).unwrap();
      }

      await dispatch(fetchPointages()).unwrap();

      Swal.fire(
        'Succès!',
        'Le pointage a été enregistré avec succès.',
        'success'
      );
    } catch (error) {
      console.error('Error saving pointage:', error);
      Swal.fire(
        'Erreur!',
        'Une erreur est survenue lors de l\'enregistrement du pointage.',
        'error'
      );
    }
  };

  const handleValiderTout = async () => {
    const pointagesAValider = Object.values(editablePointages).filter(
      p => p.id && p.valider === 0 && p.statutJour !== 'absent' && p.statutJour !== ''
    );

    if (pointagesAValider.length === 0) {
      Swal.fire('Information', 'Aucun pointage à valider pour la date sélectionnée.', 'info');
      return;
    }

    try {
      Swal.fire({
        title: 'Validation en cours...',
        text: `Validation de ${pointagesAValider.length} pointage(s).`,
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        }
      });

      const validationPromises = pointagesAValider.map(p => dispatch(validerPointage(p.id)).unwrap());
      await Promise.all(validationPromises);

      setEditablePointages(prev => {
        const updatedPointages = { ...prev };
        pointagesAValider.forEach(pToValidate => {
          const userIdKey = Object.keys(prev).find(key => prev[key].id === pToValidate.id);
          if (userIdKey) {
            updatedPointages[userIdKey] = { ...updatedPointages[userIdKey], valider: 1 };
          }
        });
        return updatedPointages;
      });
      
      Swal.fire('Succès!', `${pointagesAValider.length} pointage(s) validé(s) avec succès.`, 'success');
      dispatch(fetchPointages()); // Rafraîchir les données
    } catch (error) {
      console.error("Erreur lors de la validation groupée:", error);
      let errorMessage = 'Une erreur est survenue lors de la validation des pointages.';
      if (error.message) {
        errorMessage += ` Détails: ${error.message}`;
      } else if (typeof error === 'string') {
        errorMessage += ` Détails: ${error}`;
      }
      Swal.fire('Erreur!', errorMessage, 'error');
    }
  };

  const handleSaveAll = async () => {
    try {
      const updates = Object.values(editablePointages)
        .filter(pointage => {
          // Ignorer les absences (Congé, Maladie, Autre absence)
          const ignoreStatuses = ['Congé', 'maladie', 'Autre absence'];
          if (ignoreStatuses.includes(pointage.statutJour)) {
            console.warn(`Ignoré : ${pointage.user_id} - ${pointage.statutJour}`);
            return false;
          }
  
          // Get the original pointage if it exists
          const originalPointage = pointages.find(p => 
            p.user_id === pointage.user_id && 
            new Date(p.date).toISOString().split('T')[0] === selectedDate
          );
  
          // Si le pointage n'existe pas, l'enregistrer
          if (!originalPointage) return true;
  
          // Si les données ont changé, l'enregistrer
          return (
            originalPointage.statutJour !== pointage.statutJour ||
            originalPointage.heureEntree !== pointage.heureEntree ||
            originalPointage.heureSortie !== pointage.heureSortie ||
            originalPointage.overtimeHours !== pointage.overtimeHours
          );
        })
        .map(pointage => {
          return {
            id: pointage.id,
            user_id: pointage.user_id,
            date: selectedDate,
            heureEntree: pointage.statutJour === 'absent' ? null : pointage.heureEntree,
            heureSortie: pointage.statutJour === 'absent' ? null : pointage.heureSortie,
            statutJour: pointage.statutJour,
            overtimeHours: pointage.statutJour === 'absent' ? 0 : pointage.overtimeHours,
          };
        });
  
      if (updates.length === 0) {
        Swal.fire({
          icon: 'info',
          title: 'Aucun pointage actif à sauvegarder',
          timer: 2000,
          showConfirmButton: false,
        });
        return;
      }
  
      const existingPointages = updates.filter(pointage => pointage.id);
      const newPointages = updates.filter(pointage => !pointage.id);
  
      if (existingPointages.length > 0) {
        await dispatch(updatePointage(existingPointages)).unwrap();
      }
  
      if (newPointages.length > 0) {
        await Promise.all(newPointages.map(pointage => dispatch(createPointage(pointage)).unwrap()));
      }
  
      await dispatch(fetchPointages()).unwrap();
  
      Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: 'Les pointages actifs ont été sauvegardés avec succès',
        timer: 2000,
        showConfirmButton: false,
      });
  
    } catch (error) {
      console.error('Error saving active pointages:', error);
      Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: 'Une erreur est survenue lors de la sauvegarde des pointages actifs',
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };
  

  const handleValiderPointage = async (pointageId) => {
    if (!pointageId) {
      Swal.fire('Erreur!', 'ID de pointage manquant pour la validation.', 'error');
      return;
    }
    try {
      await dispatch(validerPointage(pointageId)).unwrap();
      dispatch(fetchPointages()); 
      Swal.fire('Validé!', 'Le pointage a été validé.', 'success');
    } catch (err) {
      Swal.fire('Erreur!', err.message || 'La validation du pointage a échoué.', 'error');
    }
  };

  const handleInvaliderPointage = async (pointageId) => {
    if (!pointageId) {
      Swal.fire('Erreur!', 'ID de pointage manquant pour l\'invalidation.', 'error');
      return;
    }
    try {
      await dispatch(invaliderPointage(pointageId)).unwrap();
      dispatch(fetchPointages());
      Swal.fire('Invalidé!', 'Le pointage a été invalidé.', 'success');
    } catch (err) {
      Swal.fire('Erreur!', err.message || 'L\'invalidation du pointage a échoué.', 'error');
    }
  };

  // Update this function to check absence requests
  const isUserOnLeave = (userId) => {
    const selectedDateObj = new Date(selectedDate);
    console.log('Checking absence requests for user:', userId, 'on date:', selectedDate);
    console.log('All absence requests:', absenceRequests);
    
    const isOnLeave = absenceRequests.some(request => {
      const startDate = new Date(request.dateDebut);
      const endDate = new Date(request.dateFin);
      console.log('Checking request:', {
        request,
        startDate,
        endDate,
        selectedDateObj,
        isInRange: selectedDateObj >= startDate && selectedDateObj <= endDate,
        isTypeValid: request.type === 'Congé' || request.type === 'maladie',
        isStatusValid: request.statut === 'validé'
      });
      
      return request.user_id === userId && 
             request.statut === 'validé' && // Only consider validated requests
             (request.type === 'Congé' || request.type === 'maladie') && // Check for leave or sickness
             selectedDateObj >= startDate && 
             selectedDateObj <= endDate;
    });
    
    console.log('Is user on leave:', isOnLeave);
    return isOnLeave;
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
                  <p className="mb-0">Une erreur est survenue lors du chargement des pointages.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="card-header d-flex justify-content-between align-items-center">
        <h5 className="card-title mb-0">Pointages</h5>
        <div className="d-flex align-items-center gap-3">
          <input
            type="date"
            className="form-control"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <button 
            className="btn btn-primary" 
            onClick={handleSaveAll}
            disabled={currentUser && currentUser.role === 'Employe'} // Désactiver si l'utilisateur est un employé
          >
            <Icon icon="mdi:content-save-all" className="me-1" />
            Sauvegarder tout
          </button>
          {canValidateAll && (
            <button 
              className="btn btn-success btn-sm me-2"
              onClick={() => handleValiderTout(currentItems.filter(p => p.valider === 0).map(p => p.id))}
              disabled={currentItems.filter(p => p.valider === 0).length === 0}
            >
              <Icon icon="mdi:check-all" className="me-1" /> Valider Tout
            </button>
          )}
          {canInvalidateAllForRH && (
  <button 
    className="btn btn-warning btn-sm me-2"
    onClick={handleInvaliderTout}
    disabled={!currentItems.some(p => p.valider === 1)}  // Utilise `some()` pour vérifier s'il y a au moins un pointage validé
  >
    <Icon icon="mdi:close-octagon-outline" className="me-1" /> Invalider Tout (RH)
  </button>
)}


        </div>
      </div>
      <div className="card-body">
        <div className="table-responsive">
          <table className="table table-hover">
            <thead>
              <tr>
                <th>Employé</th>
                <th>Statut</th>
                <th>Heure d'entrée</th>
                <th>Heure de sortie</th>
                <th>Heures supplémentaires</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {usersForPointage.map((user) => {
                const pointage = editablePointages[user.id] || {};
                
                const isPointageValidatedByAPI = pointage && pointage.valider === 1;
                const pointageExistsWithId = pointage && pointage.id;

                let currentDisableFields = pointage.isAbsent || false; 

                if (isPointageValidatedByAPI) {
                    currentDisableFields = true; 
                } else if (currentUser && currentUser.role === 'Employe') {
                    if (pointageExistsWithId) {
                        currentDisableFields = true; 
                    } else {
                        currentDisableFields = pointage.isAbsent || false; 
                    }
                }
                
                const disableSaveButton = currentDisableFields || !pointage.statutJour;

                return (
                  <tr key={user.id}>
                    <td>
                      {user.name} {user.prenom}
                      {pointage.isAbsent && pointage.statutJour && (pointage.statutJour === 'Congé' || pointage.statutJour === 'maladie' || pointage.statutJour === 'Autre absence') && pointage.absenceEndDate && (
                        <span className={`badge ms-2 ${
                          pointage.statutJour === 'Congé' ? 'bg-success' : 
                          pointage.statutJour === 'maladie' ? 'bg-warning' : 
                          pointage.statutJour === 'Autre absence' ? 'bg-info' : 'bg-secondary'
                        }`}>
                          {pointage.statutJour} (jusqu'au {new Date(pointage.absenceEndDate).toLocaleDateString()})
                        </span>
                      )}
                    </td>
                    <td>
                      {pointage.isAbsent && (pointage.statutJour === 'Congé' || pointage.statutJour === 'maladie' || pointage.statutJour === 'Autre absence') ? (
                        <span className={`text-capitalize fw-bold ${
                          pointage.statutJour === 'Congé' ? 'text-success' : 
                          pointage.statutJour === 'maladie' ? 'text-warning' : 
                          pointage.statutJour === 'Autre absence' ? 'text-info' : 'text-muted'
                        }`}>
                          {pointage.statutJour}
                        </span>
                      ) : (
                        <select 
                          className="form-select"
                          value={pointage.statutJour || ''}
                          onChange={(e) => handleFieldChange(user.id, 'statutJour', e.target.value)}
                          disabled={currentDisableFields}
                        >
                          <option value="">Sélectionner...</option>
                          <option value="present">Présent</option>
                          <option value="absent">Absent</option>
                          <option value="retard">Retard</option>
                        </select>
                      )}
                    </td>
                    <td>
                      <input 
                        type="time" 
                        className="form-control"
                        value={pointage.heureEntree || ''}
                        onChange={(e) => handleFieldChange(user.id, 'heureEntree', e.target.value)}
                        disabled={currentDisableFields || pointage.statutJour === 'absent'}
                      />
                    </td>
                    <td>
                      <input 
                        type="time" 
                        className="form-control"
                        value={pointage.heureSortie || ''}
                        onChange={(e) => handleFieldChange(user.id, 'heureSortie', e.target.value)}
                        disabled={currentDisableFields || pointage.statutJour === 'absent'}
                      />
                    </td>
                    <td>
                      <input 
                        type="number" 
                        className="form-control"
                        value={pointage.overtimeHours || 0}
                        onChange={(e) => handleFieldChange(user.id, 'overtimeHours', parseInt(e.target.value))}
                        disabled={currentDisableFields || pointage.statutJour === 'absent'}
                        min="0"
                      />
                    </td>
                    <td>
                      <button 
                        className="btn btn-sm btn-success me-2"
                        onClick={() => handleSavePointage(user.id)}
                        disabled={disableSaveButton}
                        title="Sauvegarder"
                      >
                        <Icon icon="mdi:content-save" />
                      </button>
                        {/* Bouton Valider */}
                        {pointageExistsWithId && !isPointageValidatedByAPI && currentUser &&
                          (currentUser.role === 'RH' || currentUser.role === 'Chef_Dep' || currentUser.role === 'Chef_Projet') && (
                          <button
                            className="btn btn-success btn-sm me-1"
                            onClick={() => handleValiderPointage(pointage.id)}
                            disabled={currentDisableFields}
                          >
                            <Icon icon="ph:check-circle-duotone" /> Valider
                          </button>
                        )}

                        {/* Bouton Invalider */}
                        {pointageExistsWithId && isPointageValidatedByAPI && currentUser && currentUser.role === 'RH' && (
                          <button
                            className="btn btn-warning btn-sm"
                            onClick={() => handleInvaliderPointage(pointage.id)}
                            disabled={currentDisableFields && currentUser.role !== 'RH'} // Maintenu pour cohérence, se simplifie à disabled={false} quand visible
                          >
                            <Icon icon="ph:x-circle-duotone" /> Invalider
                          </button>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Table for users with validated absence */}
        {usersWithAbsence.length > 0 && (
          <div className="mt-4">
            <h5 className="mb-3">Employés avec absence validée le {new Date(selectedDate).toLocaleDateString()}</h5>
            <div className="table-responsive">
              <table className="table table-bordered table-striped table-hover">
                <thead className="table-info">
                  <tr>
                    <th>Employé</th>
                    <th>Type d'absence</th>
                    <th>Motif</th>
                    <th>Département</th>
                    <th>Société</th>
                  </tr>
                </thead>
                <tbody>
                  {usersWithAbsence.map(absentUser => {
                    const department = departments.find(d => d.id === absentUser.departement_id);
                    const societe = societes.find(s => s.id === absentUser.societe_id);
                    return (
                      <tr key={absentUser.id}>
                        <td>{absentUser.name} {absentUser.prenom}</td>
                        <td>
                          <span className={`badge bg-${
                            absentUser.absenceType === 'Congé' ? 'success' : 
                            absentUser.absenceType === 'maladie' ? 'warning' : 
                            absentUser.absenceType === 'Autre absence' ? 'info' : 'secondary'
                          }`}>
                            {absentUser.absenceType}
                          </span>
                        </td>
                        <td>{absentUser.absenceMotif || 'N/A'}</td>
                        <td>{department ? department.nom : 'N/A'}</td>
                        <td>{societe ? societe.nom : 'N/A'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const getStatusLabel = (status) => {
  switch (status) {
    case 'present':
      return 'Présent';
    case 'absent':
      return 'Absent';
    case 'retard':
      return 'Retard';
    default:
      return status;
  }
};

const getStatusBadgeColor = (status) => {
  switch (status) {
    case 'present':
      return 'success';
    case 'absent':
      return 'danger';
    case 'retard':
      return 'warning';
    default:
      return 'secondary';
  }
};

export default PointagesListPage;