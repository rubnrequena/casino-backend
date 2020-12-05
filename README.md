REQUISITOS DE SISTEMA
NodeJS  v12
Redis   v5.0.9
MongoDB v4.2

OPERADORA
✅ Crear, modificar, eliminar
✅ Registrar, abrir/cerrar, premiar sorteos
✅ Asignar enlaces usuario/operadora
✅ Registrar, asignar Grupos de Pago

MONITOREO
✅ Monitoreo de ventas por nivel de usuario y numeros
✅ Monitorear ventas por monedas
✅ Mostrar estatus del sorteo
✅ Visualizar tickets jugados por usuario
❌ Visualizar tickets jugados por numero
✅ Numeros solicitados rechazados
✅ Totalizar jugadas por numero
✅ Visualizar dia de ultima vez premiado

USUARIOS
✅ Registrar Usuario
✅ Buscador de usuarios (codigo, usuario, nombre)
❌ Buscador de usuarios (rol)
✅ Registrar, Asignar permisos personalizados (asignar permiso pretederminado)
✅ Admnistrar comisiones de usuario por producto
❌ Iniciar con otra sesion de usuario
❌ Buscar los usuarios a demanda, no precargar todos los usuarios

CUPOS
✅ Asignar cupos por usuario/producto/numero
✅ Visualizar responsable del registro del cupo

VENTAS
✅ Anular tickets (POS)
✅ Pagar tickets (POS)
❌ Interfaz de usuario para anular tickets (Administrador)

REPORTES
✅ Reporte de usuarios
✅ Reporte de operadoras
✅ Reporte de sorteos
✅ Reporte de negativos
✅ Reporte de loterias
✅ Filtrar reportes por moneda
✅ Profundizar en los detalles del reporte al hacer click sobre el usuario
❌ Reporte de tickets (vendidos, anulados, premiados, anulados)
❌ Profundizar en los detalles de los reportes de sorteo, operadora, negativos
❌ Exportar reportes (pdf, excel, csv)

SALDO
✅ Visualizar saldo de usuarios ONLINE
✅ Confirmar/cancelar Recargas y Retiros
✅ Registrar Metodos de pago
❌ Registrar saldo de usuario sin solicitud previa

INFORMES
❌ Registrar actividad de los usuarios
❌ Registrar acciones del sistema
❌ Visualizar reporte de informes 

OBSERVACIONES
En general el sistema esta en un estado completamente funcional, hacen falta hacer pruebas mas precisas 
para verificar que los datos coinciden con los datos esperados por los usuarios. Hay pruebas automatizadas para 
verificar el funcionamiento de los endpoint y simular ventas por lote para hacer pruebas con volumen de datos.