// src/components/statistics/PresenceDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPresenceStats } from '../../Redux/Slices/presenceStatsSlice';
import PresenceStatsCard from './PresenceStatsCard';
import PresenceChart from './PresenceChart';
import PresenceBarChart from './PresenceBarChart';

const PresenceDashboard =  ({ isDashboard = false }) => {
  const dispatch = useDispatch();
  const [periode, setPeriode] = useState('jour');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [dateDebut, setDateDebut] = useState(new Date().toISOString().split('T')[0]);
  const [dateFin, setDateFin] = useState(new Date().toISOString().split('T')[0]);
  const [mois, setMois] = useState(new Date().toISOString().slice(0, 7));

  const { data: stats, loading } = useSelector((state) => state.presence);

  useEffect(() => {
    let params = {};
    switch (periode) {
      case 'jour':
        params = { periode, date };
        break;
      case 'semaine':
        params = { periode, dateDebut, dateFin };
        break;
      case 'mois':
        params = { periode, mois };
        break;
      default:
        params = { periode, date };
    }
    dispatch(fetchPresenceStats(params));
  }, [periode, date, dateDebut, dateFin, mois, dispatch]);

  const chartData = stats ? [
    { name: 'Présents', value: stats.present || 0 },
    { name: 'Absents', value: stats.absent || 0 },
    { name: 'En Retard', value: stats.en_retard || 0 },
  ] : [];

  return (
    <div className="card h-100 p-0 radius-12">
      <div className="card-header border-bottom bg-base py-16 px-24">
        <h6 className="text-lg fw-semibold mb-0">Taux de présence</h6>
      </div>
      <div className="card-body p-24">
        <div className="flex flex-col md:flex-row gap-4 justify-center items-center mb-6">
          <select
            className="border p-2 rounded"
            value={periode}
            onChange={(e) => setPeriode(e.target.value)}
          >
            <option value="jour">Par Jour</option>
            <option value="semaine">Entre 2 Jours</option>
            <option value="mois">Par Mois</option>
          </select>

          {periode === 'jour' && (
            <input
              type="date"
              className="border p-2 rounded"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}

          {periode === 'semaine' && (
            <div className="flex gap-2">
              <input
                type="date"
                className="border p-2 rounded"
                value={dateDebut}
                onChange={(e) => setDateDebut(e.target.value)}
              />
              <input
                type="date"
                className="border p-2 rounded"
                value={dateFin}
                onChange={(e) => setDateFin(e.target.value)}
              />
            </div>
          )}

          {periode === 'mois' && (
            <input
              type="month"
              className="border p-2 rounded"
              value={mois}
              onChange={(e) => setMois(e.target.value)}
            />
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Chargement...</p>
        ) : stats ? (
          <>
            <div className="row row-cols-xxxl-3 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4">
              <PresenceStatsCard
                label="Total Présent"
                value={stats.present}
                percentage={stats.pourcentage_present}
                icon="mdi:account-check"
                bgColor="bg-gradient-start-1"
                iconColor="#10B981"
              />
              <PresenceStatsCard
                label="Total Absent"
                value={stats.absent}
                percentage={stats.pourcentage_absent}
                icon="mdi:account-off"
                bgColor="bg-gradient-start-2"
                iconColor="#EF4444"
              />
              <PresenceStatsCard
                label="Total En Retard"
                value={stats.en_retard}
                percentage={stats.pourcentage_en_retard}
                icon="mdi:clock-alert"
                bgColor="bg-gradient-start-5"
                iconColor="#F59E0B"
              />
            </div>
{ !isDashboard ?(           <div className="mt-10 d-flex flex-wrap justify-content-between gap-3">
  <div className="bg-white p-4 rounded-lg shadow flex-grow-1" style={{ flexBasis: '300px', maxWidth: '600px' }}>
    <h3 className="text-lg font-semibold mb-4">Répartition en pourcentage</h3>
    <PresenceChart data={chartData} />
  </div>
  <div className="bg-white p-4 rounded-lg shadow flex-grow-1" style={{ flexBasis: '300px', maxWidth: '600px' }}>
    <h3 className="text-lg font-semibold mb-4">Nombre d'employés par statut</h3>
    <PresenceBarChart data={chartData} />
  </div>
</div>) : <></>

} 

          </>
        ) : (
          <p className="text-center text-gray-500">Aucune donnée disponible</p>
        )}
      </div>
    </div>
  );
};

export default PresenceDashboard;
