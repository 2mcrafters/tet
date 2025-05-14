import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { API_ENDPOINTS } from '../../config/api';
import api from '../../config/axios';

// Async thunks
export const fetchPointages = createAsyncThunk(
  'pointages/fetchPointages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get(API_ENDPOINTS.POINTAGES.BASE);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Helper function to clean time fields
const cleanTimeFields = (data) => {
  const cleanedData = { ...data };
  
  // Format heureEntree
  if (cleanedData.heureEntree === '' || cleanedData.heureEntree === null) {
    cleanedData.heureEntree = null;
  } else if (typeof cleanedData.heureEntree === 'string') {
    // Ensure the time is in HH:MM format
    const [hours, minutes] = cleanedData.heureEntree.split(':');
    cleanedData.heureEntree = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  // Format heureSortie
  if (cleanedData.heureSortie === '' || cleanedData.heureSortie === null) {
    cleanedData.heureSortie = null;
  } else if (typeof cleanedData.heureSortie === 'string') {
    // Ensure the time is in HH:MM format
    const [hours, minutes] = cleanedData.heureSortie.split(':');
    cleanedData.heureSortie = `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  }
  
  return cleanedData;
};

export const createPointage = createAsyncThunk(
  'pointages/createPointage',
  async (pointageData, { rejectWithValue }) => {
    try {
      const cleanedData = cleanTimeFields(pointageData);
      const response = await api.post(API_ENDPOINTS.POINTAGES.BASE, cleanedData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updatePointage = createAsyncThunk(
  'pointages/updatePointage',
  async (updates, { rejectWithValue }) => {
    try {
      // Ensure updates is an array and clean each update
      const cleanedUpdates = Array.isArray(updates) ? updates.map(update => cleanTimeFields(update)) : [cleanTimeFields(updates)];
      
      // Ensure each update has an id
      const validUpdates = cleanedUpdates.filter(update => update.id);
      
      if (validUpdates.length === 0) {
        throw new Error('No valid updates to process');
      }

      const response = await api.put(API_ENDPOINTS.POINTAGES.BASE, validUpdates);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

export const deletePointages = createAsyncThunk(
  'pointages/deletePointages',
  async (ids, { rejectWithValue }) => {
    try {
      await api.delete(API_ENDPOINTS.POINTAGES.BASE, { data: { ids } });
      return ids;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const validerPointage = createAsyncThunk(
  'pointages/validerPointage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`${API_ENDPOINTS.POINTAGES.BASE}/${id}/valider`);
      return response.data.pointage; // Assurez-vous que le backend renvoie le pointage mis à jour
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const invaliderPointage = createAsyncThunk(
  'pointages/invaliderPointage',
  async (id, { rejectWithValue }) => {
    try {
      const response = await api.put(`${API_ENDPOINTS.POINTAGES.BASE}/${id}/invalider`);
      return response.data.pointage; // Assurez-vous que le backend renvoie le pointage mis à jour
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const pointageSlice = createSlice({
  name: 'pointages',
  initialState: {
    items: [],
    status: 'idle',
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch pointages
      .addCase(fetchPointages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPointages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchPointages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Create pointage
      .addCase(createPointage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(createPointage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items.push(action.payload);
      })
      .addCase(createPointage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Update pointage
      .addCase(updatePointage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(updatePointage.fulfilled, (state, action) => {
        const { id, ...updatedPointage } = action.payload;
        const index = state.items.findIndex(pointage => pointage.id === id);
        if (index !== -1) {
          state.items[index] = { ...state.items[index], ...updatedPointage };
        }
        state.status = 'succeeded';
      })
      .addCase(updatePointage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Delete pointages
      .addCase(deletePointages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(deletePointages.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = state.items.filter(p => !action.payload.includes(p.id));
      })
      .addCase(deletePointages.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Valider pointage
      .addCase(validerPointage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(validerPointage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(validerPointage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      })
      // Invalider pointage
      .addCase(invaliderPointage.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(invaliderPointage.fulfilled, (state, action) => {
        state.status = 'succeeded';
        const index = state.items.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(invaliderPointage.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  }
});

export default pointageSlice.reducer;