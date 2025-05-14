import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { login } from '../Redux/Slices/authSlice';
import { Link, useNavigate } from 'react-router-dom';
import { Icon } from '@iconify/react/dist/iconify.js';

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { isLoading, isError, message, user } = useSelector((state) => state.auth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(login({ email, password }));
  };

  useEffect(() => {
    if (user) {
      navigate('/view-profile');
    }
  }, [user, navigate]);

  return (
    <section className='auth bg-base d-flex flex-wrap text-center'>
      <div className='auth-right py-32 px-24 d-flex flex-column justify-content-center'>
        <div className='max-w-464-px mx-auto w-100'>
          <div>
           
            <span  className='mb-40 max-w-290-px'>
              <img src='assets/images/logo.png' alt='WowDash React Vite' />
            </span>
            <h4 className='mb-12'>Bienvenue !</h4>
            <p className='mb-32 text-secondary-light text-lg'>
              Bienvenue, S'il vous plaît entrer vos détails
            </p>
          </div>
          <form onSubmit={handleSubmit}>
            <div className='icon-field mb-16'>
              <span className='icon top-50 translate-middle-y'>
                <Icon icon='mage:email' />
              </span>
              <input
                type='email'
                className='form-control h-56-px bg-neutral-50 radius-12'
                placeholder='Email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className='position-relative mb-20'>
              <div className='icon-field'>
                <span className='icon top-50 translate-middle-y'>
                  <Icon icon='solar:lock-password-outline' />
                </span>
                <input
                  type='password'
                  className='form-control h-56-px bg-neutral-50 radius-12'
                  id='your-password'
                  placeholder='Mot de passe'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <span
                className='toggle-password ri-eye-line cursor-pointer position-absolute end-0 top-50 translate-middle-y me-16 text-secondary-light'
                data-toggle='#your-password'
              />
            </div>
            <div className=''>
              <div className='d-flex justify-content-between gap-2'>
                <div className='form-check style-check d-flex align-items-center'>
                  <input
                    className='form-check-input border border-neutral-300'
                    type='checkbox'
                    defaultValue=''
                    id='remember'
                  />
                  <label className='form-check-label' htmlFor='remember'>
                    Se souvenir de moi
                  </label>
                </div>
                <Link to='#' className='text-primary-600 fw-medium'>
                  Mot de passe oublié ?
                </Link>
              </div>
            </div>
            {isError && (
              <div className="alert alert-danger mb-4 radius-12 d-flex align-items-center bg-transparent border-0" role="alert">
                <Icon icon="mdi:alert-circle" className="me-2 text-red-500" />
                <span className="text-red-500">{message}</span>
              </div>
            )}
            <button
              type='submit'
              className='btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-32'
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>
      </div>
      <div className='auth-left d-lg-block d-none'>
        <div className='d-flex align-items-center flex-column vh-100 justify-content-center overflow-hidden'>
          <img src='assets/images/auth/auth-img.png' alt='WowDash React Vite' />
        </div>
      </div>
    </section>
  );
};

export default Login;