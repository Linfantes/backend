import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const InicioSesion = () => {

  const [dni, setDni] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [cargando, setCargando] = useState(false);

  const [mensaje, setMensaje] = useState('');
  const [tipoMensaje, setTipoMensaje] = useState('');

  const navigate = useNavigate();

  const manejarLogin = async (e) => {

    e.preventDefault();

    setCargando(true);

    try {

      const respuesta = await fetch(
        "http://localhost:4000/api/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dni,
            password: contraseña,
          }),
        }
      );

      const data = await respuesta.json();

      if (data.success) {

        // ADMIN
        if (data.rol === "Admin") {

          localStorage.setItem(
            'rol',
            data.rol
          );

          navigate("/");

        }

        // DOCTOR
        else if (data.rol === "Doctor") {

          localStorage.setItem(
            'rol',
            data.rol
          );

          navigate("/dashboard");

        }

        // ADMISION
        else if (data.rol === "Admision") {

          localStorage.setItem(
            'rol',
            data.rol
          );

          navigate("/admision");

        }

      } else {

        setMensaje(
          '❌ Credenciales incorrectas'
        );

        setTipoMensaje('error');

      }

    } catch (error) {

      setMensaje(
        '❌ Error del servidor'
      );

      setTipoMensaje('error');

    }

    setCargando(false);

  };

  return (

    <div style={estilos.pagina}>

      <div style={estilos.tarjeta}>

        <div style={estilos.encabezado}>

          <div style={estilos.icono}>
            ⚕
          </div>

          <h2 style={estilos.titulo}>
            Bienvenido
          </h2>

          <p style={estilos.subtitulo}>
            Sistema de triaje inteligente
          </p>

          {
            mensaje && (

              <div
                style={{
                  marginTop: '15px',
                  padding: '12px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  background:
                    tipoMensaje === 'success'
                      ? '#dcfce7'
                      : '#fee2e2',
                  color:
                    tipoMensaje === 'success'
                      ? '#166534'
                      : '#991b1b',
                  border:
                    tipoMensaje === 'success'
                      ? '1px solid #86efac'
                      : '1px solid #fca5a5',
                }}
              >
                {mensaje}
              </div>

            )
          }

        </div>

        <form
          onSubmit={manejarLogin}
          style={estilos.formulario}
        >

          <div style={estilos.grupo}>

            <label style={estilos.etiqueta}>
              DNI
            </label>

            <input
              type="text"
              placeholder="Ingresa tu DNI"
              value={dni}
              onChange={(e) =>
                setDni(e.target.value)
              }
              required
              style={estilos.input}
            />

          </div>

          <div style={estilos.grupo}>

            <label style={estilos.etiqueta}>
              Contraseña
            </label>

            <input
              type="password"
              placeholder="Ingresa tu contraseña"
              value={contraseña}
              onChange={(e) =>
                setContraseña(e.target.value)
              }
              required
              style={estilos.input}
            />

          </div>

          <button
            type="submit"
            style={estilos.boton}
            disabled={cargando}
          >
            {
              cargando
                ? 'Verificando...'
                : 'Ingresar'
            }
          </button>

        </form>

      </div>

    </div>

  );

};

const estilos = {

  pagina: {
    minHeight: '100vh',
    background:
      'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily:
      "'Georgia', 'Times New Roman', serif",
    padding: '20px',
  },

  tarjeta: {
    background: 'rgba(255,255,255,0.97)',
    borderRadius: '16px',
    padding: '48px 40px',
    width: '100%',
    maxWidth: '420px',
    boxShadow:
      '0 24px 60px rgba(0,0,0,0.4)',
  },

  encabezado: {
    textAlign: 'center',
    marginBottom: '36px',
  },

  icono: {
    fontSize: '40px',
    marginBottom: '12px',
    display: 'block',
  },

  titulo: {
    fontSize: '26px',
    fontWeight: '700',
    color: '#1a2e3b',
    margin: '0 0 6px',
    letterSpacing: '-0.5px',
  },

  subtitulo: {
    fontSize: '13px',
    color: '#6b8a9a',
    margin: 0,
    letterSpacing: '0.5px',
    textTransform: 'uppercase',
  },

  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },

  grupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },

  etiqueta: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#344d5c',
    letterSpacing: '0.3px',
  },

  input: {
    padding: '12px 14px',
    border: '1.5px solid #d0dce4',
    borderRadius: '8px',
    fontSize: '15px',
    color: '#1a2e3b',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: '#f8fbfc',
  },

  boton: {
    marginTop: '8px',
    padding: '14px',
    background:
      'linear-gradient(135deg, #1a6b8a, #2c9abf)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    letterSpacing: '0.3px',
    transition: 'opacity 0.2s',
  },

};

export default InicioSesion;