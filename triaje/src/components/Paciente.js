import React, { useState } from 'react';

const Paciente = () => {

  const [dni, setDni] = useState('');

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');

  const [mensaje, setMensaje] = useState('');

  const manejarBusqueda = async (valor) => {

    setDni(valor);

    if (valor.length === 8) {

      try {

        const response = await fetch(
          `http://localhost:4000/api/paciente/${valor}`
        );

        const data = await response.json();

        if (data.success) {

          setNombre(data.paciente.nombre);

          setApellido(data.paciente.apellido);

        } else {

          setNombre('');
          setApellido('');

        }

      } catch (error) {

        console.error(error);

      }

    }

  };

  const manejarEnvio = async (e) => {

    e.preventDefault();

    if (nombre && apellido) {

      setMensaje(
        '✅ Paciente validado. Redirigiendo a signos vitales...'
      );

      setTimeout(() => {

        window.location.href = '/SignosVitales';

      }, 1500);

    } else {

  setMensaje(
    '⚠️ Paciente no validado. Acérquese al módulo de admisión.'
  );

}

  };

  return (

    <div style={estilos.pagina}>

      <div style={estilos.contenedor}>

        <div style={estilos.barra}>

          <span style={estilos.barraTexto}>
            👤 Datos del Paciente
          </span>

        </div>

        <div style={estilos.cuerpo}>

          <h2 style={estilos.titulo}>
            Ficha del Paciente
          </h2>

          <p style={estilos.descripcion}>
            Ingrese el DNI para cargar automáticamente los datos.
          </p>

          {mensaje && (

            <div style={estilos.alerta}>
              {mensaje}
            </div>

          )}

          <form
            onSubmit={manejarEnvio}
            style={estilos.formulario}
          >

            <div style={estilos.grupo}>

              <label style={estilos.etiqueta}>
                DNI
              </label>

              <input
                type="text"
                placeholder="Ej: 12345678"
                value={dni}
                onChange={(e) =>
                  manejarBusqueda(e.target.value)
                }
                required
                maxLength={8}
                style={estilos.input}
              />

            </div>

            <div style={estilos.grupo}>

              <label style={estilos.etiqueta}>
                Nombre
              </label>

              <input
                type="text"
                value={nombre}
                disabled
                style={estilos.inputDisabled}
              />

            </div>

            <div style={estilos.grupo}>

              <label style={estilos.etiqueta}>
                Apellido
              </label>

              <input
                type="text"
                value={apellido}
                disabled
                style={estilos.inputDisabled}
              />

            </div>

            <button
              type="submit"
              style={estilos.boton}
            >
              Continuar
            </button>

          </form>

        </div>

      </div>

    </div>

  );

};

const estilos = {

  pagina: {
    minHeight: '100vh',
    background: '#f0f4f7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    padding: '24px',
  },

  contenedor: {
    width: '100%',
    maxWidth: '560px',
    background: '#fff',
    borderRadius: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
    overflow: 'hidden',
  },

  barra: {
    background: 'linear-gradient(135deg, #1a2e3b, #2c9abf)',
    padding: '14px 24px',
  },

  barraTexto: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: '600',
    letterSpacing: '0.8px',
    textTransform: 'uppercase',
  },

  cuerpo: {
    padding: '36px 40px',
  },

  titulo: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#1a2e3b',
    margin: '0 0 6px',
  },

  descripcion: {
    fontSize: '14px',
    color: '#7a9aaa',
    margin: '0 0 28px',
  },

  alerta: {
    background: '#fffbeb',
    border: '1px solid #f59e0b',
    color: '#92400e',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },

  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '18px',
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
  },

  input: {
    padding: '11px 14px',
    border: '1.5px solid #d0dce4',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1a2e3b',
    background: '#f8fbfc',
    outline: 'none',
  },

  inputDisabled: {
    padding: '11px 14px',
    border: '1.5px solid #d0dce4',
    borderRadius: '8px',
    fontSize: '14px',
    color: '#1a2e3b',
    background: '#edf2f7',
    outline: 'none',
  },

  boton: {
    marginTop: '8px',
    padding: '14px',
    background: 'linear-gradient(135deg, #1a6b8a, #2c9abf)',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
  },

};

export default Paciente;