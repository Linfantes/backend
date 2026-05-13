import React, { useState, useEffect } from 'react';

const SignosVitales = () => {

  const [progreso, setProgreso] = useState(0);
  const [listo, setListo] = useState(false);
  const [mensaje, setMensaje] = useState('Coloque su dedo y acérquese a 2 cm del sensor');
  const [esMobil, setEsMobil] = useState(window.innerWidth < 768);

  const [vitales, setVitales] = useState([
    {
      icono: '🌡️',
      valor: '--',
      unidad: '°C',
      etiqueta: 'Temperatura corporal',
      color: '#d97706',
      bg: '#fffbeb',
      borde: '#fde68a'
    },
    {
      icono: '❤️',
      valor: '--',
      unidad: 'bpm',
      etiqueta: 'Pulso',
      color: '#dc2626',
      bg: '#fef2f2',
      borde: '#fca5a5'
    },
    {
      icono: '💧',
      valor: '--',
      unidad: '%',
      etiqueta: 'Oxigenación',
      color: '#1a6b8a',
      bg: '#f0f9ff',
      borde: '#7dd3fc'
    }
  ]);

  useEffect(() => {

    const handleResize = () => setEsMobil(window.innerWidth < 768);

    window.addEventListener('resize', handleResize);

    return () => window.removeEventListener('resize', handleResize);

  }, []);

  useEffect(() => {

    const obtenerDatos = async () => {

      try {

        setMensaje('Midiendo signos vitales...');
        setListo(false);
        setProgreso(60);

        const response = await fetch('http://localhost:4000/api/signos');

        const data = await response.json();

        if (data.length > 0) {

          const ultimo = data[0];

          setVitales([
            {
              icono: '🌡️',
              valor: ultimo.temperatura,
              unidad: '°C',
              etiqueta: 'Temperatura corporal',
              color: '#d97706',
              bg: '#fffbeb',
              borde: '#fde68a'
            },
            {
              icono: '❤️',
              valor: ultimo.pulso,
              unidad: 'bpm',
              etiqueta: 'Pulso',
              color: '#dc2626',
              bg: '#fef2f2',
              borde: '#fca5a5'
            },
            {
              icono: '💧',
              valor: ultimo.saturacion_oxigeno,
              unidad: '%',
              etiqueta: 'Oxigenación',
              color: '#1a6b8a',
              bg: '#f0f9ff',
              borde: '#7dd3fc'
            }
          ]);

          setMensaje('✓ Lectura completada');
          setProgreso(100);
          setListo(true);

        }

      } catch (error) {

        console.error('Error obteniendo signos:', error);

        setMensaje('Esperando lectura...');
        setProgreso(0);
        setListo(false);

      }

    };

    obtenerDatos();

    const intervalo = setInterval(obtenerDatos, 3000);

    return () => clearInterval(intervalo);

  }, []);

  const radio = 54;
  const circunferencia = 2 * Math.PI * radio;
  const offset = circunferencia - (progreso / 100) * circunferencia;

  return (

    <div style={estilos.pagina}>

      <div style={estilos.header}>

        <div style={estilos.headerIzq}>
          <span style={{ fontSize: '24px' }}>⚕️</span>
          <span style={estilos.logoTexto}>VitalScan</span>
        </div>

      </div>

      <div style={{ ...estilos.cuerpo, flexDirection: esMobil ? 'column' : 'row' }}>

        <div style={{
          ...estilos.panelIzquierdo,
          padding: esMobil ? '28px 20px' : '48px 44px',
          minHeight: esMobil ? 'auto' : 'calc(100vh - 56px)',
        }}>

          <div style={estilos.panelIzqInner}>

            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🫳</div>

            <h2 style={estilos.panelTitulo}>Mida sus signos vitales</h2>

            <p style={estilos.panelDesc}>
              Coloque su dedo en el sensor y espere unos segundos.
            </p>

          </div>

        </div>

        <div style={{
          ...estilos.panelDerecho,
          padding: esMobil ? '28px 16px' : '48px 40px',
        }}>

          <div style={estilos.circuloContenedor}>

            <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>

              <circle
                cx="70"
                cy="70"
                r={radio}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />

              <circle
                cx="70"
                cy="70"
                r={radio}
                fill="none"
                stroke={listo ? '#d97706' : '#1a6b8a'}
                strokeWidth="10"
                strokeDasharray={circunferencia}
                strokeDashoffset={offset}
                strokeLinecap="round"
              />

            </svg>

            <div style={estilos.circuloTexto}>

              <span style={{
                fontSize: '14px',
                fontWeight: '800',
                color: listo ? '#d97706' : '#1a6b8a',
                textAlign: 'center',
                width: '120px',
                display: 'block'
              }}>
                {mensaje}
              </span>

            </div>

          </div>

          <div style={{
            ...estilos.tarjetasFila,
            flexDirection: esMobil ? 'column' : 'row'
          }}>

            {vitales.map((v, i) => (

              <div
                key={i}
                style={{
                  ...estilos.tarjeta,
                  background: v.bg,
                  border: `1.5px solid ${v.borde}`
                }}
              >

                <span style={{
                  fontSize: '28px',
                  marginBottom: '10px',
                  display: 'block'
                }}>
                  {v.icono}
                </span>

                <div style={{
                  display: 'flex',
                  alignItems: 'flex-end',
                  gap: '3px',
                  marginBottom: '6px'
                }}>

                  <span style={{
                    fontSize: '32px',
                    fontWeight: '900',
                    color: v.color,
                    lineHeight: 1
                  }}>
                    {v.valor}
                  </span>

                  <span style={{
                    fontSize: '14px',
                    fontWeight: '700',
                    color: v.color,
                    marginBottom: '4px'
                  }}>
                    {v.unidad}
                  </span>

                </div>

                <p style={{
                  fontSize: '12px',
                  color: '#64748b',
                  margin: 0,
                  fontWeight: '600'
                }}>
                  {v.etiqueta}
                </p>

              </div>

            ))}

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
  },

  cuerpo: {
    display: 'flex',
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

  panelIzquierdo: {
    width: '380px',
    flexShrink: 0,
    background: 'linear-gradient(145deg, #1e3a5f, #1a6b8a)',
    display: 'flex',
    alignItems: 'flex-start',
  },

  panelIzqInner: {
    color: '#fff',
    width: '100%',
  },

  panelTitulo: {
    fontSize: '22px',
    fontWeight: '800',
    margin: '0 0 10px',
  },

  panelDesc: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 1.6,
  },

  panelDerecho: {
    flex: 1,
    background: '#f8fafc',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '28px',
  },

  circuloContenedor: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  circuloTexto: {
    position: 'absolute',
  },

  tarjetasFila: {
    display: 'flex',
    gap: '16px',
    width: '100%',
    maxWidth: '520px',
  },

  tarjeta: {
    flex: 1,
    borderRadius: '16px',
    padding: '20px 14px',
    textAlign: 'center',
    boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
  },

};

export default SignosVitales;