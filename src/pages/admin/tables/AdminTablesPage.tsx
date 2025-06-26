import React, { useState, useEffect } from 'react';
import { AdminLayout } from '../../../components/admin/AdminLayout';
import { AdminTable } from '../../../components/admin/AdminTable';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { AdminForm } from '../../../components/admin/AdminForm';
import { Table } from '../../../types';
import { adminTableService, adminReservationService } from '../../../services/api';
import { Pencil, Trash2, Plus as PlusIcon } from '../../../utils/icons';
import { showDangerConfirm, showSuccess, showError, showLoading, closeLoading } from '../../../utils/alerts';

export const AdminTablesPage: React.FC = () => {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [formValues, setFormValues] = useState({
    name: '',
    description: ''
  });
  const [formError, setFormError] = useState<string | null>(null);

  const fetchTables = async () => {
    try {
      setLoading(true);
      const data = await adminTableService.getAllTables();
      setTables(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar mesas: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTables();
  }, []);

  const handleOpenModal = (table: Table | null = null) => {
    if (table) {
      setIsEditMode(true);
      setSelectedTable(table);
      setFormValues({
        name: table.name,
        description: table.description || ''
      });
    } else {
      setIsEditMode(false);
      setSelectedTable(null);
      setFormValues({
        name: '',
        description: ''
      });
    }
    setIsModalOpen(true);
    setFormError(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleInputChange = (name: string, value: string | number) => {
    setFormValues((prev) => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      showLoading(isEditMode ? 'Actualizando mesa...' : 'Creando mesa...');
      
      if (isEditMode && selectedTable) {
        // Actualizamos mesa
        const tableData = {
          name: formValues.name,
          description: formValues.description
        };
        await adminTableService.updateTable(selectedTable.id, tableData);
        closeLoading();
        showSuccess(
          'Mesa actualizada', 
          `La mesa "${formValues.name}" ha sido actualizada correctamente`
        );
      } else {
        // Creamos mesa nueva
        await adminTableService.createTable({
          name: formValues.name,
          description: formValues.description
        });
        closeLoading();
        showSuccess(
          'Mesa creada', 
          `La mesa "${formValues.name}" ha sido creada correctamente`
        );
      }
      
      // Recargamos la lista de mesas
      fetchTables();
      handleCloseModal();
    } catch (err) {
      closeLoading();
      showError('Error', (err as Error).message);
      setFormError('Error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };  const handleDeleteTable = async (tableId: number) => {
    try {
      // Mostramos el indicador de carga
      showLoading('Comprobando reservas...');
      
      // Obtenemos la información de la mesa que se quiere eliminar
      const tableToDelete = tables.find(table => table.id === tableId);
      if (!tableToDelete) {
        closeLoading();
        showError('Error', 'No se encontró la mesa que se desea eliminar');
        return;
      }
      
      // Comprobamos si la mesa tiene reservas activas asociadas (solo para mostrar al usuario)
      const activeReservations = await adminReservationService.getReservationsByTableId(tableId);
      
      // Obtenemos todas las reservas asociadas a la mesa (para eliminarlas todas)
      const allReservations = await adminReservationService.getAllReservationsByTableId(tableId);
      
      // Cerramos el indicador de carga
      closeLoading();
      
      // Si hay reservas activas asociadas, mostramos un mensaje especial mencionando solo las activas
      if (activeReservations && activeReservations.length > 0) {
        const confirmMessage = `La mesa "${tableToDelete.name}" tiene ${activeReservations.length} reservas activas asociadas.
Si continúas, se eliminarán todas las reservas y la mesa.
Esta acción no se puede deshacer.`;
        
        const isConfirmed = await showDangerConfirm(
          'Eliminar mesa y reservas asociadas',
          confirmMessage,
          'Eliminar todo',
          'Cancelar'
        );
        
        if (isConfirmed) {
          showLoading('Eliminando reservas y mesa...');
          
          try {            // Eliminamos TODAS las reservas asociadas (activas, canceladas, completadas)
            const resultDelete = await adminReservationService.deleteMultipleReservations(allReservations.map(r => r.id));
            
            // Si hay mensaje de advertencia (algunas reservas no se pudieron eliminar), lo mostramos al usuario
            const hasFailed = resultDelete.message.includes('No se pudieron eliminar');
            
            // Ahora eliminamos la mesa con force=true para asegurar que se eliminan todas las reservas
            // incluso si alguna falló en el paso anterior
            await adminTableService.deleteTable(tableId, true);
            
            closeLoading();
            
            if (hasFailed) {
              // Si hubo problemas con algunas reservas, mostramos un mensaje informativo
              showSuccess(
                'Mesa eliminada parcialmente', 
                `La mesa "${tableToDelete.name}" ha sido eliminada correctamente, pero ${resultDelete.message}`
              );
            } else {
              showSuccess(
                'Mesa eliminada', 
                `La mesa "${tableToDelete.name}" y sus reservas han sido eliminadas correctamente`
              );
            }
            
            fetchTables(); // Recargamos la lista tras eliminar
          } catch (error) {
            closeLoading();
            showError('Error al eliminar', `No se pudo completar la operación: ${(error as Error).message}`);
          }
        }      } else {
        // Si no hay reservas activas, verificamos si hay otras reservas (canceladas/completadas)
        const hasOtherReservations = allReservations && allReservations.length > 0;
        
        const confirmMessage = hasOtherReservations
          ? `La mesa "${tableToDelete.name}" no tiene reservas activas, pero tiene ${allReservations.length} reservas canceladas o completadas que también se eliminarán. ¿Deseas continuar?`
          : `¿Estás seguro de que deseas eliminar la mesa "${tableToDelete.name}"? Esta acción no se puede deshacer.`;
        
        const isConfirmed = await showDangerConfirm(
          'Eliminar mesa',
          confirmMessage,
          'Eliminar',
          'Cancelar'
        );
        
        if (isConfirmed) {
          showLoading('Eliminando mesa...');
          
          try {            // Si hay reservas (canceladas o completadas), primero las eliminamos
            let resultDelete = { message: "" };
            if (hasOtherReservations) {
              resultDelete = await adminReservationService.deleteMultipleReservations(allReservations.map(r => r.id));
            }
            
            // Si hay mensaje de advertencia (algunas reservas no se pudieron eliminar), lo verificamos
            const hasFailed = hasOtherReservations && resultDelete.message.includes('No se pudieron eliminar');
            
            // Ahora eliminamos la mesa, con force=true si hay reservas históricas
            await adminTableService.deleteTable(tableId, hasOtherReservations);
            
            closeLoading();
            
            let successMessage;
            if (hasOtherReservations) {
              if (hasFailed) {
                successMessage = `La mesa "${tableToDelete.name}" ha sido eliminada, pero ${resultDelete.message}`;
              } else {
                successMessage = `La mesa "${tableToDelete.name}" y sus ${allReservations.length} reservas históricas han sido eliminadas correctamente`;
              }
            } else {
              successMessage = `La mesa "${tableToDelete.name}" ha sido eliminada correctamente`;
            }
            
            showSuccess('Mesa eliminada', successMessage);
            
            fetchTables(); // Recargamos la lista tras eliminar
          } catch (error) {
            closeLoading();
            showError('Error al eliminar', `No se pudo completar la operación: ${(error as Error).message}`);
          }
        }
      }
    } catch (err) {
      closeLoading();
      showError('Error', 'Error al eliminar mesa: ' + (err as Error).message);
      setError('Error al eliminar mesa: ' + (err as Error).message);
    }
  };

  const formFields = [
    { name: 'name', label: 'Nombre', type: 'text' as const, required: true, placeholder: 'Nombre de la mesa' },
    { name: 'description', label: 'Descripción', type: 'text' as const, required: false, placeholder: 'Descripción opcional' }
  ];

  const columns = [
    { 
      header: 'ID', 
      accessor: 'id' as keyof Table,
      className: 'w-12 hidden sm:table-cell' 
    },
    { 
      header: 'Nombre', 
      accessor: 'name' as keyof Table,
      className: 'w-1/4'
    },
    { 
      header: 'Descripción', 
      accessor: (table: Table) => table.description || '-',
      className: 'w-2/5'
    },
    { 
      header: 'Fecha de creación', 
      accessor: (table: Table) => {
        if (!table.created_at) return '-';
        return new Date(table.created_at).toLocaleDateString('es-ES', { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      },
      className: 'w-1/5'
    }
  ];  const renderActions = (table: Table) => (
    <div className="flex justify-end items-center gap-1">
      <Button 
        variant="ghost" 
        size="xs"
        onClick={() => handleOpenModal(table)}
        className="p-1"
        title="Editar mesa"
      >
        <Pencil className="w-4 h-4" />
      </Button>
      <Button 
        variant="ghost" 
        size="xs"
        onClick={() => handleDeleteTable(table.id)}
        className="p-1"
        title="Eliminar mesa"
      >
        <Trash2 className="w-4 h-4 text-red-500" />
      </Button>
    </div>
  );

  return (
    <AdminLayout title="Administrar Mesas">
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Gestiona las mesas del establecimiento
        </p>
        <Button 
          onClick={() => handleOpenModal()}
          className="flex items-center"
        >
          <PlusIcon className="w-5 h-5 mr-1" />
          Nueva Mesa
        </Button>
      </div>

      <AdminTable
        columns={columns}
        data={tables}
        actions={renderActions}
        keyExtractor={(table) => table.id}
        loading={loading}
        error={error}
        emptyMessage="No hay mesas registradas"
      />

      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={isEditMode ? "Editar Mesa" : "Crear Mesa"}
      >
        <AdminForm
          fields={formFields}
          values={formValues}
          onChange={handleInputChange}
          onSubmit={handleSubmitForm}
          submitText={isEditMode ? "Guardar Cambios" : "Crear Mesa"}
          loading={loading}
          error={formError}
        />
      </Modal>
    </AdminLayout>
  );
};
