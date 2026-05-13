import React, { useState, useEffect } from 'react';

const HEADER_HEIGHT = 64; // ajustar si quieres otro tamaño de header

const Admision = () => {
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  const [especialidad, setEspecialidad] = useState('');
  const [doctor, setDoctor] = useState('');
  const [fechaCita, setFechaCita] = useState('');
  const [horaCita, setHoraCita] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768);

  // estado para recibir doctores desde la BD / API (inicial vacío)
  const [doctores, setDoctores] = useState([]);

  useEffect(() => {
    const handleResize = () => setEsMobil(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {

  fetch('http://localhost:4000/api/doctores')

    .then(res => res.json())

    .then(data => {

      setDoctores(data);

    })

    .catch(err => {

      console.error(
        'Error cargando doctores:',
        err
      );

    });

}, []);

  const manejarEnvio = async (e) => {

  e.preventDefault();

  try {

    const response = await fetch(
      'http://localhost:4000/api/paciente',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dni,
          nombre,
          apellido,
          fechaNacimiento
        })
      }
    );

    const data = await response.json();

    if (data.success) {

      setEnviado(true);

      setTimeout(() => {

        setDni('');
        setNombre('');
        setApellido('');
        setFechaNacimiento('');

        setEspecialidad('');
        setDoctor('');
        setFechaCita('');
        setHoraCita('');

        setEnviado(false);

      }, 2000);

    } else {

      alert('Error registrando paciente');

    }

  } catch (error) {

    console.error(error);

    alert('Error servidor');

  }

};

  const especialidades = [
    'Medicina General',
    'Cardiología',
    'Pediatría',
    'Ginecología',
    'Traumatología',
    'Neurología',
    'Dermatología',
  ];

  const contentHeight = `calc(100vh - ${HEADER_HEIGHT}px)`;

  return (
    <div style={{ ...estilos.pagina, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ ...estilos.header, height: HEADER_HEIGHT }}>
        <div style={estilos.headerIzq}>
          <span style={{ fontSize: '24px' }}>⚕️</span>
          <span style={estilos.logoTexto}>VitaScan</span>
        </div>
      </div>

      <div style={{ ...estilos.contenido, minHeight: contentHeight, flexDirection: esMobil ? 'column' : 'row' }}>
        {/* Panel info izquierdo — sin cambios visuales excepto que subimos el contenido */}
        {!esMobil && (
          <div style={estilos.panelInfo}>
            <div style={estilos.panelInfoInner}>
              <h3 style={estilos.panelTitulo}>Registro de Admisión</h3>
              <p style={estilos.panelDesc}>Complete los datos del paciente para registrarlo en el sistema de monitoreo hospitalario.</p>
              <div style={estilos.pasos}>
                {[
                  'Ingresa el DNI del paciente',
                  'Completa nombre, apellido y fecha de nacimiento',
                  'Selecciona el tipo de seguro',
                  'Elige doctor, fecha y hora de cita',
                  'Confirma el registro',
                ].map((paso, i) => (
                  <div key={i} style={estilos.paso}>
                    <div style={estilos.pasoBadge}>{i + 1}</div>
                    <span style={estilos.pasoTexto}>{paso}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Formulario - ajustado para "subir" el título */}
        <div
          style={{
            ...estilos.formularioPanel,
            // alineamos al inicio para que el título quede más arriba
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'flex-start',
            padding: esMobil ? '16px' : '24px', // menos padding superior
            width: esMobil ? '100%' : '560px',
            boxSizing: 'border-box',
            minHeight: 'auto',
          }}
        >
          <div style={{ width: '100%', maxHeight: `calc(${contentHeight} - 40px)`, overflow: 'hidden' }}>
            {esMobil && (
              <div style={estilos.movilTitulo}>
                <h2 style={estilos.tituloForm}>Registro de Paciente</h2>
              </div>
            )}
            {!esMobil && <h2 style={estilos.tituloForm}>Registro de Paciente</h2>}
            <p style={estilos.subtituloForm}>Complete todos los campos para registrar al paciente.</p>

            {enviado && (
              <div style={estilos.alerta}>✅ Paciente registrado exitosamente en el sistema</div>
            )}

            <form onSubmit={manejarEnvio} style={{ ...estilos.formulario, gap: 12 }}>
              {/* Grid compacto: 2 columnas en desktop, 1 en móvil */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: esMobil ? '1fr' : '1fr 1fr',
                gap: '10px 12px',
                alignItems: 'center'
              }}>
                <div style={estilos.grupo}>
                  <label style={estilos.etiqueta}>DNI del Paciente</label>
                  <input type="text" placeholder="Ej: 12345678" value={dni}
                    onChange={(e) => setDni(e.target.value)} required maxLength={8}
                    style={{ ...estilos.input, padding: '10px 12px', height: 40 }} />
                </div>

                <div style={estilos.grupo}>
                  <label style={estilos.etiqueta}>Fecha de Nacimiento</label>
                  <input type="date" value={fechaNacimiento}
                    onChange={(e) => setFechaNacimiento(e.target.value)} required
                    style={{ ...estilos.input, padding: '10px 12px', height: 40 }} />
                </div>

                <div style={estilos.grupo}>
                  <label style={estilos.etiqueta}>Nombre(s)</label>
                  <input type="text" placeholder="Nombres" value={nombre}
                    onChange={(e) => setNombre(e.target.value)} required
                    style={{ ...estilos.input, padding: '10px 12px', height: 40 }} />
                </div>

                <div style={estilos.grupo}>
                  <label style={estilos.etiqueta}>Apellido(s)</label>
                  <input type="text" placeholder="Apellidos" value={apellido}
                    onChange={(e) => setApellido(e.target.value)} required
                    style={{ ...estilos.input, padding: '10px 12px', height: 40 }} />
                </div>

                {/* Especialidad + Doctor en la misma fila (ocupa 2 columnas en mobile) */}
                <div style={{ gridColumn: esMobil ? 'auto' : '1 / 3', display: 'grid', gridTemplateColumns: esMobil ? '1fr' : '1fr 1fr', gap: 12 }}>
                  <div style={estilos.grupo}>
                    <label style={estilos.etiqueta}>Especialidad Médica</label>
                    <select
                      value={especialidad}
                      onChange={(e) => setEspecialidad(e.target.value)}
                      required
                      style={{ ...estilos.select, padding: '10px 12px', height: 40 }}
                    >
                      <option value="">Seleccione especialidad...</option>
                      {especialidades.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>

                  <div style={estilos.grupo}>
                    <label style={estilos.etiqueta}>Doctor Asignado</label>
                    {/* Opciones vacías — deberás poblar `doctores` desde tu BD/APi */}
                    <select
                      value={doctor}
                      onChange={(e) => setDoctor(e.target.value)}
                      required
                      style={{ ...estilos.select, padding: '10px 12px', height: 40 }}
                    >
                      <option value="">Seleccione un doctor...</option>
                      {doctores.length === 0 && (
                        <option value="" disabled>Los doctores se cargarán desde la base de datos</option>
                      )}
                      {doctores.map((d) => (

  <option
    key={d.id_medico}
    value={d.id_medico}
  >
    Dr. {d.nombre} {d.apellido} — {d.especialidad}
  </option>

))}
                    </select>
                  </div>
                </div>

                <div style={estilos.grupo}>
                  <label style={estilos.etiqueta}>Fecha de la Cita</label>
                  <input type="date" value={fechaCita}
                    onChange={(e) => setFechaCita(e.target.value)} required
                    style={{ ...estilos.input, padding: '10px 12px', height: 40 }} />
                </div>

                <div style={estilos.grupo}>
                  <label style={estilos.etiqueta}>Hora de la Cita</label>
                  <input type="time" value={horaCita}
                    onChange={(e) => setHoraCita(e.target.value)} required
                    style={{ ...estilos.input, padding: '10px 12px', height: 40 }} />
                </div>
              </div>

              {/* Contenedor del botón: centrado y con ancho reducido del botón */}
              <div style={{ marginTop: 10, display: 'flex', justifyContent: 'center' }}>
                <button type="submit" style={{ ...estilos.boton, padding: '12px', fontSize: 14 }}>Registrar Paciente</button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const estilos = {
  pagina: {
    minHeight: '100vh',
    background: '#f0f4f8',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    background: 'linear-gradient(135deg, #1e3a5f, #1a6b8a)',
    padding: '16px 32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerIzq: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },

  logoTexto: {
    fontSize: '18px',
    fontWeight: '800',
    color: '#fff',
  },

  contenido: {
    display: 'flex',
    gap: '0',
    minHeight: 'calc(100vh - 56px)',
    flexDirection: 'column',
  },

  // Panel izquierdo: contenido alineado arriba y con menos padding para "subir" el título
  panelInfo: {
    width: '100%',
    maxWidth: '340px',
    background: 'linear-gradient(145deg, #1e3a5f, #1a6b8a)',
    display: 'flex',
    alignItems: 'flex-start', // que el contenido quede arriba
    justifyContent: 'center',
    padding: '28px 24px', // menos espacio superior
  },

  panelInfoInner: {
    color: '#fff',
  },

  iconoGrande: {
    fontSize: '48px',
    marginBottom: '20px',
  },

  panelTitulo: {
    fontSize: '22px',
    fontWeight: '800',
    margin: '4px 0 10px', // sube el título del panel
    letterSpacing: '-0.3px',
  },

  panelDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.7,
    margin: '0 0 18px',
  },

  pasos: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  paso: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },

  pasoBadge: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '800',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },

  pasoTexto: {
    fontSize: '13px',
    color: 'rgba(255,255,255,0.85)',
    fontWeight: '600',
  },

  formularioPanel: {
    flex: 1,
    background: '#f8fafc',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
  },

  movilTitulo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
  },

  tituloForm: {
    fontSize: '24px',
    fontWeight: '800',
    color: '#0f2944',
    margin: '6px 0 6px', // sube el título del formulario un poco
    letterSpacing: '-0.5px',
  },

  subtituloForm: {
    fontSize: '14px',
    color: '#94a3b8',
    margin: '0 0 24px',
  },

  alerta: {
    background: '#fffbeb',
    border: '1.5px solid #f59e0b',
    color: '#92400e',
    padding: '12px 16px',
    borderRadius: '12px',
    marginBottom: '20px',
    fontSize: '14px',
    fontWeight: '600',
  },

  formulario: {
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },

  fila: {
    display: 'flex',
    gap: '16px',
    flexDirection: 'column',
  },

  grupo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },

  etiqueta: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#334155',
  },

  input: {
    padding: '13px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#0f2944',
    background: '#fff',
    outline: 'none',
    transition: 'border-color 0.2s',
    width: '100%',
    boxSizing: 'border-box',
  },

  select: {
    padding: '13px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '12px',
    fontSize: '14px',
    color: '#0f2944',
    background: '#fff',
    outline: 'none',
    cursor: 'pointer',
    width: '100%',
    boxSizing: 'border-box',
  },

  // Botón ahora menos ancho por defecto
  boton: {
    marginTop: '8px',
    padding: '12px 18px',
    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    fontSize: '15px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(245,158,11,0.4)',
    width: '220px', // ancho reducido — cambia este número si prefieres otro ancho
    textAlign: 'center',
  },

  '@media (max-width: 768px)': {
    header: { padding: '12px 20px' },
    logoTexto: { fontSize: '16px' },
    paginaLabel: { fontSize: '12px' },
    formularioPanel: { padding: '32px 24px' },
    tituloForm: { fontSize: '22px' },
    subtituloForm: { fontSize: '12px' },
    alerta: { fontSize: '12px' },
    input: { fontSize: '12px' },
    select: { fontSize: '12px' },
    boton: { fontSize: '14px', width: '200px' }, // un poco más pequeño en móvil
  },
};

export default Admision;