const numeros = [
  {
    nombre: "loteria animal",
    numeros: [
      {
        numero: "0",
        nombre: "DELFIN",
      },
      {
        numero: "00",
        nombre: "BALLENA",
      },
      {
        numero: "01",
        nombre: "CARNERO",
      },
      {
        numero: "02",
        nombre: "TORO",
      },
      {
        numero: "03",
        nombre: "CIEMPIES",
      },
      {
        numero: "04",
        nombre: "ALACRAN",
      },
      {
        numero: "05",
        nombre: "LEON",
      },
      {
        numero: "06",
        nombre: "RANA",
      },
      {
        numero: "07",
        nombre: "PERICO",
      },
      {
        numero: "08",
        nombre: "RATON",
      },
      {
        numero: "09",
        nombre: "AGUILA",
      },
      {
        numero: "10",
        nombre: "TIGRE",
      },
      {
        numero: "11",
        nombre: "GATO",
      },
      {
        numero: "12",
        nombre: "CABALLO",
      },
      {
        numero: "13",
        nombre: "MONO",
      },
      {
        numero: "14",
        nombre: "PALOMA",
      },
      {
        numero: "15",
        nombre: "ZORRO",
      },
      {
        numero: "16",
        nombre: "OSO",
      },
      {
        numero: "17",
        nombre: "PAVO",
      },
      {
        numero: "18",
        nombre: "BURRO",
      },
      {
        numero: "19",
        nombre: "CHIVO",
      },
      {
        numero: "20",
        nombre: "COCHINO",
      },
      {
        numero: "21",
        nombre: "GALLO",
      },
      {
        numero: "22",
        nombre: "CAMELLO",
      },
      {
        numero: "23",
        nombre: "ZEBRA",
      },
      {
        numero: "24",
        nombre: "IGUANA",
      },
      {
        numero: "25",
        nombre: "GALLINA",
      },
      {
        numero: "26",
        nombre: "VACA",
      },
      {
        numero: "27",
        nombre: "PERRO",
      },
      {
        numero: "28",
        nombre: "ZAMURO",
      },
      {
        numero: "29",
        nombre: "ELEFANTE",
      },
      {
        numero: "30",
        nombre: "CAIMAN",
      },
      {
        numero: "31",
        nombre: "LAPA",
      },
      {
        numero: "32",
        nombre: "ARDILLA",
      },
      {
        numero: "33",
        nombre: "PESCADO",
      },
      {
        numero: "34",
        nombre: "VENADO",
      },
      {
        numero: "35",
        nombre: "JIRAFA",
      },
      {
        numero: "36",
        nombre: "CULEBRA",
      },
    ],
  },
];
const operadoras = [
  {
    sorteos: [
      "09:30 AM",
      "10:30 AM",
      "11:30 AM",
      "12:30 PM",
      "03:30 PM",
      "02:30 PM",
      "03:30 PM",
      "04:30 PM",
      "05:30 PM",
      "06:30 PM",
      "07:30 PM",
      "08:30 PM",
      "09:30 PM",
    ],
    nombre: "GRANJITA INT",
    tipo: "animal",
    paga: 30,
    __v: 0,
  },
];
const usuarios = [];
const topes = [
  {
    padre: "comercial",
    usuario: "banca",
    operadora: "GRANJITA INT",
    monto: 1000000000,
  },
  {
    padre: "comercial",
    usuario: "banca",
    operadora: "LOTTO RD",
    monto: 1000000000,
  },
  {
    padre: "comercial",
    usuario: "grupo",
    operadora: "LOTTO RD",
    monto: 1000000000,
  },
  {
    padre: "comercial",
    usuario: "agencia",
    operadora: "LOTTO RD",
    monto: 1000000000,
  },
  {
    padre: "comercial",
    usuario: "agencia",
    operadora: "LOTTO RD",
    monto: 1000000000,
  },
  {
    padre: "agente",
    usuario: "online1",
    operadora: "GRANJITA INT",
    monto: 1000000000,
  },
];
const ventas = [
  {
    usuario: "pos1",
    ventas: [
      {
        numero: "01",
        monto: 1000,
        sorteo: "GRANJITA INT 09:30 PM",
      },
      {
        numero: "02",
        monto: 3000,
        sorteo: "GRANJITA INT 09:30 PM",
      },
    ],
  },
  {
    usuario: "online1",
    ventas: [
      {
        numero: "01",
        monto: 1000,
        sorteo: "GRANJITA INT 09:30 PM",
      },
      {
        numero: "02",
        monto: 3000,
        sorteo: "GRANJITA INT 09:30 PM",
      },
    ],
  },
];

module.exports = {
  operadoras,
  usuarios,
  topes,
  numeros,
  ventas,
};
