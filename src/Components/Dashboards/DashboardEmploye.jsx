import React from 'react'
import PointagesListPage from "../../Pages/PointagesListPage"
import AbsenceRequestsListPage from "../../Pages/AbsenceRequestsListPage"
import DepartmentsListPage from "../../Pages/DepartmentsListPage"
import PresenceDashboard from '../Statistique/PresenceDashboard'
function DashboardEmploye() {

  return (

    <div className='row'>
        <div className="col-12">
            <PresenceDashboard isDashboard={true}/>
        </div>
        <div className="col-12 col-md-6 gap-2">
      <PointagesListPage/>
      </div>
      <div className="col-12 col-md-6 gap-2">
      <AbsenceRequestsListPage className="mb-2"/>

      </div>
    </div>
  )
}

export default DashboardEmploye
