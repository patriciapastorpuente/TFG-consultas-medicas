// Importamos las claves desde el archivo keys.js
import KEYS from "../assets/keys.js";
const $d = document;

$d.addEventListener("DOMContentLoaded", function() {
    // Obtiene referencias a los elementos del DOM necesarios
    const $formReserva = $d.getElementById("formReserva");
    const options = { headers: { Authorization: `Bearer ${KEYS.secret}` } };


    const tipoReservaSelect = $d.getElementById("tipoReserva");
    const opcionesPagoDiv = $d.getElementById("opcionesPago");

    const pagarConsultaCheckbox = $d.getElementById("pagarConsultaCheckbox");

    const reservarDirectoBtn = document.getElementById("reservarDirecto");
    const continuarPagoBtn = document.getElementById("continuarAlPago");

    // 1. Habilitar o deshabilitar la opción "Pagar en consulta" para las reservas Presenciles
    tipoReservaSelect.addEventListener("change", function() {
        if (tipoReservaSelect.value === "Presencial") opcionesPagoDiv.style.display = "block";
        else opcionesPagoDiv.style.display = "none";
    });

    // 2. Habilitar botón "Continuar al pago" en Telefónicas y Videoconferencias
    // y deshabilitarlo en Presenciales y habilitar "Reservar"
    pagarConsultaCheckbox.addEventListener("change", function() {
        if (this.checked && tipoReservaSelect.value === "Presencial") {
            continuarPagoBtn.style.display = "none";
            reservarDirectoBtn.style.display = "block";
        } else {
            continuarPagoBtn.style.display = "block";
            reservarDirectoBtn.style.display = "none";
        }
    });

    // 3. Habilitar botón "Reservar" cuando esté marcado "Pagar en consulta"
    // en caso contrario habilitar botón  "Continuar al pago"
    tipoReserva.addEventListener("change", function() {
        if (pagarConsultaCheckbox.checked && this.value === "Presencial") {
            continuarPagoBtn.style.display = "none";
            reservarDirectoBtn.style.display = "block";
        } else {
            continuarPagoBtn.style.display = "block";
            reservarDirectoBtn.style.display = "none";
        }
    });


    let products, prices;

    // Realiza las peticiones a la API de Stripe para obtener productos y precios
    Promise.all([
        fetch("https://api.stripe.com/v1/products", options),
        fetch("https://api.stripe.com/v1/prices", options)
    ])
    .then(responses => Promise.all(responses.map(res => res.json())))
    .then(json => {
        products = json[0].data;
        prices = json[1].data;

        console.log("Productos: ", products);
        console.log("Precios: ", prices);

        prices.forEach((price, index) => {
            // Busca el nombre del producto correspondiente al precio
            const productName = products.find(product => product.id === price.product).name;

            // Le ponemos index+1 porque la option = 0 es el título "Seleccione un tipo de consulta..."
            // y se estaba asignando el precio del primer producto (Presencial) a esa option
            const option = $formReserva.querySelector("#tipoReserva").options[index+1];

            // Establece el atributo data-price a cada consulta, con el valor del ID del precio
            option.setAttribute("data-price", price.id);

            console.log("option ", index, " ", option);
        });
    })
    .catch(error => {
        let message = error.statusText || "Ocurrió un error en la petición";
        $formReserva.innerHTML = `Error: ${error.status}: ${message}`;
    });  
});

$d.addEventListener("submit", e => {
    if (e.target.matches("#formReserva")) {
        if(e.submitter.id === "continuarAlPago") {
            e.preventDefault();
    
            // Guarda los datos del formulario en un objeto
            const formData = {
                id_usuario: $d.getElementById("id_usuario").value,
                id_medico: $d.getElementById("id_medico").value,
                nombre_usuario: $d.getElementById("nombre_usuario").value,
                apellido_usuario: $d.getElementById("apellido_usuario").value,
                email_usuario: $d.getElementById("email_usuario").value,
                tipoReserva: $d.getElementById("tipoReserva").value,
                fecha: $d.getElementById("fecha").value,
                hora: $d.getElementById("hora").value,
            };
    
            // almacenamos los datos del formulario en el almacenamiento local para que estén disponibles en la página de éxito
            localStorage.setItem("formData", JSON.stringify(formData));
    
            const tipoReserva = $d.getElementById("tipoReserva");
            console.log("Tipo de la reserva elegida: ", tipoReserva.value);
    
            const idPrecio = tipoReserva.options[tipoReserva.selectedIndex].getAttribute("data-price");
            console.log("idPrecio cogido: ", idPrecio);
    
            // se crea el objeto de configuración para la redirección de checkout de Stripe
            const redirectToCheckoutConfig = {
                lineItems: [{ price: idPrecio, quantity: 1 }],
                mode: "payment",
                successUrl: "http://localhost:4000/success",
                cancelUrl: "http://localhost:4000/cancel"
            };
    
            // Redirige al checkout de Stripe
            Stripe(KEYS.public).redirectToCheckout(redirectToCheckoutConfig)
            .then(res => {
                if (res.error) {
                    console.error(res.error.message);
                }
            });
        }
    }
});