import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { deleteDepartments } from '../Redux/Slices/departementSlice';
import { 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  Search,
  Pencil,
  X,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import Swal from 'sweetalert2';
import api from '../config/axios';

const DepartmentsListPage = () => {
  const dispatch = useDispatch();
  const { items: departments, status: loading, error } = useSelector((state) => state.departments);
  const [selectedDepartments, setSelectedDepartments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const roles = useSelector((state) => state.auth.roles || []);
  const isEmployee = roles.includes('Employe');

  const resetFilters = () => {
    setSearchTerm('');
    setCurrentPage(1);
  };

  const filteredDepartments = departments.filter((department) => {
    const searchLower = searchTerm.toLowerCase();
    return department.nom.toLowerCase().includes(searchLower);
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredDepartments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  const handleItemsPerPageChange = (e) => {
    const newItemsPerPage = e.target.value === 'all' ? filteredDepartments.length : parseInt(e.target.value);
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
        await dispatch(deleteDepartments([id])).unwrap();
        Swal.fire('Supprimé!', 'Le département a été supprimé avec succès.', 'success');
      } catch (error) {
        Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDepartments.length === 0) {
      Swal.fire('Attention!', 'Veuillez sélectionner au moins un département à supprimer.', 'warning');
      return;
    }

    const result = await Swal.fire({
      title: 'Êtes-vous sûr?',
      text: `Vous êtes sur le point de supprimer ${selectedDepartments.length} département(s). Cette action ne peut pas être annulée!`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, supprimer!',
      cancelButtonText: 'Annuler'
    });

    if (result.isConfirmed) {
      try {
        await dispatch(deleteDepartments(selectedDepartments)).unwrap();
        setSelectedDepartments([]);
        Swal.fire('Supprimé!', 'Les départements ont été supprimés avec succès.', 'success');
      } catch (error) {
        Swal.fire('Erreur!', 'Une erreur est survenue lors de la suppression.', 'error');
      }
    }
  };

  const handleImportDepartments = async (e) => {
    const file = e.target.files[0];
    if (!file) {
      Swal.fire('Erreur!', 'Aucun fichier sélectionné.', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post(import.meta.env.VITE_API_URL + 'api/departements/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.status === 200) {
        Swal.fire('Succès!', 'Les départements ont été importés avec succès.', 'success');
      }
    } catch (error) {
      const status = error?.response?.status;
      if (status === 204 || status === 302 || !error.response) {
        Swal.fire('Import réussi', 'Les départements ont été importés avec succès.', 'success');
      } else {
        console.error('Erreur lors de l\'importation des départements:', error);
        Swal.fire('Erreur!', error?.response?.data?.message || 'Une erreur est survenue.', 'error');
      }
    }
  };

  const toggleDepartmentSelection = (id) => {
    setSelectedDepartments(prev => 
      prev.includes(id) ? prev.filter(deptId => deptId !== id) : [...prev, id]
    );
  };

  if (loading === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <div>
              <h5 className="text-red-800 font-medium">Erreur de chargement</h5>
              <p className="text-red-600">Une erreur est survenue lors du chargement des départements.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6 border-b">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-gray-800">Départements</h1>
          
          <div className="flex flex-wrap gap-2">
            <Link 
              to="/departments/add"
              className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              <span>Ajouter</span>
            </Link>

            <button 
              onClick={handleBulkDelete}
              disabled={selectedDepartments.length === 0}
              className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              <Trash2 className="h-5 w-5 mr-2" />
              <span>Supprimer</span>
            </button>

            <button 
              onClick={() => window.open(`${import.meta.env.VITE_API_URL}api/export-departements`, '_blank')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              <span>Export</span>
            </button>

            {!isEmployee && (
              <>
                <button
                  onClick={() => document.getElementById('fileInput').click()}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Upload className="h-5 w-5 mr-2" />
                  <span>Import</span>
                </button>
                <input
                  type="file"
                  id="fileInput"
                  className="hidden"
                  onChange={handleImportDepartments}
                  accept=".xlsx, .xls, .csv"
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Rechercher un département..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={resetFilters}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                    checked={selectedDepartments.length === departments.length}
                    onChange={() => {
                      if (selectedDepartments.length === departments.length) {
                        setSelectedDepartments([]);
                      } else {
                        setSelectedDepartments(departments.map(d => d.id));
                      }
                    }}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentItems.map((department) => (
                <tr 
                  key={department.id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                      checked={selectedDepartments.includes(department.id)}
                      onChange={() => toggleDepartmentSelection(department.id)}
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">{department.nom}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Link
                      to={`/departments/${department.id}/edit`}
                      className="text-primary-600 hover:text-primary-900 mr-3"
                    >
                      <Pencil className="h-5 w-5 inline" />
                    </Link>
                    <button
                      onClick={() => handleDelete(department.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <Trash2 className="h-5 w-5 inline" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <select
              className="rounded-md border-gray-300 text-sm focus:ring-primary-500 focus:border-primary-500"
              value={itemsPerPage}
              onChange={handleItemsPerPageChange}
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="all">Tous</option>
            </select>
            <span className="text-sm text-gray-500">entrées par page</span>
          </div>

          <nav className="flex items-center gap-1">
            <button
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            
            {getPageNumbers().map((number) => (
              <button
                key={number}
                onClick={() => paginate(number)}
                className={`px-3 py-2 rounded-md ${
                  currentPage === number
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {number}
              </button>
            ))}

            <button
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default DepartmentsListPage;