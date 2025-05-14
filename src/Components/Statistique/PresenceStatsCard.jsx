// src/components/statistics/PresenceStatsCard.jsx
import { Icon } from '@iconify/react';

const PresenceStatsCard = ({ label, value, percentage, icon, bgColor, iconColor }) => (
  <div className={`card shadow-none border ${bgColor}`}>
    <div className="card-body p-20">
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
        <div>
          <p className="fw-medium text-primary-light mb-1">{label}</p>
          <h6 className="mb-0">{value}</h6>
        </div>
        <div className="w-50-px h-50-px rounded-circle d-flex justify-content-center align-items-center" style={{ backgroundColor: `${iconColor}33` }}>
          <Icon icon={icon} className="text-base text-2xl mb-0" color={iconColor} />
        </div>
      </div>
      <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
        <span className="text-success-main">+{percentage}%</span>
        
      </p>
    </div>
  </div>
);

export default PresenceStatsCard;
