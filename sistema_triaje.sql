CREATE DATABASE IF NOT EXISTS sistema_triaje
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE sistema_triaje;

CREATE TABLE IF NOT EXISTS paciente (
    id_paciente       INT PRIMARY KEY AUTO_INCREMENT,
    dni               VARCHAR(8) UNIQUE NOT NULL,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    fecha_nacimiento  DATE NOT NULL,
    sexo              ENUM('M','F') NOT NULL,
    telefono          VARCHAR(15),
    direccion         VARCHAR(200),
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS personal_admision (
    id_personal       INT PRIMARY KEY AUTO_INCREMENT,
    dni               VARCHAR(8) UNIQUE NOT NULL,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    usuario           VARCHAR(50) UNIQUE NOT NULL,
    clave_hash        VARCHAR(255) NOT NULL,
    activo            TINYINT(1) DEFAULT 1,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS medico (
    id_medico         INT PRIMARY KEY AUTO_INCREMENT,
    dni               VARCHAR(8) UNIQUE NOT NULL,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    especialidad      VARCHAR(100) NOT NULL,
    usuario           VARCHAR(50) UNIQUE NOT NULL,
    clave_hash        VARCHAR(255) NOT NULL,
    activo            TINYINT(1) DEFAULT 1,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS administrador (
    id_administrador  INT PRIMARY KEY AUTO_INCREMENT,
    dni               VARCHAR(8) UNIQUE NOT NULL,
    nombre            VARCHAR(100) NOT NULL,
    apellido          VARCHAR(100) NOT NULL,
    usuario           VARCHAR(50) UNIQUE NOT NULL,
    clave_hash        VARCHAR(255) NOT NULL,
    activo            TINYINT(1) DEFAULT 1,
    created_at        DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS admision (
    id_admision       INT PRIMARY KEY AUTO_INCREMENT,
    id_paciente       INT NOT NULL,
    fecha_admision    DATETIME DEFAULT CURRENT_TIMESTAMP,
    motivo            VARCHAR(255),
    estado            ENUM('habilitado','no_habilitado') DEFAULT 'habilitado',
    fecha_cita        DATETIME NULL,
    id_personal       INT NULL,
    id_medico         INT NULL,
    CONSTRAINT fk_admision_paciente FOREIGN KEY (id_paciente) REFERENCES paciente(id_paciente)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_admision_personal FOREIGN KEY (id_personal) REFERENCES personal_admision(id_personal)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_admision_medico FOREIGN KEY (id_medico) REFERENCES medico(id_medico)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ticket (
    id_ticket         INT PRIMARY KEY AUTO_INCREMENT,
    id_admision       INT NOT NULL UNIQUE,
    numero_ticket     VARCHAR(10) NOT NULL UNIQUE,
    fecha_emision     DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado            ENUM('pendiente','en_triaje','atendido','cancelado') DEFAULT 'pendiente',
    CONSTRAINT fk_ticket_admision FOREIGN KEY (id_admision) REFERENCES admision(id_admision)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS triaje (
    id_triaje         INT PRIMARY KEY AUTO_INCREMENT,
    id_ticket         INT NOT NULL UNIQUE,
    fecha_triaje      DATETIME DEFAULT CURRENT_TIMESTAMP,
    observaciones     TEXT,
    CONSTRAINT fk_triaje_ticket FOREIGN KEY (id_ticket) REFERENCES ticket(id_ticket)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS signos_vitales (
    id_signos           INT PRIMARY KEY AUTO_INCREMENT,
    id_triaje           INT NOT NULL UNIQUE,
    peso                DECIMAL(5,2) NOT NULL,
    talla               DECIMAL(5,2) NOT NULL,
    presion_sistolica   SMALLINT NOT NULL,
    presion_diastolica  SMALLINT NOT NULL,
    temperatura         DECIMAL(4,1) NOT NULL,
    saturacion_oxigeno  DECIMAL(4,1) NOT NULL,
    pulso               SMALLINT NOT NULL,
    frecuencia_resp     SMALLINT,
    registrado_por      ENUM('manual','sensor') DEFAULT 'manual',
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_signos_triaje FOREIGN KEY (id_triaje) REFERENCES triaje(id_triaje)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS clasificacion (
    id_clasificacion    INT PRIMARY KEY AUTO_INCREMENT,
    id_triaje           INT NOT NULL UNIQUE,
    nivel               ENUM('ROJO','AMARILLO','VERDE') NOT NULL,
    descripcion         VARCHAR(255),
    created_at          DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_clasificacion_triaje FOREIGN KEY (id_triaje) REFERENCES triaje(id_triaje)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS atencion_medica (
    id_atencion         INT PRIMARY KEY AUTO_INCREMENT,
    id_triaje           INT NOT NULL UNIQUE,
    id_medico           INT NOT NULL,
    fecha_atencion      DATETIME DEFAULT CURRENT_TIMESTAMP,
    diagnostico         TEXT,
    tratamiento         TEXT,
    estado              ENUM('en_curso','finalizada','derivada') DEFAULT 'en_curso',
    CONSTRAINT fk_atencion_triaje FOREIGN KEY (id_triaje) REFERENCES triaje(id_triaje)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_atencion_medico FOREIGN KEY (id_medico) REFERENCES medico(id_medico)
        ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO paciente (dni, nombre, apellido, fecha_nacimiento, sexo, telefono, direccion)
VALUES ('12345678','Juan','Perez','1980-01-01','M','987654321','Calle Falsa 123');

CREATE USER IF NOT EXISTS 'vitalscan-admin'@'localhost' IDENTIFIED BY 'S8!vVq4Gz#p2R0xY';
GRANT ALL PRIVILEGES ON sistema_triaje.* TO 'vitalscan-admin'@'localhost';
FLUSH PRIVILEGES;

SHOW GRANTS FOR 'vitalscan-admin'@'localhost';