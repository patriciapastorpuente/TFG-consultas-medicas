// Archivo de configuración de la base de datos
module.exports = {
    mysqlConfig: {
        host: "localhost", // Ordenador que ejecuta el sistema de gestión de base de datos, el usuario local
        user: "root", // Usuario que accede a la BD
        password: "", // Contraseña con la que se accede a la BD
        database: "consultas-medicas" // Nombre de la base de datos
    },
    port: 4000 // Puerto en el que escucha el servidor, el que utilizaremos para conectarnos y ver la página en el navegador 
}