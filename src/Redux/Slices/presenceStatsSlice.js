// src/redux/slices/presenceStatsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../config/axios';

export const fetchPresenceStats = createAsyncThunk(
  'presence/fetchStats',
  async (params, thunkAPI) => {
    try {
      let url = '/statistiques/presence?';
      const { periode } = params;

      switch (periode) {
        case 'semaine':
          url += `periode=${periode}&dateDebut=${params.dateDebut}&dateFin=${params.dateFin}`;
          break;
        case 'mois':
          url += `periode=${periode}&mois=${params.mois}`;
          break;
        default:
          url += `periode=${periode}&date=${params.date}`;
      }

      const res = await api.get(url);
      return res.data;
    } catch (error) {
      console.error('Erreur lors du chargement des statistiques:', error);
      return thunkAPI.rejectWithValue('Erreur lors du chargement des statistiques.');
    }
  }
);

const presenceStatsSlice = createSlice({
  name: 'presence',
  initialState: {
    data: null,
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPresenceStats.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPresenceStats.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchPresenceStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = null;
      });
  }
});

export default presenceStatsSlice.reducer;
