# 🚗 ParqueApp - Sistema de Control de Parqueadero

Aplicación web desarrollada para la gestión inteligente de parqueaderos, permitiendo controlar en tiempo real la entrada y salida de vehículos, calcular cobros automáticamente y administrar usuarios según roles.

---

## Descripción

**ParqueApp** es un sistema web que optimiza la administración de parqueaderos, permitiendo:

* Control de cupos en tiempo real
* Registro eficiente de entradas y salidas
* Cálculo automático de tarifas
* Generación de tickets
* Gestión de usuarios con roles
---

## Funcionalidades

### Autenticación

* Inicio de sesión con Supabase Auth
* Control de acceso por roles:

  * Administrador
  * Operario

---

### Registro de entrada

* Ingreso de placa
* Selección de tipo de vehículo
* Asignación automática de espacio
* Validación de cupos disponibles

---

### Registro de salida

* Búsqueda por placa
* Cálculo automático del tiempo
* Cálculo del valor a pagar
* Liberación de espacio
* Generación de ticket

---

### Sistema de tarifas

* Configuración de tarifas por tipo de vehículo
* Soporte para distintos tipos de cobro

---

### Control de cupos

* Visualización en tiempo real:

  * Autos disponibles
  * Motos disponibles

---

### Generación de tickets

Incluye:

* Placa
* Hora de entrada y salida
* Tiempo total
* Valor pagado

---

## Tecnologías utilizadas

* Frontend: React + TypeScript
* Estilos: CSS / Tailwind (según implementación)
* Backend: Supabase (BaaS)
* Autenticación: Supabase Auth
* Base de datos: PostgreSQL (Supabase)
* Deploy: Vercel

---

## Instalación local

1. Clonar repositorio:

```bash
git clone https://github.com/Shoreb/spotzen-guard.git
cd spotzen-guard
```

2. Instalar dependencias:

```bash
npm install
```

3. Configurar variables de entorno:

Crear archivo `.env`:

```env
VITE_SUPABASE_URL=TU_URL
VITE_SUPABASE_ANON_KEY=TU_KEY
```

---

## Ejecutar en desarrollo

```bash
npm run dev
```

Abrir en:

```
http://localhost:5173
```

---

## Base de datos (Supabase)

El sistema utiliza las siguientes entidades principales:

* usuarios
* roles
* tipos_vehiculo
* espacios
* tarifas
* registros
* tickets

## ⭐ Estado del proyecto

-Funcional
-En mejora continua

---

