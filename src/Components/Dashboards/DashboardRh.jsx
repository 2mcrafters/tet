import React from 'react'
import UsersListPage from "../../Pages/UsersListPage"
import AbsenceRequestsListPage from "../../Pages/AbsenceRequestsListPage"
import DepartmentsListPage from "../../Pages/DepartmentsListPage"
import PresenceDashboard from '../Statistique/PresenceDashboard'
function DashboardRh() {

  return (

    <div className='row'>
        <div className="col-12">
            <PresenceDashboard isDashboard={true}/>
        </div>
        <div className="col-12 col-md-6 gap-2">
      <UsersListPage/>
      </div>
      <div className="col-12 col-md-6 gap-2">
      <AbsenceRequestsListPage className="mb-2"/>
      <DepartmentsListPage/>

      </div>
    </div>
  )
}

export default DashboardRh
