document.addEventListener("DOMContentLoaded", function () {
  class Prestamo {
    constructor() {
      this.monto = 0;
      this.interes = 0;
      this.tiempo = 0;
      this.cuotas = [];
      this.tasasDeCambio = {};
    }

    async cargarTasasDeCambio() {
      try {
        const jsonPath = "monedas.json";

        const response = await fetch(jsonPath);
        const data = await response.json();
        this.tasasDeCambio = data || {};

        console.log("Tasas de cambio cargadas:", this.tasasDeCambio);
      } catch (error) {
        console.error("Error al cargar tasas de cambio:", error);
      }
    }

    obtenerDatos() {
      this.moneda = document.getElementById("moneda").value;
      this.monto = parseFloat(document.getElementById("monto").value);
      this.interes = parseFloat(document.getElementById("interes").value);
      this.tiempo = parseInt(document.getElementById("tiempo").value);
    }
    calcularCuota() {
      this.cuotas = [];

      for (let i = 0; i < this.tiempo; i++) {
        const pagoInteres = parseFloat(this.monto * (this.interes / 100));

        const fechaActual = new Date();
        fechaActual.setMonth(fechaActual.getMonth() + i);

        const dia = fechaActual.getDate();
        const mes = fechaActual.getMonth() + 1;
        const anio = fechaActual.getFullYear();

        this.cuotas.push({
          fecha: `${dia < 10 ? "0" : ""}${dia}-${
            mes < 10 ? "0" : ""
          }${mes}-${anio}`,
          cuota: this.calcularCuotaMensual().toFixed(2),
          pagoInteres: pagoInteres.toFixed(2),
        });
      }
    }

    calcularCuotaMensual() {
      return (
        (this.monto *
          (Math.pow(1 + this.interes / 100, this.tiempo) *
            (this.interes / 100))) /
        (Math.pow(1 + this.interes / 100, this.tiempo) - 1)
      );
    }

    mostrarTabla(tablaBody) {
      tablaBody.innerHTML = "";

      this.cuotas.forEach((cuota) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${cuota.fecha}</td>
          <td>${cuota.cuota}</td>
          <td>${cuota.pagoInteres}</td>
        `;
        tablaBody.appendChild(row);
      });

      this.guardarDatosEnStorage();
    }
    mostrarGrafico(graficoContainer) {
      const labels = this.cuotas.map((cuota) => cuota.fecha);
      const data = this.cuotas.map((cuota) => cuota.cuota);

      const series = [
        {
          name: "Cuotas Mensuales",
          data: data,
        },
      ];

      const monedasSeleccionadas = ["EUR", "GBP", "JPY"];
      monedasSeleccionadas.forEach((moneda) => {
        const dataMoneda = this.cuotas.map((cuota) => {
          const monedaRate =
            this.tasasDeCambio.rates && this.tasasDeCambio.rates[moneda];
          const cuotaMoneda = (cuota.cuota * monedaRate).toFixed(2);
          return !isNaN(cuotaMoneda) ? cuotaMoneda : 0;
        });

        series.push({
          name: `Cuotas Mensuales (${moneda})`,
          data: dataMoneda,
        });
      });

      const options = {
        chart: {
          type: "line",
          height: 350,
        },
        series: series,
        xaxis: {
          categories: labels,
        },
      };

      const chart = new ApexCharts(document.getElementById("grafico"), options);
      chart.render();
    }

    guardarDatosEnStorage() {
      const datosPrestamo = {
        monto: this.monto,
        interes: this.interes,
        tiempo: this.tiempo,
        cuotas: this.cuotas,
      };
      localStorage.setItem("prestamoData", JSON.stringify(datosPrestamo));
      console.log("Datos guardados en el almacenamiento local");
    }

    cargarDatosDesdeStorage() {
      const datosPrestamoJSON = localStorage.getItem("prestamoData");
      if (datosPrestamoJSON) {
        const datosPrestamo = JSON.parse(datosPrestamoJSON);
        this.monto = datosPrestamo.monto || 0;
        this.interes = datosPrestamo.interes || 0;
        this.tiempo = datosPrestamo.tiempo || 0;
        this.cuotas = datosPrestamo.cuotas || [];
        console.log("Datos cargados desde el almacenamiento local");
      }
    }
  }

  const btnCalcular = document.getElementById("btnCalcular");
  const tablaBody = document.getElementById("lista-tabla");
  const graficoContainer = document.getElementById("grafico");

  const prestamo = new Prestamo();

  prestamo.cargarDatosDesdeStorage();
  prestamo.mostrarTabla(tablaBody);
  prestamo.mostrarGrafico(graficoContainer);

  btnCalcular.addEventListener("click", async () => {
    prestamo.obtenerDatos();
    await prestamo.cargarTasasDeCambio();
    prestamo.calcularCuota();
    prestamo.mostrarTabla(tablaBody);
    prestamo.mostrarGrafico(graficoContainer);
  });
});
