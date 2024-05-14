'use strict'
const moment = require("moment");

class DAOMensajes {
    constructor(pool){
        this.pool = pool;
    }

    
    //Insertar la nuva info
    insertMensaje(datos,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error en la conexión a la base de datos"));
            else {
                console.log(JSON.stringify(datos));
                con.query(`INSERT INTO mensajes (idEmisor,idReceptor,fecha,asunto,texto,visto) VALUES (
                    '${datos.idEmisor}', 
                    '${datos.idReceptor}',
                    '${datos.fecha}', 
                    '${datos.asunto}',
                    '${datos.texto}',
                    1
                )`,
                (err,res) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en insertMensaje " + err, null))
                    else   callback(null,true);
                })
            }
        })
    }

    // obtner tdos los mensajes de la bbdd
    getAllMensajes(callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la base de datos"));
            else {
                con.query("SELECT * FROM mensajes", (err,mensajes) => {
                    con.release();
                    if(err) callback(new Error("Error al realizar la consulta en getAllMensajes"));
                    else {
                        callback(null,mensajes);
                    }
                })
            }
        })
    }

    // obtener solo los mensajes del usuario que ha iniciado sesion
    getSomeMensajes(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("SELECT men.idEmisor,usu.nombre, usu.apellidos, usu.email, men.id, men.fecha, men.asunto, men.texto, men.visto FROM mensajes men JOIN usuario usu ON idEmisor = usu.id WHERE idReceptor = ?", [id], (err,res) => {
                    con.release();
                    if(err){
                        callback(new Error("Error al realizar la consulta en getSomeMensajes"), null);
                    } 
                    else {
                        callback(null, res);
                    }
                })
            }
        })
    }

    getMensajesSend(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("SELECT men.idReceptor,usu.nombre, usu.apellidos, usu.email, men.id, men.fecha, men.asunto, men.texto, men.visto FROM mensajes men JOIN usuario usu ON idReceptor = usu.id WHERE idEmisor = ?", [id], (err,res) => {
                    con.release();
                    if(err){
                        callback(new Error("Error al realizar la consulta en getMensajesSend"), null);
                    } 
                    else {
                        callback(null, res);
                    }
                })
            }
        })
    }

    getVerMensaje(id, callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("SELECT idEmisor, asunto, texto FROM mensajes WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err){
                        callback(new Error("Error al realizar la consulta en getVerMensaje"), null);
                    } 
                    else {
                        callback(null, res);
                    }
                })
            }
        })
    }

    mensajeVisto(id,callback){
        this.pool.getConnection((err,con) =>{
            if(err) callback(new Error("Error al conectarse a la BD"));
            else {
                con.query("UPDATE mensajes SET visto = 0 WHERE id = ?", [id], (err,res) => {
                    con.release();
                    if(err) callback(new Error("EError al realizar la consulta en mensajeVisto"));
                    else {
                        callback(null);
                    }
                })
            }
        })
    }


}

// Con esto indicamos que queremos exportarlo, así que ya
// podemos definirlo en la clase / archivo que queramos utilizar
module.exports = DAOMensajes;