import React, { useState, useEffect } from 'react'; 
const estadoConfig = { 
  'Normal': { color: '#166534', bg: '#f0fdf4', borde: '#86efac', icono: '✅' }, 
  'Requiere atención': { color: '#92400e', bg: '#fffbeb', borde: '#fcd34d', icono: '⚠️' }, 
  'Crítico': { color: '#991b1b', bg: '#fef2f2', borde: '#fca5a5', icono: '🚨' }, 
}; 

 

const Dashboard = () => { 

  const [esMobil, setEsMobil] = useState(window.innerWidth < 768); 

 

  useEffect(() => { 

    const handleResize = () => setEsMobil(window.innerWidth < 768); 

    window.addEventListener('resize', handleResize); 

    return () => window.removeEventListener('resize', handleResize); 

  }, []); 

 

  const pacientes = [ 

    { nombre: 'Lucía Infantes', temperatura: '36.5°C', pulso: '78 bpm', oxigenacion: '98%', estado: 'Normal' }, 

    { nombre: 'José Ríos', temperatura: '37.8°C', pulso: '102 bpm', oxigenacion: '95%', estado: 'Requiere atención' }, 

    { nombre: 'Carlos Gómez', temperatura: '37.0°C', pulso: '113 bpm', oxigenacion: '91%', estado: 'Crítico' }, 

  ]; 

 

  const resumen = { 

    Normal: pacientes.filter(p => p.estado === 'Normal').length, 

    'Requiere atención': pacientes.filter(p => p.estado === 'Requiere atención').length, 

    Crítico: pacientes.filter(p => p.estado === 'Crítico').length, 

  }; 

 

  return ( 

    <div style={estilos.pagina}> 

      {/* Header */} 

      <div style={estilos.header}> 

        <div style={estilos.headerIzq}> 

          <span style={{ fontSize: '24px' }}>⚕️</span> 

          <span style={estilos.logoTexto}>VitalScan</span> 

          {!esMobil && ( 

            <> 

            </> 

          )} 

        </div> 

        <div style={estilos.headerDer}> 

        </div> 

      </div> 

 

      <div style={{ ...estilos.cuerpo, padding: esMobil ? '20px 16px' : '32px 40px' }}> 

 

        {/* Título */} 

        <div style={{ marginBottom: '24px' }}> 

          <h2 style={{ ...estilos.titulo, fontSize: esMobil ? '22px' : '26px' }}>Panel de Monitoreo</h2> 

          <p style={estilos.subtitulo}>Monitoreo de pacientes en tiempo real</p> 

        </div> 

 

        {/* Tarjetas resumen */} 

        <div style={{ ...estilos.resumenFila, flexDirection: esMobil ? 'column' : 'row' }}> 

          {Object.entries(resumen).map(([estado, count]) => { 

            const cfg = estadoConfig[estado]; 

            return ( 

              <div key={estado} style={{ 

                ...estilos.tarjetaResumen, 

                background: cfg.bg, 

                borderLeft: `4px solid ${cfg.borde}`, 

              }}> 

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}> 

                  <span style={{ ...estilos.estadoCount, color: cfg.color }}>{count}</span> 

                  <span style={{ fontSize: '24px' }}>{cfg.icono}</span> 

                </div> 

                <span style={{ ...estilos.estadoLabel, color: cfg.color }}>{estado}</span> 

              </div> 

            ); 

          })} 

          {/* Tarjeta total */} 

          <div style={{ ...estilos.tarjetaResumen, background: 'linear-gradient(135deg, #1e3a5f, #1a6b8a)', borderLeft: '4px solid #f59e0b' }}> 

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}> 

              <span style={{ ...estilos.estadoCount, color: '#fff' }}>{pacientes.length}</span> 

              <span style={{ fontSize: '24px' }}>🏥</span> 

            </div> 

            <span style={{ ...estilos.estadoLabel, color: 'rgba(255,255,255,0.85)' }}>Total Pacientes</span> 

          </div> 

        </div> 

 

        {/* Tabla / Cards */} 

        {esMobil ? ( 

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}> 

            {pacientes.map((p, i) => { 

              const cfg = estadoConfig[p.estado]; 

              return ( 

                <div key={i} style={{ ...estilos.cardMobil, borderLeft: `4px solid ${cfg.borde}` }}> 

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}> 

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> 

                      <div style={estilos.avatar}>{p.nombre[0]}</div> 

                      <span style={{ fontWeight: '700', color: '#0f2944', fontSize: '15px' }}>{p.nombre}</span> 

                    </div> 

                    <span style={{ ...estilos.chip, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.borde}` }}> 

                      {p.estado} 

                    </span> 

                  </div> 

                  <div style={{ display: 'flex', gap: '16px' }}> 

                    <div style={estilos.cardStat}><span style={estilos.cardStatLabel}>🌡️ Temp</span><span style={estilos.cardStatValor}>{p.temperatura}</span></div> 

                    <div style={estilos.cardStat}><span style={estilos.cardStatLabel}>❤️ Pulso</span><span style={estilos.cardStatValor}>{p.pulso}</span></div> 

                    <div style={estilos.cardStat}><span style={estilos.cardStatLabel}>💧 O2</span><span style={estilos.cardStatValor}>{p.oxigenacion}</span></div> 

                  </div> 

                </div> 

              ); 

            })} 

          </div> 

        ) : ( 

          <div style={estilos.tablaContenedor}> 

            <table style={estilos.tabla}> 

              <thead> 

                <tr style={estilos.thead}> 

                  <th style={estilos.th}>Paciente</th> 

                  <th style={estilos.th}>Temperatura</th> 

                  <th style={estilos.th}>Ritmo Cardíaco</th> 

                  <th style={estilos.th}>Oxigenación</th> 

                  <th style={estilos.th}>Estado</th> 

                </tr> 

              </thead> 

              <tbody> 

                {pacientes.map((p, i) => { 

                  const cfg = estadoConfig[p.estado]; 

                  return ( 

                    <tr key={i} style={{ borderBottom: '1px solid #f0f4f8' }}> 

                      <td style={estilos.td}> 

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}> 

                          <div style={estilos.avatar}>{p.nombre[0]}</div> 

                          <span style={{ fontWeight: '600', color: '#0f2944' }}>{p.nombre}</span> 

                        </div> 

                      </td> 

                      <td style={estilos.td}>{p.temperatura}</td> 

                      <td style={estilos.td}>{p.pulso}</td> 

                      <td style={estilos.td}>{p.oxigenacion}</td> 

                      <td style={estilos.td}> 

                        <span style={{ ...estilos.chip, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.borde}` }}> 

                          {cfg.icono} {p.estado} 

                        </span> 

                      </td> 

                    </tr> 

                  ); 

                })} 

              </tbody> 

            </table> 

          </div> 

        )} 

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

    maxWidth: '1100px', 

    margin: '0 auto', 

    width: '100%', 

    boxSizing: 'border-box', 

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

 

  headerDer: { 

    display: 'flex', 

    alignItems: 'center', 

    gap: '12px', 

  }, 

 

  logoTexto: { 

    fontSize: '18px', 

    fontWeight: '800', 

    color: '#fff', 

  }, 

 

  separadorHeader: { 

    color: 'rgba(255,255,255,0.4)', 

    fontSize: '18px', 

  }, 

 

  paginaLabel: { 

    fontSize: '14px', 

    color: 'rgba(255,255,255,0.8)', 

    fontWeight: '600', 

  }, 

 

  botonHeader: { 

    background: 'linear-gradient(135deg, #f59e0b, #d97706)', 

    color: '#fff', 

    padding: '8px 16px', 

    borderRadius: '10px', 

    fontSize: '13px', 

    fontWeight: '700', 

    textDecoration: 'none', 

  }, 

 

  badge: { 

    display: 'flex', 

    alignItems: 'center', 

    gap: '6px', 

    background: 'rgba(245,158,11,0.2)', 

    border: '1px solid rgba(245,158,11,0.5)', 

    color: '#fcd34d', 

    padding: '5px 12px', 

    borderRadius: '20px', 

    fontSize: '13px', 

    fontWeight: '600', 

  }, 

 

  puntovivo: { 

    width: '7px', 

    height: '7px', 

    borderRadius: '50%', 

    background: '#fcd34d', 

    display: 'inline-block', 

  }, 

 

  

  titulo: { 

    fontWeight: '800', 

    color: '#0f2944', 

    margin: '0 0 4px', 

    letterSpacing: '-0.5px', 

  }, 

 

  subtitulo: { 

    fontSize: '13px', 

    color: '#94a3b8', 

    margin: 0, 

  }, 

 

  resumenFila: { 

    display: 'flex', 

    gap: '16px', 

    marginBottom: '28px', 

  }, 

 

  tarjetaResumen: { 

    flex: 1, 

    padding: '20px 24px', 

    borderRadius: '14px', 

    background: '#fff', 

    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', 

  }, 

 

  estadoCount: { 

    fontSize: '32px', 

    fontWeight: '900', 

    display: 'block', 

  }, 

 

  estadoLabel: { 

    fontSize: '12px', 

    fontWeight: '700', 

    letterSpacing: '0.3px', 

    marginTop: '4px', 

    display: 'block', 

  }, 

 

   

  tablaContenedor: { 

    background: '#fff', 

    borderRadius: '16px', 

    overflow: 'hidden', 

    boxShadow: '0 2px 12px rgba(0,0,0,0.07)', 

  }, 

 

  tabla: { 

    width: '100%', 

    borderCollapse: 'collapse', 

  }, 

 

  thead: { 

    background: 'linear-gradient(135deg, #1e3a5f, #1a6b8a)', 

  }, 

 

  th: { 

    padding: '14px 18px', 

    textAlign: 'left', 

    fontSize: '12px', 

    fontWeight: '700', 

    color: 'rgba(255,255,255,0.85)', 

    letterSpacing: '0.6px', 

    textTransform: 'uppercase', 

  }, 

 

  td: { 

    padding: '16px 18px', 

    fontSize: '14px', 

    color: '#334155', 

  }, 

 

   

  avatar: { 

    width: '34px', 

    height: '34px', 

    borderRadius: '50%', 

    background: 'linear-gradient(135deg, #f59e0b, #d97706)', 

    color: '#fff', 

    fontSize: '13px', 

    fontWeight: '800', 

    display: 'flex', 

    alignItems: 'center', 

    justifyContent: 'center', 

    flexShrink: 0, 

  }, 

 

  chip: { 

    display: 'inline-block', 

    padding: '5px 12px', 

    borderRadius: '20px', 

    fontSize: '12px', 

    fontWeight: '700', 

  }, 

 

   

  cardMobil: { 

    background: '#fff', 

    borderRadius: '14px', 

    padding: '16px', 

    boxShadow: '0 2px 8px rgba(0,0,0,0.07)', 

  }, 

 

  cardStat: { 

    display: 'flex', 

    flexDirection: 'column', 

    gap: '2px', 

  }, 

 

  cardStatLabel: { 

    fontSize: '11px', 

    color: '#94a3b8', 

    fontWeight: '600', 

  }, 

 

  cardStatValor: { 

    fontSize: '14px', 

    color: '#0f2944', 

    fontWeight: '700', 

  }, 

}; 

 

export default Dashboard; 