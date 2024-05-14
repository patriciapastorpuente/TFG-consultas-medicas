//MODAL DE LA PARTE DE RESERVAR CITA
//muestra modal añadir una reserva
function agregarReserva() {
    $('#modalReserva').modal('show');
    console.log("modalReserva abierto correctamente");
    $('#tipoOculta').attr("hidden",true);
    $('#tipoReserva').attr("hidden",true);
    $('#fechaOculta').attr("hidden",true);
    $('#fecha').attr("hidden",true);
}

// Obtener el campo de fecha
var fechaInput = document.getElementById('fecha');

// Obtener la fecha de hoy
var hoy = new Date();

// Calcular la fecha mínima permitida (hoy)
var fechaMinima = new Date();

// Formatear la fecha mínima como cadena YYYY-MM-DD
var fechaMinimaString = fechaMinima.toISOString().split('T')[0];

// Establecer la fecha mínima permitida en el campo de fecha
fechaInput.setAttribute('min', fechaMinimaString);

// Obtener los elementos de día del calendario
var diasCalendario = document.querySelectorAll('.calendario td');

// Recorrer cada elemento del calendario
diasCalendario.forEach(function(dia) {
    // Obtener la fecha del elemento actual
    var fechaDia = new Date(dia.dataset.fecha);

    // Verificar si es sábado (día 6) o domingo (día 0) o si es anterior a la fecha actual
    if (fechaDia.getDay() === 6 || fechaDia.getDay() === 0 || fechaDia < hoy) {
        // Desactivar la selección del día estableciendo el atributo disabled en true
        dia.setAttribute('disabled', true);
    }
});

// Agregar un evento al campo de fecha para evitar la selección de días de fin de semana
fechaInput.addEventListener('input', function() {
    var fechaSeleccionada = new Date(this.value);
    if (fechaSeleccionada.getDay() === 6 || fechaSeleccionada.getDay() === 0 || fechaSeleccionada < hoy) {
        alert('Lo sentimos, la consulta está cerrada los fines de semana. Seleccione otro día.');
        this.value = ''; // Limpiar la fecha seleccionada
    }
});

function seleccionarHora(evento, idMedicoEleg) {
    console.log(evento.target.value);
    $.ajax({
        url: "/getCitas",
        type: 'POST',
        data: {
            idMedico: idMedicoEleg,
            fecha: evento.target.value
        },
        dataType: "JSON",
        success: (data) => {
            console.log(data);
            let datos = "";
            datos += `<select name="hora" class="form-select" id="hora" required>`;
            let horasDisponibles = [];
            for (let hora = 10; hora < 20; hora++) {
                for (let minuto = 0; minuto < 60; minuto += 20) {
                    const horaFormateada = hora.toString().padStart(2, '0');
                    const minutoFormateado = minuto.toString().padStart(2, '0');
                    const horaCompleta = `${horaFormateada}:${minutoFormateado}`;

                     // Saltar el período de 14:00 a 16:00
                     if ((hora === 14 || hora === 15) && (minuto === 0 || minuto === 20 || minuto === 40)) {
                        continue; // Saltar esta iteración del bucle
                    }
                    const encontrado = data.find((h) => {
                        return horaCompleta === h.hora.split(":").slice(0, 2).join(":");
                    });
                    // Si la hora no está ocupada, la agregamos al array de horas disponibles
                    if (!encontrado) {
                        horasDisponibles.push(horaCompleta);
                    }
                }
            }
            // Llenamos el dropdown con las horas disponibles
            horasDisponibles.forEach(hora => {
                datos += `<option value="${hora}">${hora}</option>`;
            });
            datos += `</select>`;
            // Actualizamos el contenido del dropdown
            $('#horasDispo').html(datos);
        },
    });
}

function datosCita(){
    $('#tipoOculta').removeAttr('hidden');
    $('#tipoReserva').removeAttr('hidden');
    $('#fechaOculta').removeAttr('hidden');
    $('#fecha').removeAttr('hidden');
}

//MODAL DE LA PARTE DE MODIFICAR UNA CITA
let id_citaModificar;
function modificarCita(id_citaModificar) {
    console.log("Función modificarCita ejecutada");
    $('#id_citaModificar').val(id_citaModificar);
    $('#modalModificarReserva').modal('show');
}

//publica dicha reserva
$('#formModificarCita').on( "submit", function( e ) {
    e.preventDefault();
    $.ajax({
        url: "/listaCitasMedico",
        type: 'POST',
        data: $('#formModificarCita').serialize(),
        dataType: "JSON",
        success: (data) => {
            console.log(data)
            // Oculta el modal después de realizar reserva o producirse error
            $('#modalModificarReserva').modal('hide') 
            // Envía mensaje correcto o de error
            alert(data.error);
            location.reload();
        },
    });
})
