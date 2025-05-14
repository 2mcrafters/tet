import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Link, NavLink, useLocation, Outlet, useNavigate } from "react-router-dom";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import { useDispatch } from "react-redux";
import { logout } from "../Redux/Slices/authSlice";
import { useSelector } from "react-redux";
import "./MasterLayout.css";

const MasterLayout = () => {
  const roles = useSelector((state) => state.auth.roles || []);
  const user = useSelector((state) => state.auth.user);
  const apiUrl = import.meta.env.VITE_API_URL;

  const [sidebarActive, setSidebarActive] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [imagePreview, setImagePreview] = useState(
    user?.picture
      ? `${apiUrl}storage/profile_picture/${user.picture}`
      : "assets/images/user-grid/user-grid-img13.png"
  );

  useEffect(() => {
    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");
      document.querySelectorAll(".sidebar-menu .dropdown").forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = "0px";
      });

      if (!isActive && clickedDropdown) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = `${submenu.scrollHeight}px`;
      }
    };

    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    const openActiveDropdown = () => {
      document.querySelectorAll(".sidebar-menu .dropdown").forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location.pathname ||
            link.getAttribute("to") === location.pathname
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) submenu.style.maxHeight = `${submenu.scrollHeight}px`;
          }
        });
      });
    };

    openActiveDropdown();

    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  const handleSidebarToggle = () => {
    setSidebarActive(!sidebarActive);
    setMobileMenu(false);
  };

  const handleMobileMenuToggle = () => {
    setMobileMenu(!mobileMenu);
    setSidebarActive(false);
  };

  const handleLogout = async () => {
    try {
      await dispatch(logout()).unwrap();
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  return (
    <div className={`layout-wrapper ${mobileMenu ? "overlay active" : "overlay"}`}>
      <aside className={`sidebar ${sidebarActive || mobileMenu ? "active" : ""}`}>
        <button
          onClick={handleMobileMenuToggle}
          type="button"
          className="sidebar-close-btn"
        >
          <Icon icon="radix-icons:cross-2" />
        </button>

        <Link to="/" className="sidebar-logo">
          <img
            src="assets/images/logo.png"
            alt="site logo"
            className="light-logo"
          />
          <img
            src="assets/images/logo-light.png"
            alt="site logo"
            className="dark-logo"
          />
        </Link>

        <nav className="sidebar-menu-area">
          <ul className="sidebar-menu">
            <li>
              <NavLink to="/" className={({ isActive }) => isActive ? "active" : ""}>
                <Icon icon="solar:home-smile-angle-outline" className="icon" />
                <span>Tableau de bord</span>
              </NavLink>
            </li>

            {(roles.includes("RH") || roles.includes("Chef_Dep") || roles.includes("Chef_Projet")) && (
              <li className="dropdown">
                <Link to="#">
                  <Icon icon="mdi:account-group-outline" className="icon" />
                  <span>Employés</span>
                </Link>
                <ul className="sidebar-submenu">
                  <li>
                    <NavLink to="/users">
                      <Icon icon="mdi:format-list-bulleted" className="icon" />
                      Liste des employés
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/users/temp">
                      <Icon icon="mdi:format-list-bulleted" className="icon" />
                      Employés Temporaires
                    </NavLink>
                  </li>
                  <li>
                    <NavLink to="/users/add">
                      <Icon icon="mdi:account-plus-outline" className="icon" />
                      Ajouter un employé
                    </NavLink>
                  </li>
                </ul>
              </li>
            )}

            {roles.includes("RH") && (
              <>
                <li className="dropdown">
                  <Link to="#">
                    <Icon icon="fluent:building-people-24-regular" className="icon" />
                    <span>Départements</span>
                  </Link>
                  <ul className="sidebar-submenu">
                    <li>
                      <NavLink to="/departments">
                        <Icon icon="mdi:format-list-bulleted-type" className="icon" />
                        Liste des départements
                      </NavLink>
                    </li>
                    <li>
                      <NavLink to="/departments/add">
                        <Icon icon="mdi:plus-box-outline" className="icon" />
                        Créer un département
                      </NavLink>
                    </li>
                  </ul>
                </li>
                <li className="dropdown">
                  <Link to="#">
                    <Icon icon="fluent:building-people-24-regular" className="icon" />
                    <span>Sociétés</span>
                  </Link>
                  <ul className="sidebar-submenu">
                    <li>
                      <NavLink to="/societes">
                        <Icon icon="mdi:format-list-bulleted-type" className="icon" />
                        Liste des sociétés
                      </NavLink>
                    </li>
                  </ul>
                </li>
              </>
            )}

            <li className="dropdown">
              <Link to="#">
                <Icon icon="mdi:calendar-account-outline" className="icon" />
                <span>Absences</span>
              </Link>
              <ul className="sidebar-submenu">
                {(roles.includes("RH") || roles.includes("Chef_Dep") || roles.includes("Chef_Projet")) && (
                  <li>
                    <NavLink to="/absences">
                      <Icon icon="mdi:clipboard-list-outline" className="icon" />
                      Liste des demandes
                    </NavLink>
                  </li>
                )}
                <li>
                  <NavLink to="/absences/add">
                    <Icon icon="mdi:calendar-plus-outline" className="icon" />
                    Nouvelle demande
                  </NavLink>
                </li>
              </ul>
            </li>

            <li>
              <NavLink to="/pointages">
                <Icon icon="mdi:clock-outline" className="icon" />
                <span>Pointages</span>
              </NavLink>
            </li>

            <li className="dropdown">
              <Link to="#">
                <Icon icon="mdi:chart-box-outline" className="icon" />
                <span>Reporting</span>
              </Link>
              <ul className="sidebar-submenu">
                <li>
                  <NavLink to="/statistiques">
                    <Icon icon="mdi:chart-bar-stacked" className="icon" />
                    Statistiques
                  </NavLink>
                </li>
              </ul>
            </li>
          </ul>
        </nav>
      </aside>

      <main className={`dashboard-main ${sidebarActive ? "active" : ""}`}>
        <header className="navbar-header">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-4">
              <button
                type="button"
                className="sidebar-toggle"
                onClick={handleSidebarToggle}
              >
                <Icon
                  icon={sidebarActive ? "iconoir:arrow-right" : "heroicons:bars-3-solid"}
                  className="icon"
                />
              </button>

              <button
                onClick={handleMobileMenuToggle}
                type="button"
                className="sidebar-mobile-toggle d-lg-none"
              >
                <Icon icon="heroicons:bars-3-solid" className="icon" />
              </button>

              <form className="navbar-search d-none d-md-block">
                <input type="text" name="search" placeholder="Rechercher..." />
                <Icon icon="ion:search-outline" className="icon" />
              </form>
            </div>

            <div className="d-flex align-items-center gap-3">
              <div className="d-none d-lg-block">
                <ThemeToggleButton />
              </div>

              <div className="dropdown">
                <button
                  className="user-dropdown-toggle"
                  type="button"
                  data-bs-toggle="dropdown"
                >
                  <img
                    src={imagePreview}
                    alt="Profile"
                    className="user-avatar"
                  />
                </button>
                <div className="dropdown-menu">
                  <div className="user-info">
                    <h6>{user.name} {user.prenom}</h6>
                    <span>{user.role}</span>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/view-profile" className="dropdown-item">
                    <Icon icon="heroicons:user" className="icon" />
                    Mon profil
                  </Link>
                  <button onClick={handleLogout} className="dropdown-item text-danger">
                    <Icon icon="heroicons:logout" className="icon" />
                    Déconnexion
                  </button>
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <Outlet />
        </div>

        <footer className="dashboard-footer">
          <p>&copy; {new Date().getFullYear()} {import.meta.env.VITE_APP_NAME}. Tous droits réservés.</p>
        </footer>
      </main>
    </div>
  );
};

export default MasterLayout;