import { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as BarraEstado } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

// ---------- MARCA Y ESTILO ----------
const MARCA = {
  nombre: 'Bifrost Market',
  eslogan: 'Un puente hacia todo lo que buscas.',
};

const COLORES = {
  fondo: '#F7F6F2',
  texto: '#1E2226',
  acento: '#D96B43',
  apoyo: '#7C9082',
  blanco: '#FFFFFF',
  borde: '#E6E2D9',
  chip: '#D2D9D3',
  gris: '#8B9096',
  segmento: '#EFECE4',
  disponible: '#2E8B57',
  agotado: '#B3261E',
};

const FUENTE = {
  normal: 'PlusJakartaSans_400Regular',
  media: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  negrita: 'PlusJakartaSans_700Bold',
};

const CATEGORIAS_FILTRO = [
  'Todas',
  'Tecnología',
  'Moda',
  'Accesorios',
  'Cosmética e higiene personal',
];

const CUPONES = { BIENVENIDO10: 0.1 };
const FORMULARIO_VACIO = {
  nombre: '',
  marca: 'No especificada',
  categoria: '',
  precio: '',
  stock: '',
  descripcion: '',
};

const SECCIONES = [
  { clave: 'catalogo', etiqueta: 'Catálogo', icono: 'home-outline', iconoActivo: 'home' },
  { clave: 'favoritos', etiqueta: 'Favoritos', icono: 'heart-outline', iconoActivo: 'heart' },
  { clave: 'carrito', etiqueta: 'Carrito', icono: 'cart-outline', iconoActivo: 'cart' },
  { clave: 'historial', etiqueta: 'Pedidos', icono: 'package-variant-closed', iconoActivo: 'package-variant' },
  { clave: 'mas', etiqueta: 'Más', icono: 'dots-horizontal-circle-outline', iconoActivo: 'dots-horizontal-circle' },
];

const TINTE_CATEGORIA = {
  Tecnología: '#D5DED7',
  Moda: '#F6DDCF',
  Accesorios: '#E6E2D6',
  'Cosmética e higiene personal': '#F5E6CC',
};

// ---------- ENVÍO, ESTADOS Y SOPORTE (TALLER 5) ----------
// Tarifas ficticias, solo para práctica académica.
const TARIFAS = {
  mosquera: {
    estandar: { costo: 6000, plazo: '1 a 2 días' },
    expres: { costo: 10000, plazo: 'Mismo día o 1 día' },
  },
  funza: {
    estandar: { costo: 8000, plazo: '2 a 3 días' },
    expres: { costo: 12000, plazo: '1 a 2 días' },
  },
  madrid: {
    estandar: { costo: 10000, plazo: '2 a 4 días' },
    expres: { costo: 14000, plazo: '1 a 2 días' },
  },
};

const MODALIDADES = [
  { clave: 'estandar', etiqueta: 'Estándar' },
  { clave: 'expres', etiqueta: 'Exprés' },
];

const MUNICIPIOS_SUGERIDOS = ['Mosquera', 'Funza', 'Madrid'];

const ESTADOS_PEDIDO = ['Confirmado', 'Preparando', 'En camino', 'Entregado'];

const COLOR_ESTADO = {
  Confirmado: '#B7791F',
  Preparando: '#5B7FA6',
  'En camino': '#D96B43',
  Entregado: '#2E8B57',
  Cancelado: '#B3261E',
  Abierto: '#B7791F',
  Respondido: '#2E8B57',
  Pendiente: '#B7791F',
  Respondida: '#2E8B57',
};

const MOTIVOS_AYUDA = ['Entrega', 'Producto', 'Otro'];
const UNIDADES_REPOSICION = 5;
const FILTROS_INICIALES = { marca: 'Todas', min: null, max: null, soloDisp: false };
const BORRADOR_INICIAL = { marca: 'Todas', min: '', max: '', soloDisp: false };

function normalizarTexto(texto) {
  return String(texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function obtenerTarifa(municipio, modalidad) {
  const tarifa = TARIFAS[normalizarTexto(municipio)];
  return tarifa && modalidad ? tarifa[modalidad] : null;
}

function obtenerEtiquetaModalidad(clave) {
  const modalidad = MODALIDADES.find((item) => item.clave === clave);
  return modalidad ? modalidad.etiqueta : 'Sin definir';
}

function crearNotificacion(tipo, mensaje, referencia, clave) {
  return {
    id: 'NOT-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
    tipo,
    mensaje,
    fecha: formatearFecha(new Date()),
    leida: false,
    referencia,
    clave,
  };
}

// ---------- INVENTARIO Y DATOS INICIALES ----------
// El stock vive únicamente dentro de cada variante.
function crearVarianteUnica(id, precio, stock) {
  return [
    {
      id: `VAR-${id}-UNICA`,
      etiqueta: 'Única',
      talla: null,
      color: null,
      precio,
      stock,
    },
  ];
}

function obtenerStockTotal(producto) {
  return (producto?.variantes || []).reduce(
    (total, variante) => total + variante.stock,
    0
  );
}

function crearClaveCarrito(productoId, varianteId) {
  return `${productoId}::${varianteId}`;
}

const PRODUCTOS_INICIALES = [
  {
    id: 'PROD-001',
    nombre: 'Audífonos Samsung Galaxy Buds',
    marca: 'Samsung',
    categoria: 'Tecnología',
    precio: 299000,
    variantes: crearVarianteUnica('001', 299000, 15),
    descripcion: 'Diseño de Corea del Sur: audífonos inalámbricos con estuche de carga y sonido envolvente.',
    imagen: require('./assets/audifonos_samsung_buds.webp'),
  },
  {
    id: 'PROD-002',
    nombre: 'Huawei MateBook Fold Ultimate Design',
    marca: 'Huawei',
    categoria: 'Tecnología',
    precio: 13100000,
    variantes: crearVarianteUnica('002', 13100000, 0),
    descripcion: 'Diseño de China: computador plegable de pantalla grande para trabajar en cualquier lugar.',
    imagen: require('./assets/huawei_matebook_fold.jpg'),
  },
  {
    id: 'PROD-003',
    nombre: 'Abrigo Pujovik',
    marca: 'No especificada',
    categoria: 'Moda',
    precio: 980000,
    variantes: [
      { id: 'VAR-003-S-NEGRO', etiqueta: 'S - Negro', talla: 'S', color: 'Negro', precio: 980000, stock: 1 },
      { id: 'VAR-003-M-NEGRO', etiqueta: 'M - Negro', talla: 'M', color: 'Negro', precio: 980000, stock: 1 },
      { id: 'VAR-003-L-NEGRO', etiqueta: 'L - Negro', talla: 'L', color: 'Negro', precio: 980000, stock: 1 },
      { id: 'VAR-003-S-BEIGE', etiqueta: 'S - Beige', talla: 'S', color: 'Beige', precio: 980000, stock: 1 },
      { id: 'VAR-003-M-BEIGE', etiqueta: 'M - Beige', talla: 'M', color: 'Beige', precio: 980000, stock: 1 },
      { id: 'VAR-003-L-BEIGE', etiqueta: 'L - Beige', talla: 'L', color: 'Beige', precio: 980000, stock: 1 },
    ],
    descripcion: 'Origen Rusia: abrigo de plumas muy usado en el invierno ruso, ideal para climas extremos.',
    imagen: require('./assets/abrigo_pujovik.jpg'),
  },
  {
    id: 'PROD-004',
    nombre: 'Li-Ning Way of Wade 12',
    marca: 'Li-Ning',
    categoria: 'Moda',
    precio: 900000,
    variantes: [
      { id: 'VAR-004-39-NEGRO', etiqueta: '39 - Negro', talla: '39', color: 'Negro', precio: 900000, stock: 1 },
      { id: 'VAR-004-40-NEGRO', etiqueta: '40 - Negro', talla: '40', color: 'Negro', precio: 900000, stock: 1 },
      { id: 'VAR-004-41-NEGRO', etiqueta: '41 - Negro', talla: '41', color: 'Negro', precio: 900000, stock: 1 },
      { id: 'VAR-004-42-NEGRO', etiqueta: '42 - Negro', talla: '42', color: 'Negro', precio: 900000, stock: 1 },
      { id: 'VAR-004-39-BLANCO', etiqueta: '39 - Blanco', talla: '39', color: 'Blanco', precio: 900000, stock: 1 },
      { id: 'VAR-004-40-BLANCO', etiqueta: '40 - Blanco', talla: '40', color: 'Blanco', precio: 900000, stock: 1 },
      { id: 'VAR-004-41-BLANCO', etiqueta: '41 - Blanco', talla: '41', color: 'Blanco', precio: 900000, stock: 1 },
      { id: 'VAR-004-42-BLANCO', etiqueta: '42 - Blanco', talla: '42', color: 'Blanco', precio: 900000, stock: 1 },
    ],
    descripcion: 'Origen China: zapatillas de baloncesto de alto rendimiento, con gran amortiguación y máxima comodidad.',
    imagen: require('./assets/tenis_li_ning_wade_12.webp'),
  },
  {
    id: 'PROD-005',
    nombre: 'Torriden pack',
    marca: 'Torriden',
    categoria: 'Cosmética e higiene personal',
    precio: 211000,
    variantes: crearVarianteUnica('005', 211000, 10),
    descripcion: 'Cosmética coreana: pack de cuidado facial con ingredientes hidratantes.',
    imagen: require('./assets/torriden_pack.jpg'),
  },
  {
    id: 'PROD-006',
    nombre: 'Perfume Ariana Grande Cloud Pink EDP',
    marca: 'Ariana Grande',
    categoria: 'Cosmética e higiene personal',
    precio: 200000,
    variantes: crearVarianteUnica('006', 200000, 12),
    descripcion: 'Eau de parfum de aroma dulce y suave, importado de Estados Unidos.',
    imagen: require('./assets/perfume_ariana_cloud_pink.webp'),
  },
  {
    id: 'PROD-007',
    nombre: 'Argollas de matrimonio oro 18k',
    marca: 'No especificada',
    categoria: 'Accesorios',
    precio: 3500000,
    variantes: crearVarianteUnica('007', 3500000, 3),
    descripcion: 'Par de argollas de matrimonio en oro de 18k con acabado pulido.',
    imagen: require('./assets/argollas_matrimonio_oro_18k.webp'),
  },
  {
    id: 'PROD-008',
    nombre: 'Ray-Ban Aviator Classic',
    marca: 'Ray-Ban',
    categoria: 'Accesorios',
    precio: 477000,
    variantes: crearVarianteUnica('008', 477000, 7),
    descripcion: 'Gafas de sol de estilo clásico aviador con protección UV y montura metálica.',
    imagen: require('./assets/rayban_aviator_classic.avif'),
  },
  {
    id: 'PROD-009',
    nombre: 'Jabón Dove',
    marca: 'Dove',
    categoria: 'Cosmética e higiene personal',
    precio: 16000,
    variantes: crearVarianteUnica('009', 16000, 50),
    descripcion: 'Jabón de tocador hidratante y suave para el cuidado diario de la piel.',
    imagen: require('./assets/jabon_dov.avif'),
  },
  {
    id: 'PROD-010',
    nombre: 'Camisa popelina',
    marca: 'No especificada',
    categoria: 'Moda',
    precio: 355000,
    variantes: [
      { id: 'VAR-010-S-BLANCO', etiqueta: 'S - Blanco', talla: 'S', color: 'Blanco', precio: 355000, stock: 2 },
      { id: 'VAR-010-S-AZUL', etiqueta: 'S - Azul', talla: 'S', color: 'Azul', precio: 355000, stock: 2 },
      { id: 'VAR-010-M-BLANCO', etiqueta: 'M - Blanco', talla: 'M', color: 'Blanco', precio: 355000, stock: 3 },
      { id: 'VAR-010-M-AZUL', etiqueta: 'M - Azul', talla: 'M', color: 'Azul', precio: 355000, stock: 3 },
      { id: 'VAR-010-L-BLANCO', etiqueta: 'L - Blanco', talla: 'L', color: 'Blanco', precio: 355000, stock: 3 },
      { id: 'VAR-010-L-AZUL', etiqueta: 'L - Azul', talla: 'L', color: 'Azul', precio: 355000, stock: 3 },
      { id: 'VAR-010-XL-BLANCO', etiqueta: 'XL - Blanco', talla: 'XL', color: 'Blanco', precio: 355000, stock: 2 },
      { id: 'VAR-010-XL-AZUL', etiqueta: 'XL - Azul', talla: 'XL', color: 'Azul', precio: 355000, stock: 2 },
    ],
    descripcion: 'Camisa de popelina de algodón, fresca y elegante para el trabajo o los viajes.',
    imagen: require('./assets/camisa_popelina.jpg'),
  },
  {
    id: 'PROD-011',
    nombre: 'Celular Google Pixel 11',
    marca: 'Google',
    categoria: 'Tecnología',
    precio: 7300000,
    variantes: crearVarianteUnica('011', 7300000, 4),
    descripcion: 'Diseño de Estados Unidos: celular de gama alta con cámara avanzada y última generación.',
    imagen: require('./assets/google_pixel_11.png'),
  },
  {
    id: 'PROD-012',
    nombre: 'Toalla de baño de algodón egipcio',
    marca: 'No especificada',
    categoria: 'Cosmética e higiene personal',
    precio: 400000,
    variantes: crearVarianteUnica('012', 400000, 14),
    descripcion: 'Origen Egipto: toalla de baño de algodón egipcio, suave y muy absorbente.',
    imagen: require('./assets/toalla_algodon_egipcio.webp'),
  },
];

const RESENAS_INICIALES = PRODUCTOS_INICIALES.reduce(
  (acc, producto) => ({ ...acc, [producto.id]: [5, 4] }),
  {}
);

const PREGUNTAS_INICIALES = {
  'PROD-001': [
    {
      id: 'PRE-0001',
      pregunta: '¿Incluyen estuche de carga?',
      respuesta: 'Respuesta automática de demostración: sí, incluyen estuche de carga. Esta respuesta es simulada y no fue escrita por una persona real.',
      fecha: '01/11/2026 09:00',
      estado: 'Respondida',
    },
  ],
  'PROD-003': [
    {
      id: 'PRE-0002',
      pregunta: '¿La talla M queda ajustada al cuerpo?',
      respuesta: null,
      fecha: '01/11/2026 10:30',
      estado: 'Pendiente',
    },
  ],
};

const DIRECCIONES_INICIALES = [
  { id: 'DIR-0001', alias: 'Casa', municipio: 'Mosquera', descripcion: 'Conjunto ficticio, torre 2, apto 301', principal: true },
  { id: 'DIR-0002', alias: 'Oficina', municipio: 'Funza', descripcion: 'Edificio ficticio, piso 4, recepción', principal: false },
];

// Pedidos de prueba para verificar el seguimiento.
const PEDIDOS_INICIALES = [
  {
    codigo: 'PED-0001',
    fecha: '20/11/2026 10:15',
    comprador: { nombre: 'Laura Gómez', telefono: '3001234567' },
    direccion: { alias: 'Casa', municipio: 'Mosquera', descripcion: 'Conjunto ficticio, torre 2, apto 301' },
    modalidad: 'estandar',
    plazo: '1 a 2 días',
    lineas: [
      { id: 'PROD-009::VAR-009-UNICA', productoId: 'PROD-009', varianteId: 'VAR-009-UNICA', varianteEtiqueta: 'Única', talla: null, color: null, nombre: 'Jabón Dove', cantidad: 2, precio: 16000 },
    ],
    subtotal: 32000,
    descuento: 0,
    envio: 6000,
    total: 38000,
    estado: 'Confirmado',
    historial: [{ estado: 'Confirmado', fecha: '20/11/2026 10:15' }],
    stockRestituido: false,
  },
  {
    codigo: 'PED-0002',
    fecha: '19/11/2026 16:40',
    comprador: { nombre: 'Laura Gómez', telefono: '3001234567' },
    direccion: { alias: 'Oficina', municipio: 'Funza', descripcion: 'Edificio ficticio, piso 4, recepción' },
    modalidad: 'expres',
    plazo: '1 a 2 días',
    lineas: [
      { id: 'PROD-006::VAR-006-UNICA', productoId: 'PROD-006', varianteId: 'VAR-006-UNICA', varianteEtiqueta: 'Única', talla: null, color: null, nombre: 'Perfume Ariana Grande Cloud Pink EDP', cantidad: 1, precio: 200000 },
    ],
    subtotal: 200000,
    descuento: 0,
    envio: 12000,
    total: 212000,
    estado: 'En camino',
    historial: [
      { estado: 'Confirmado', fecha: '19/11/2026 16:40' },
      { estado: 'Preparando', fecha: '19/11/2026 17:10' },
      { estado: 'En camino', fecha: '20/11/2026 08:05' },
    ],
    stockRestituido: false,
  },
];

// ---------- FUNCIONES AUXILIARES ----------
function calcularPromedio(lista) {
  if (!lista || lista.length === 0) return 0;
  const suma = lista.reduce((total, numero) => total + numero, 0);
  return Math.round((suma / lista.length) * 10) / 10;
}

function formatearCOP(valor) {
  return '$' + String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function dosDigitos(numero) {
  return numero < 10 ? '0' + numero : String(numero);
}

function formatearFecha(fecha) {
  return (
    dosDigitos(fecha.getDate()) + '/' +
    dosDigitos(fecha.getMonth() + 1) + '/' +
    fecha.getFullYear() + ' ' +
    dosDigitos(fecha.getHours()) + ':' +
    dosDigitos(fecha.getMinutes())
  );
}

function textoUnidades(numero) {
  return numero === 1 ? '1 unidad' : numero + ' unidades';
}

function obtenerEtiquetaVariante(variante) {
  if (!variante) return 'Variante no disponible';
  return variante.etiqueta || [variante.talla, variante.color].filter(Boolean).join(' - ') || 'Única';
}

// ---------- COMPONENTES ----------
function ImagenProducto({ producto, radio, tamanoIcono }) {
  if (producto.imagen) {
    return (
      <Image
        source={producto.imagen}
        style={{ width: '100%', height: '100%', borderRadius: radio }}
        resizeMode="contain"
      />
    );
  }
  return <MaterialCommunityIcons name="image-outline" size={tamanoIcono} color="rgba(30,34,38,0.22)" />;
}

function Encabezado() {
  return (
    <View style={estilos.encabezado}>
      <Image source={require('./assets/logo_bm.png')} style={estilos.logo} resizeMode="contain" />
      <View style={estilos.divisor} />
      <View>
        <Text style={estilos.marcaNombre}>{MARCA.nombre}</Text>
        <Text style={estilos.marcaEslogan}>{MARCA.eslogan}</Text>
      </View>
    </View>
  );
}

function BarraBusqueda({ valor, alCambiar }) {
  return (
    <View style={estilos.busqueda}>
      <MaterialCommunityIcons name="magnify" size={20} color={COLORES.gris} />
      <TextInput
        style={estilos.busquedaInput}
        placeholder="Buscar productos..."
        placeholderTextColor={COLORES.gris}
        value={valor}
        onChangeText={alCambiar}
      />
      <TouchableOpacity style={estilos.busquedaBoton}>
        <MaterialCommunityIcons name="magnify" size={20} color={COLORES.blanco} />
      </TouchableOpacity>
    </View>
  );
}

function ChipsCategorias({ activa, alCambiar }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={estilos.chipsScroll} contentContainerStyle={estilos.chipsFila}>
      {CATEGORIAS_FILTRO.map((categoria) => {
        const esActiva = categoria === activa;
        return (
          <TouchableOpacity key={categoria} style={[estilos.chip, esActiva && estilos.chipActivo]} onPress={() => alCambiar(categoria)}>
            <Text style={[estilos.chipTexto, esActiva && estilos.chipTextoActivo]} numberOfLines={2}>
              {categoria}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function SelectorOrden({ orden, alCambiar }) {
  const opciones = [
    { clave: 'asc', etiqueta: 'Menor a mayor' },
    { clave: 'desc', etiqueta: 'Mayor a menor' },
  ];
  return (
    <View style={estilos.orden}>
      {opciones.map((opcion) => {
        const activa = opcion.clave === orden;
        return (
          <TouchableOpacity key={opcion.clave} style={[estilos.ordenOpcion, activa && estilos.ordenOpcionActiva]} onPress={() => alCambiar(opcion.clave)}>
            <MaterialCommunityIcons name="swap-vertical" size={15} color={activa ? COLORES.blanco : COLORES.texto} />
            <Text style={[estilos.ordenTexto, activa && estilos.ordenTextoActivo]}>{opcion.etiqueta}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// HU23: filtros combinados (marca + rango de precio + disponibilidad).
function PanelFiltros({ abierto, alAlternar, marcas, borrador, alCambiar, error, alAplicar, alRestablecer, cantidadActivos }) {
  return (
    <View style={estilos.filtrosContenedor}>
      <View style={estilos.filtrosCabecera}>
        <TouchableOpacity style={estilos.filtrosBoton} onPress={alAlternar}>
          <MaterialCommunityIcons name="filter-variant" size={18} color={COLORES.texto} />
          <Text style={estilos.filtrosBotonTexto}>{'Filtros' + (cantidadActivos > 0 ? ' (' + cantidadActivos + ')' : '')}</Text>
          <MaterialCommunityIcons name={abierto ? 'chevron-up' : 'chevron-down'} size={18} color={COLORES.texto} />
        </TouchableOpacity>
        {cantidadActivos > 0 ? (
          <TouchableOpacity onPress={alRestablecer}>
            <Text style={estilos.filtrosRestablecerTexto}>Restablecer</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {abierto ? (
        <View style={estilos.filtrosPanel}>
          <Text style={estilos.opcionesTitulo}>Marca</Text>
          <View style={estilos.opcionesFila}>
            {marcas.map((marca) => (
              <TouchableOpacity key={marca} style={[estilos.opcionVariante, borrador.marca === marca && estilos.opcionVarianteActiva]} onPress={() => alCambiar('marca', marca)}>
                <Text style={[estilos.opcionVarianteTexto, borrador.marca === marca && estilos.opcionVarianteTextoActivo]}>{marca}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[estilos.opcionesTitulo, { marginTop: 12 }]}>Rango de precio (COP)</Text>
          <View style={estilos.filtrosPrecioFila}>
            <TextInput
              style={[estilos.campoInput, estilos.filtrosPrecioInput, error && estilos.campoInputError]}
              value={borrador.min}
              onChangeText={(valor) => alCambiar('min', valor)}
              placeholder="Mínimo"
              placeholderTextColor={COLORES.gris}
              keyboardType="number-pad"
            />
            <Text style={estilos.filtrosGuion}>—</Text>
            <TextInput
              style={[estilos.campoInput, estilos.filtrosPrecioInput, error && estilos.campoInputError]}
              value={borrador.max}
              onChangeText={(valor) => alCambiar('max', valor)}
              placeholder="Máximo"
              placeholderTextColor={COLORES.gris}
              keyboardType="number-pad"
            />
          </View>

          <Text style={[estilos.opcionesTitulo, { marginTop: 12 }]}>Disponibilidad</Text>
          <View style={estilos.opcionesFila}>
            <TouchableOpacity style={[estilos.opcionVariante, !borrador.soloDisp && estilos.opcionVarianteActiva]} onPress={() => alCambiar('soloDisp', false)}>
              <Text style={[estilos.opcionVarianteTexto, !borrador.soloDisp && estilos.opcionVarianteTextoActivo]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.opcionVariante, borrador.soloDisp && estilos.opcionVarianteActiva]} onPress={() => alCambiar('soloDisp', true)}>
              <Text style={[estilos.opcionVarianteTexto, borrador.soloDisp && estilos.opcionVarianteTextoActivo]}>Solo disponibles</Text>
            </TouchableOpacity>
          </View>

          {error ? <Text style={estilos.campoError}>{error}</Text> : null}

          <View style={estilos.filtrosAcciones}>
            <TouchableOpacity style={[estilos.botonSecundario, estilos.filtrosAccionBoton]} onPress={alRestablecer}>
              <Text style={estilos.botonSecundarioTexto}>Restablecer</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[estilos.botonIr, estilos.filtrosAccionBoton, { marginTop: 10 }]} onPress={alAplicar}>
              <Text style={estilos.botonIrTexto}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </View>
  );
}

function TarjetaProducto({
  producto,
  alAbrir,
  esFavorito,
  alAlternarFavorito,
  mostrarComparacion = false,
  esComparado = false,
  alAlternarComparacion = () => {},
}) {
  const disponible = obtenerStockTotal(producto) > 0;

  return (
    <View style={estilos.tarjeta}>
      <View style={[estilos.tarjetaImagen, { backgroundColor: TINTE_CATEGORIA[producto.categoria] }]}>
        <TouchableOpacity style={estilos.tarjetaImagenAbrir} activeOpacity={0.85} onPress={() => alAbrir(producto)}>
          <ImagenProducto producto={producto} radio={10} tamanoIcono={30} />
        </TouchableOpacity>
        <TouchableOpacity
          style={estilos.corazon}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => alAlternarFavorito(producto.id)}
        >
          <MaterialCommunityIcons name={esFavorito ? 'heart' : 'heart-outline'} size={20} color={esFavorito ? COLORES.acento : COLORES.texto} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.85} onPress={() => alAbrir(producto)}>
        <Text style={estilos.tarjetaNombre} numberOfLines={2}>{producto.nombre}</Text>
        <Text style={estilos.tarjetaPrecio}>{formatearCOP(producto.precio)}</Text>
        <View style={estilos.etiqueta}>
          <Text style={estilos.etiquetaTexto} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{producto.categoria}</Text>
        </View>
        <View style={estilos.disponibilidadFila}>
          <View style={[estilos.punto, { backgroundColor: disponible ? COLORES.disponible : COLORES.agotado }]} />
          <Text style={[estilos.disponibilidadTexto, { color: disponible ? COLORES.disponible : COLORES.agotado }]}>
            {disponible ? 'Disponible' : 'Agotado'}
          </Text>
        </View>
      </TouchableOpacity>

      {mostrarComparacion ? (
        <TouchableOpacity
          style={[estilos.botonComparar, esComparado && estilos.botonCompararActivo]}
          onPress={() => alAlternarComparacion(producto.id)}
        >
          <MaterialCommunityIcons name={esComparado ? 'check-circle' : 'compare-horizontal'} size={17} color={esComparado ? COLORES.blanco : COLORES.texto} />
          <Text style={[estilos.botonCompararTexto, esComparado && estilos.botonCompararTextoActivo]}>
            {esComparado ? 'En comparación' : 'Comparar'}
          </Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

function BarraNavegacion({ seccionActiva, alCambiar, insignias = {} }) {
  return (
    <View style={estilos.barra}>
      {SECCIONES.map((seccion, indice) => {
        const activa = seccion.clave === seccionActiva;
        const color = activa ? COLORES.acento : COLORES.texto;
        const insignia = insignias[seccion.clave] || 0;
        return (
          <View key={seccion.clave} style={estilos.barraItemContenedor}>
            {indice > 0 && <View style={estilos.barraSeparador} />}
            <TouchableOpacity style={estilos.barraItem} onPress={() => alCambiar(seccion.clave)}>
              <View>
                <MaterialCommunityIcons name={activa ? seccion.iconoActivo : seccion.icono} size={24} color={color} />
                {insignia > 0 ? (
                  <View style={estilos.insignia}>
                    <Text style={estilos.insigniaTexto}>{insignia > 9 ? '9+' : insignia}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[estilos.barraTexto, { color }]}>{seccion.etiqueta}</Text>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

function Estrellas({ valor }) {
  return (
    <View style={estilos.estrellas}>
      {[1, 2, 3, 4, 5].map((numero) => {
        let nombre = 'star-outline';
        if (valor >= numero) nombre = 'star';
        else if (valor >= numero - 0.5) nombre = 'star-half-full';
        return <MaterialCommunityIcons key={numero} name={nombre} size={22} color={COLORES.acento} />;
      })}
    </View>
  );
}

function FilaVolver({ alVolver }) {
  return (
    <TouchableOpacity style={estilos.volver} onPress={alVolver}>
      <MaterialCommunityIcons name="chevron-left" size={26} color={COLORES.texto} />
      <Text style={estilos.volverTexto}>Volver</Text>
    </TouchableOpacity>
  );
}

function SelectorVariante({ variantes, tallaSeleccionada, colorSeleccionado, alSeleccionarTalla, alSeleccionarColor }) {
  const tallas = [...new Set(variantes.map((variante) => variante.talla).filter(Boolean))];
  const colores = [...new Set(variantes.map((variante) => variante.color).filter(Boolean))];
  if (tallas.length === 0 && colores.length === 0) return null;

  return (
    <View style={estilos.selectorVariante}>
      {tallas.length > 0 && (
        <View style={estilos.grupoOpciones}>
          <Text style={estilos.opcionesTitulo}>Selecciona una talla</Text>
          <View style={estilos.opcionesFila}>
            {tallas.map((talla) => (
              <TouchableOpacity
                key={talla}
                style={[estilos.opcionVariante, tallaSeleccionada === talla && estilos.opcionVarianteActiva]}
                onPress={() => alSeleccionarTalla(talla)}
              >
                <Text style={[estilos.opcionVarianteTexto, tallaSeleccionada === talla && estilos.opcionVarianteTextoActivo]}>{talla}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
      {colores.length > 0 && (
        <View style={estilos.grupoOpciones}>
          <Text style={estilos.opcionesTitulo}>Selecciona un color</Text>
          <View style={estilos.opcionesFila}>
            {colores.map((color) => (
              <TouchableOpacity
                key={color}
                style={[estilos.opcionVariante, colorSeleccionado === color && estilos.opcionVarianteActiva]}
                onPress={() => alSeleccionarColor(color)}
              >
                <Text style={[estilos.opcionVarianteTexto, colorSeleccionado === color && estilos.opcionVarianteTextoActivo]}>{color}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// HU24: preguntas del producto con respuesta simulada.
function SeccionPreguntas({ preguntas, texto, error, alCambiarTexto, alEnviar, alSimularRespuesta }) {
  return (
    <View style={estilos.bloqueResena}>
      <Text style={estilos.bloqueTitulo}>Preguntas</Text>
      {preguntas.length === 0 ? (
        <Text style={estilos.textoSecundario}>Aún no hay preguntas sobre este producto.</Text>
      ) : (
        preguntas.map((pregunta) => (
          <View key={pregunta.id} style={estilos.preguntaTarjeta}>
            <View style={estilos.preguntaCabecera}>
              <Text style={estilos.preguntaFecha}>{pregunta.fecha}</Text>
              <View style={[estilos.estadoBadge, { backgroundColor: COLOR_ESTADO[pregunta.estado] }]}>
                <Text style={estilos.estadoBadgeTexto}>{pregunta.estado}</Text>
              </View>
            </View>
            <Text style={estilos.preguntaTexto}>{pregunta.pregunta}</Text>
            {pregunta.respuesta ? (
              <Text style={estilos.preguntaRespuesta}>{pregunta.respuesta}</Text>
            ) : (
              <TouchableOpacity style={estilos.botonPequeno} onPress={() => alSimularRespuesta(pregunta.id)}>
                <Text style={estilos.botonPequenoTexto}>Simular respuesta (demo)</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
      <TextInput
        style={[estilos.campoInput, { marginTop: 10 }, error && estilos.campoInputError]}
        value={texto}
        onChangeText={alCambiarTexto}
        placeholder="Escribe tu pregunta (mínimo 10 caracteres)"
        placeholderTextColor={COLORES.gris}
      />
      {error ? <Text style={estilos.campoError}>{error}</Text> : null}
      <TouchableOpacity style={estilos.botonSecundario} onPress={alEnviar}>
        <Text style={estilos.botonSecundarioTexto}>Enviar pregunta</Text>
      </TouchableOpacity>
    </View>
  );
}

// HU31: productos relacionados (misma categoría, distinto producto, con stock).
function SeccionRelacionados({ relacionados, alAbrir }) {
  return (
    <View style={estilos.bloqueResena}>
      <Text style={estilos.bloqueTitulo}>Productos relacionados</Text>
      {relacionados.length === 0 ? (
        <Text style={estilos.textoSecundario}>No hay otros productos disponibles en esta categoría por ahora.</Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }}>
          {relacionados.map((item) => {
            const disponibles = item.variantes.filter((variante) => variante.stock > 0).length;
            return (
              <TouchableOpacity key={item.id} style={estilos.relacionadoTarjeta} onPress={() => alAbrir(item)}>
                <View style={[estilos.relacionadoImagen, { backgroundColor: TINTE_CATEGORIA[item.categoria] }]}>
                  <ImagenProducto producto={item} radio={8} tamanoIcono={24} />
                </View>
                <Text style={estilos.relacionadoNombre} numberOfLines={2}>{item.nombre}</Text>
                <Text style={estilos.relacionadoPrecio}>{formatearCOP(item.precio)}</Text>
                <Text style={estilos.relacionadoDisp}>
                  {disponibles === 1 ? '1 opción disponible' : disponibles + ' opciones disponibles'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

function PantallaDetalle({
  producto,
  productos,
  esFavorito,
  alAlternarFavorito,
  alAgregar,
  resenas,
  valorResena,
  errorResena,
  alCambiarResena,
  alEnviarResena,
  preguntas,
  alEnviarPregunta,
  alSimularRespuesta,
  suscripciones,
  alSolicitarAviso,
  alCancelarAviso,
  alSimularReposicion,
  alAbrirProducto,
}) {
  const requiereSeleccion = producto.variantes.length > 1;
  const [tallaSeleccionada, setTallaSeleccionada] = useState(requiereSeleccion ? null : producto.variantes[0]?.talla || null);
  const [colorSeleccionado, setColorSeleccionado] = useState(requiereSeleccion ? null : producto.variantes[0]?.color || null);
  const [cantidad, setCantidad] = useState(1);
  const [textoPregunta, setTextoPregunta] = useState('');
  const [errorPregunta, setErrorPregunta] = useState(null);

  const varianteSeleccionada = requiereSeleccion
    ? producto.variantes.find((variante) => variante.talla === tallaSeleccionada && variante.color === colorSeleccionado)
    : producto.variantes[0];
  const stockTotal = obtenerStockTotal(producto);
  const haySeleccionPendiente = requiereSeleccion && !varianteSeleccionada;
  const disponible = Boolean(varianteSeleccionada && varianteSeleccionada.stock > 0);
  const agotada = Boolean(varianteSeleccionada && varianteSeleccionada.stock <= 0);
  const promedio = calcularPromedio(resenas);
  const cantidadResenas = resenas.length;
  const textoStock = varianteSeleccionada
    ? (varianteSeleccionada.stock === 1 ? 'Stock: 1 unidad' : 'Stock: ' + varianteSeleccionada.stock + ' unidades')
    : `Selecciona una talla y un color. Stock total del producto: ${stockTotal}.`;
  const precioMostrado = varianteSeleccionada ? varianteSeleccionada.precio : producto.precio;
  const suscripcionActiva = varianteSeleccionada
    ? suscripciones.find((item) => item.estado === 'Activa' && item.varianteId === varianteSeleccionada.id)
    : null;
  const relacionados = productos
    .filter((item) => item.categoria === producto.categoria && item.id !== producto.id && obtenerStockTotal(item) > 0)
    .slice(0, 4);

  function enviarPregunta() {
    const texto = textoPregunta.trim();
    if (texto.length < 10) {
      setErrorPregunta('Escribe una pregunta de al menos 10 caracteres.');
      return;
    }
    alEnviarPregunta(producto.id, texto);
    setTextoPregunta('');
    setErrorPregunta(null);
  }

  return (
    <ScrollView contentContainerStyle={estilos.detalle} keyboardShouldPersistTaps="handled">
      <View style={[estilos.detalleImagen, { backgroundColor: TINTE_CATEGORIA[producto.categoria] }]}>
        <ImagenProducto producto={producto} radio={14} tamanoIcono={48} />
        <TouchableOpacity style={estilos.detalleCorazon} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} onPress={() => alAlternarFavorito(producto.id)}>
          <MaterialCommunityIcons name={esFavorito ? 'heart' : 'heart-outline'} size={26} color={esFavorito ? COLORES.acento : COLORES.texto} />
        </TouchableOpacity>
      </View>
      <Text style={estilos.detalleNombre}>{producto.nombre}</Text>
      <View style={[estilos.etiqueta, estilos.detalleEtiqueta]}>
        <Text style={estilos.detalleEtiquetaTexto}>{producto.categoria}</Text>
      </View>
      <Text style={estilos.detallePrecio}>{formatearCOP(precioMostrado)}</Text>

      <SelectorVariante
        variantes={producto.variantes}
        tallaSeleccionada={tallaSeleccionada}
        colorSeleccionado={colorSeleccionado}
        alSeleccionarTalla={setTallaSeleccionada}
        alSeleccionarColor={setColorSeleccionado}
      />

      {haySeleccionPendiente ? (
        <Text style={[estilos.detalleStock, { color: COLORES.gris, marginTop: 8 }]}>{textoStock}</Text>
      ) : (
        <View style={estilos.disponibilidadFila}>
          <View style={[estilos.punto, { backgroundColor: disponible ? COLORES.disponible : COLORES.agotado }]} />
          <Text style={[estilos.detalleStock, { color: disponible ? COLORES.texto : COLORES.agotado }]}>{textoStock}</Text>
        </View>
      )}

      <View style={estilos.calificacionFila}>
        <Estrellas valor={promedio} />
        <Text style={estilos.calificacionTexto}>
          {cantidadResenas > 0
            ? promedio.toFixed(1) + ' (' + cantidadResenas + (cantidadResenas === 1 ? ' reseña)' : ' reseñas)')
            : 'Sin reseñas aún'}
        </Text>
      </View>
      <View style={estilos.detalleLinea} />
      <Text style={estilos.detalleDescripcion}>{producto.descripcion}</Text>

      {agotada ? (
        <View style={estilos.bloqueAgotado}>
          <Text style={estilos.bloqueTitulo}>Esta opción está agotada</Text>
          <TouchableOpacity style={estilos.botonSecundario} onPress={() => alSolicitarAviso(producto, varianteSeleccionada)}>
            <Text style={estilos.botonSecundarioTexto}>Avisarme cuando haya stock</Text>
          </TouchableOpacity>
          {suscripcionActiva ? (
            <TouchableOpacity style={estilos.botonPequeno} onPress={() => alCancelarAviso(suscripcionActiva.id)}>
              <Text style={estilos.botonPequenoTexto}>Cancelar aviso de reposición</Text>
            </TouchableOpacity>
          ) : null}
          <TouchableOpacity style={estilos.botonPequeno} onPress={() => alSimularReposicion(producto, varianteSeleccionada)}>
            <Text style={estilos.botonPequenoTexto}>Simular reposición (demo)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={estilos.cantidadDetalleFila}>
          <Text style={estilos.opcionesTitulo}>Cantidad</Text>
          <View style={estilos.cantidad}>
            <TouchableOpacity style={estilos.cantidadBoton} onPress={() => setCantidad(Math.max(1, cantidad - 1))}>
              <MaterialCommunityIcons name="minus" size={18} color={COLORES.texto} />
            </TouchableOpacity>
            <Text style={estilos.cantidadTexto}>{cantidad}</Text>
            <TouchableOpacity style={estilos.cantidadBoton} onPress={() => setCantidad(Math.min(99, cantidad + 1))}>
              <MaterialCommunityIcons name="plus" size={18} color={COLORES.texto} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      <TouchableOpacity
        style={[estilos.botonAgregar, agotada && estilos.botonAgregarInactivo]}
        disabled={agotada}
        onPress={() => alAgregar(producto, varianteSeleccionada, cantidad)}
      >
        <MaterialCommunityIcons name="cart-outline" size={22} color={COLORES.blanco} />
        <Text style={estilos.botonAgregarTexto}>
          {agotada ? 'Variante agotada' : 'Agregar al carrito'}
        </Text>
      </TouchableOpacity>

      <SeccionPreguntas
        preguntas={preguntas}
        texto={textoPregunta}
        error={errorPregunta}
        alCambiarTexto={(valor) => {
          setTextoPregunta(valor);
          if (errorPregunta) setErrorPregunta(null);
        }}
        alEnviar={enviarPregunta}
        alSimularRespuesta={(preguntaId) => alSimularRespuesta(producto.id, preguntaId)}
      />

      <SeccionRelacionados relacionados={relacionados} alAbrir={alAbrirProducto} />

      <View style={estilos.bloqueResena}>
        <Text style={estilos.bloqueTitulo}>Califica este producto</Text>
        <TextInput
          style={[estilos.campoInput, errorResena && estilos.campoInputError]}
          value={valorResena}
          onChangeText={alCambiarResena}
          placeholder="Tu valoración (1 a 5)"
          placeholderTextColor={COLORES.gris}
          keyboardType="number-pad"
        />
        {errorResena ? <Text style={estilos.campoError}>{errorResena}</Text> : null}
        <TouchableOpacity style={estilos.botonSecundario} onPress={() => alEnviarResena(producto.id)}>
          <Text style={estilos.botonSecundarioTexto}>Enviar reseña</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

function PantallaFavoritos({ productos, favoritos, alAbrir, alAlternar, alIrCatalogo }) {
  return (
    <View style={estilos.seccion}>
      <TituloPantalla icono="heart-outline" texto="Favoritos" />
      <CuadriculaProductos
        data={productos.filter((producto) => favoritos.includes(producto.id))}
        favoritos={favoritos}
        alAbrir={alAbrir}
        alAlternar={alAlternar}
        vacio={<EstadoVacio icono="heart-outline" titulo="Aún no tienes favoritos" texto="Toca el corazón de un producto para guardarlo aquí." textoBoton="Ir al catálogo" alBoton={alIrCatalogo} />}
      />
    </View>
  );
}

function LineaCarrito({ linea, alMas, alMenos, alEliminar }) {
  const producto = linea.producto;
  const variante = linea.variante;
  return (
    <View style={estilos.linea}>
      <View style={[estilos.lineaImagen, { backgroundColor: TINTE_CATEGORIA[producto.categoria] }]}>
        <ImagenProducto producto={producto} radio={10} tamanoIcono={26} />
      </View>
      <View style={estilos.lineaDatos}>
        <Text style={estilos.lineaNombre} numberOfLines={2}>{producto.nombre}</Text>
        <Text style={estilos.lineaVariante}>{obtenerEtiquetaVariante(variante)}</Text>
        <Text style={estilos.lineaPrecio}>{formatearCOP(variante.precio)}</Text>
        <View style={estilos.cantidad}>
          <TouchableOpacity style={estilos.cantidadBoton} onPress={() => alMenos(linea.clave)}>
            <MaterialCommunityIcons name="minus" size={18} color={COLORES.texto} />
          </TouchableOpacity>
          <Text style={estilos.cantidadTexto}>{linea.cantidad}</Text>
          <TouchableOpacity style={estilos.cantidadBoton} onPress={() => alMas(linea.clave)}>
            <MaterialCommunityIcons name="plus" size={18} color={COLORES.texto} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={estilos.lineaSeparador} />
      <TouchableOpacity style={estilos.eliminar} onPress={() => alEliminar(linea.clave)}>
        <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORES.gris} />
        <Text style={estilos.eliminarTexto}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

function PantallaCarrito({ lineas, subtotal, envio, total, alMas, alMenos, alEliminar, alContinuar, alIrCatalogo, codigoCupon, alCambiarCupon, alAplicarCupon, cuponAplicado, descuento }) {
  const vacio = lineas.length === 0;
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
      <TituloPantalla icono="cart-outline" texto="Tu carrito" />
      {vacio ? (
        <EstadoVacio estilo={estilos.carritoVacio} icono="cart-outline" titulo="Tu carrito está vacío" texto="Agrega productos desde el catálogo." textoBoton="Ir al catálogo" alBoton={alIrCatalogo} />
      ) : (
        lineas.map((linea) => (
          <LineaCarrito key={linea.clave} linea={linea} alMas={alMas} alMenos={alMenos} alEliminar={alEliminar} />
        ))
      )}
      <View style={estilos.cuponFila}>
        <View style={estilos.cuponCampo}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={22} color={COLORES.gris} />
          <TextInput style={estilos.cuponInput} placeholder="¿Tienes un cupón?" placeholderTextColor={COLORES.gris} value={codigoCupon} onChangeText={alCambiarCupon} autoCapitalize="characters" autoCorrect={false} />
        </View>
        <TouchableOpacity style={estilos.cuponBoton} onPress={alAplicarCupon}>
          <Text style={estilos.cuponBotonTexto}>Aplicar</Text>
        </TouchableOpacity>
      </View>
      <BloqueResumen estilo={estilos.resumen} subtotal={subtotal} descuento={descuento} etiquetaDescuento={'Descuento (' + (cuponAplicado || '') + ')'} envio={vacio ? 0 : envio} total={total} vacio={vacio} />
      <TouchableOpacity style={[estilos.botonContinuar, vacio && estilos.botonAgregarInactivo]} disabled={vacio} onPress={alContinuar}>
        <Text style={estilos.botonAgregarTexto}>Continuar compra</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function EstadoVacio({ icono, titulo, texto, textoBoton, alBoton, estilo }) {
  return (
    <View style={estilo || estilos.vacio}>
      {icono ? <View style={estilos.vacioIcono}><MaterialCommunityIcons name={icono} size={34} color={COLORES.apoyo} /></View> : null}
      <Text style={estilos.vacioTitulo}>{titulo}</Text>
      <Text style={estilos.vacioTexto}>{texto}</Text>
      {textoBoton ? <TouchableOpacity style={estilos.botonIr} onPress={alBoton}><Text style={estilos.botonIrTexto}>{textoBoton}</Text></TouchableOpacity> : null}
    </View>
  );
}

function CuadriculaProductos({ data, favoritos, alAbrir, alAlternar, vacio, pie, encabezado, mostrarComparacion = false, productosComparacion = [], alAlternarComparacion = () => {} }) {
  return (
    <FlatList
      data={data}
      keyExtractor={(item) => item.id}
      numColumns={2}
      columnWrapperStyle={estilos.fila}
      contentContainerStyle={estilos.lista}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => (
        <TarjetaProducto
          producto={item}
          alAbrir={alAbrir}
          esFavorito={favoritos.includes(item.id)}
          alAlternarFavorito={alAlternar}
          mostrarComparacion={mostrarComparacion}
          esComparado={productosComparacion.includes(item.id)}
          alAlternarComparacion={alAlternarComparacion}
        />
      )}
      ListHeaderComponent={encabezado}
      ListEmptyComponent={vacio}
      ListFooterComponent={pie}
    />
  );
}

function FilaDato({ etiqueta, valor }) {
  return (
    <View style={estilos.filaDato}>
      <Text style={estilos.filaDatoEtiqueta}>{etiqueta}</Text>
      <Text style={estilos.filaDatoValor}>{valor}</Text>
    </View>
  );
}

function TituloPantalla({ icono, texto }) {
  return (
    <View style={estilos.tituloFila}>
      <MaterialCommunityIcons name={icono} size={26} color={COLORES.texto} />
      <Text style={estilos.tituloPantalla}>{texto}</Text>
      <View style={estilos.tituloLinea} />
    </View>
  );
}

function BloqueResumen({ subtotal, descuento = 0, envio, total, estilo, etiquetaDescuento = 'Descuento', vacio = false, plazo = null }) {
  const gratis = !vacio && envio === 0;
  const porCalcular = envio === null || envio === undefined;
  return (
    <View style={estilo || estilos.bloque}>
      <View style={estilos.resumenFila}><Text style={estilos.resumenEtiqueta}>Subtotal</Text><Text style={estilos.resumenValor}>{formatearCOP(subtotal)}</Text></View>
      {descuento > 0 ? <View style={estilos.resumenFila}><Text style={estilos.resumenEtiqueta}>{etiquetaDescuento}</Text><Text style={[estilos.resumenValor, { color: COLORES.disponible }]}>{'-' + formatearCOP(descuento)}</Text></View> : null}
      <View style={estilos.resumenFila}>
        <Text style={estilos.resumenEtiqueta}>Envío</Text>
        <Text style={[estilos.resumenValor, gratis && { color: COLORES.disponible }]}>
          {porCalcular ? 'Por calcular' : gratis ? 'Gratis' : formatearCOP(envio)}
        </Text>
      </View>
      {plazo ? <View style={estilos.resumenFila}><Text style={estilos.resumenEtiqueta}>Entrega estimada</Text><Text style={estilos.resumenValor}>{plazo}</Text></View> : null}
      <View style={estilos.resumenLinea} />
      <View style={estilos.resumenFila}><Text style={estilos.resumenTotalEtiqueta}>Total</Text><Text style={estilos.resumenTotalValor}>{formatearCOP(total)}</Text></View>
    </View>
  );
}

function NotaSimulacion({ texto }) {
  return (
    <View style={estilos.notaSimulacion}>
      <MaterialCommunityIcons name="information-outline" size={20} color={COLORES.apoyo} />
      <Text style={estilos.notaSimulacionTexto}>{texto}</Text>
    </View>
  );
}

function CampoFormulario({ etiqueta, valor, alCambiar, error, placeholder, teclado, editable = true }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoEtiqueta}>{etiqueta}</Text>
      <TextInput style={[estilos.campoInput, error && estilos.campoInputError, !editable && estilos.campoDeshabilitado]} value={valor} onChangeText={alCambiar} placeholder={placeholder} placeholderTextColor={COLORES.gris} keyboardType={teclado || 'default'} editable={editable} />
      {error ? <Text style={estilos.campoError}>{error}</Text> : null}
    </View>
  );
}

function InsigniaEstado({ estado }) {
  return (
    <View style={[estilos.estadoBadge, { backgroundColor: COLOR_ESTADO[estado] || COLORES.gris }]}>
      <Text style={estilos.estadoBadgeTexto}>{estado}</Text>
    </View>
  );
}

const CAMPOS_COMPRADOR = [
  ['nombre', 'Nombre completo', 'Ej.: Laura Gómez'],
  ['telefono', 'Teléfono', 'Ej.: 3001234567', 'phone-pad'],
];

function DatosEntrega({ comprador, direccion, modalidad, plazo }) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.bloqueTitulo}>Datos de entrega</Text>
      <FilaDato etiqueta="Nombre" valor={comprador.nombre.trim()} />
      <FilaDato etiqueta="Teléfono" valor={comprador.telefono.trim()} />
      <FilaDato etiqueta="Dirección" valor={direccion.alias} />
      <FilaDato etiqueta="Municipio" valor={direccion.municipio} />
      <FilaDato etiqueta="Referencia" valor={direccion.descripcion} />
      <FilaDato etiqueta="Envío" valor={obtenerEtiquetaModalidad(modalidad)} />
      <FilaDato etiqueta="Plazo" valor={plazo} />
    </View>
  );
}

// HU25 + HU26: dirección, modalidad y estimador de envío.
function PantallaEntrega({
  comprador,
  errores,
  alCambiar,
  direcciones,
  direccionSel,
  alSeleccionarDireccion,
  modalidad,
  alModalidad,
  direccionActual,
  estimacion,
  sinCobertura,
  subtotal,
  descuento,
  envio,
  total,
  alAdministrar,
  alContinuar,
}) {
  return (
    <KeyboardAvoidingView style={estilos.seccion} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
        <TituloPantalla icono="truck-delivery-outline" texto="Entrega y envío" />
        {CAMPOS_COMPRADOR.map(([campo, etiqueta, placeholder, teclado]) => (
          <CampoFormulario key={campo} etiqueta={etiqueta} valor={comprador[campo]} alCambiar={(valor) => alCambiar(campo, valor)} error={errores[campo]} placeholder={placeholder} teclado={teclado} />
        ))}

        <View style={estilos.bloque}>
          <Text style={estilos.bloqueTitulo}>Dirección de entrega</Text>
          {direcciones.length === 0 ? (
            <Text style={estilos.textoSecundario}>Aún no tienes direcciones registradas.</Text>
          ) : (
            direcciones.map((direccion) => {
              const seleccionada = direccion.id === direccionSel;
              return (
                <TouchableOpacity key={direccion.id} style={[estilos.direccionOpcion, seleccionada && estilos.direccionOpcionActiva]} onPress={() => alSeleccionarDireccion(direccion.id)}>
                  <MaterialCommunityIcons name={seleccionada ? 'radiobox-marked' : 'radiobox-blank'} size={22} color={seleccionada ? COLORES.acento : COLORES.gris} />
                  <View style={{ flex: 1 }}>
                    <Text style={estilos.direccionAlias}>{direccion.alias}{direccion.principal ? '  ★ Principal' : ''}</Text>
                    <Text style={estilos.direccionDetalle}>{direccion.municipio + ' · ' + direccion.descripcion}</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          {errores.direccion ? <Text style={estilos.campoError}>{errores.direccion}</Text> : null}
          <TouchableOpacity style={estilos.botonPequeno} onPress={alAdministrar}>
            <Text style={estilos.botonPequenoTexto}>Administrar mis direcciones</Text>
          </TouchableOpacity>
        </View>

        <View style={estilos.bloque}>
          <Text style={estilos.bloqueTitulo}>Modalidad de envío</Text>
          <View style={estilos.opcionesFila}>
            {MODALIDADES.map((item) => (
              <TouchableOpacity key={item.clave} style={[estilos.opcionVariante, modalidad === item.clave && estilos.opcionVarianteActiva]} onPress={() => alModalidad(item.clave)}>
                <Text style={[estilos.opcionVarianteTexto, modalidad === item.clave && estilos.opcionVarianteTextoActivo]}>{item.etiqueta}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.modalidad ? <Text style={estilos.campoError}>{errores.modalidad}</Text> : null}
          {sinCobertura ? (
            <Text style={estilos.campoError}>
              {'Por ahora no ofrecemos envío a ' + direccionActual.municipio + '. Elige otra dirección (Mosquera, Funza o Madrid).'}
            </Text>
          ) : null}
          {estimacion ? (
            <Text style={estilos.estimacionTexto}>{'Envío ' + obtenerEtiquetaModalidad(modalidad).toLowerCase() + ': ' + formatearCOP(estimacion.costo) + ' · Llega en ' + estimacion.plazo}</Text>
          ) : null}
        </View>

        <BloqueResumen subtotal={subtotal} descuento={descuento} envio={envio} total={total} plazo={estimacion ? estimacion.plazo : null} />
        <NotaSimulacion texto="Es un ejercicio académico: tarifas ficticias y datos de prueba. No pedimos tarjetas, contraseñas ni documentos." />
        <TouchableOpacity style={estilos.botonContinuar} onPress={alContinuar}><Text style={estilos.botonAgregarTexto}>Continuar al pago simulado</Text></TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PantallaRevision({ lineas, comprador, direccion, modalidad, plazo, subtotal, descuento, envio, total, alConfirmar }) {
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="clipboard-check-outline" texto="Revisa tu pedido" />
      <DatosEntrega comprador={comprador} direccion={direccion} modalidad={modalidad} plazo={plazo} />
      <View style={estilos.bloque}>
        <Text style={estilos.bloqueTitulo}>Productos</Text>
        {lineas.map((linea) => (
          <FilaDato key={linea.clave} etiqueta={linea.cantidad + ' × ' + linea.producto.nombre + ' (' + obtenerEtiquetaVariante(linea.variante) + ')'} valor={formatearCOP(linea.cantidad * linea.variante.precio)} />
        ))}
      </View>
      <BloqueResumen subtotal={subtotal} descuento={descuento} envio={envio} total={total} />
      <NotaSimulacion texto="Esto es una simulación: no se realiza ningún cobro real." />
      <TouchableOpacity style={estilos.botonContinuar} onPress={alConfirmar}><Text style={estilos.botonAgregarTexto}>Confirmar compra</Text></TouchableOpacity>
    </ScrollView>
  );
}

function PantallaConfirmacion({ pedido, alVerHistorial, alSeguir }) {
  return (
    <ScrollView contentContainerStyle={estilos.confirmacion}>
      <View style={estilos.vacioIcono}><MaterialCommunityIcons name="check-circle-outline" size={40} color={COLORES.apoyo} /></View>
      <Text style={estilos.vacioTitulo}>¡Pedido confirmado!</Text>
      <View style={estilos.codigoChip}><Text style={estilos.codigoTexto}>{pedido.codigo}</Text></View>
      <Text style={estilos.vacioTexto}>Total del pedido: {formatearCOP(pedido.total)}</Text>
      <NotaSimulacion texto="Esto es una simulación: no se realizó ningún cobro real." />
      <TouchableOpacity style={estilos.botonIr} onPress={alVerHistorial}><Text style={estilos.botonIrTexto}>Ver mis pedidos</Text></TouchableOpacity>
      <TouchableOpacity style={estilos.botonSecundario} onPress={alSeguir}><Text style={estilos.botonSecundarioTexto}>Seguir comprando</Text></TouchableOpacity>
    </ScrollView>
  );
}

function PantallaHistorial({ pedidos, alAbrir, alIrCatalogo }) {
  return (
    <View style={estilos.seccion}>
      <TituloPantalla icono="package-variant-closed" texto="Mis pedidos" />
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.codigo}
        contentContainerStyle={estilos.carritoScroll}
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.pedidoTarjeta} onPress={() => alAbrir(item)}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.pedidoCodigo}>{item.codigo}</Text>
              <Text style={estilos.pedidoFecha}>{item.fecha}</Text>
              <View style={{ alignSelf: 'flex-start', marginTop: 6 }}><InsigniaEstado estado={item.estado} /></View>
            </View>
            <Text style={estilos.pedidoTotal}>{formatearCOP(item.total)}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORES.gris} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EstadoVacio icono="package-variant-closed" titulo="Aún no tienes pedidos registrados" texto="Cuando confirmes una compra aparecerá aquí." textoBoton="Ir al catálogo" alBoton={alIrCatalogo} />}
      />
    </View>
  );
}

function BarraComparacion({ cantidad, alAbrir, alLimpiar }) {
  return (
    <View style={estilos.barraComparacion}>
      <View style={estilos.barraComparacionDatos}>
        <MaterialCommunityIcons name="compare-horizontal" size={22} color={COLORES.texto} />
        <View style={{ flex: 1 }}>
          <Text style={estilos.barraComparacionTitulo}>{cantidad} de 3 productos seleccionados</Text>
          <Text style={estilos.barraComparacionAyuda}>{cantidad < 2 ? 'Selecciona uno más para comparar.' : 'Ya puedes comparar tus productos.'}</Text>
        </View>
      </View>
      <TouchableOpacity style={estilos.barraComparacionLimpiar} onPress={alLimpiar}>
        <Text style={estilos.barraComparacionLimpiarTexto}>Limpiar</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[estilos.barraComparacionBoton, cantidad < 2 && estilos.barraComparacionBotonInactivo]}
        disabled={cantidad < 2}
        onPress={alAbrir}
      >
        <Text style={estilos.barraComparacionBotonTexto}>Comparar</Text>
      </TouchableOpacity>
    </View>
  );
}

function PantallaComparador({ productos, alQuitar }) {
  if (productos.length < 2) {
    return (
      <View style={estilos.seccion}>
        <TituloPantalla icono="compare-horizontal" texto="Comparador de productos" />
        <EstadoVacio
          icono="compare-horizontal"
          titulo="Necesitas al menos dos productos"
          texto="Vuelve al catálogo y selecciona otro producto. La selección que aún conservas no se ha eliminado."
        />
        {productos.map((producto) => (
          <View key={producto.id} style={estilos.comparadorProductoRestante}>
            <Text style={estilos.comparadorProductoRestanteNombre}>{producto.nombre}</Text>
            <TouchableOpacity onPress={() => alQuitar(producto.id)}>
              <Text style={estilos.comparadorQuitarTexto}>Quitar</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  }

  const filas = [
    { etiqueta: 'Marca', valor: (producto) => producto.marca || 'No especificada' },
    { etiqueta: 'Precio', valor: (producto) => formatearCOP(producto.precio) },
    {
      etiqueta: 'Disponibilidad',
      valor: (producto) => {
        const stock = obtenerStockTotal(producto);
        return stock > 0 ? `Disponible (${textoUnidades(stock)})` : 'Agotado';
      },
    },
  ];

  return (
    <ScrollView style={estilos.seccion} contentContainerStyle={estilos.comparadorScroll}>
      <TituloPantalla icono="compare-horizontal" texto="Comparador de productos" />
      <Text style={estilos.comparadorAyuda}>Compara nombre, marca, precio y disponibilidad. Puedes retirar cualquier producto sin afectar tu carrito ni tus favoritos.</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View style={estilos.comparadorTabla}>
          <View style={estilos.comparadorFila}>
            <View style={[estilos.comparadorCeldaEtiqueta, estilos.comparadorCeldaCabecera]}>
              <Text style={estilos.comparadorCabeceraTexto}>Producto</Text>
            </View>
            {productos.map((producto) => (
              <View key={producto.id} style={[estilos.comparadorCeldaProducto, estilos.comparadorCeldaCabecera]}>
                <View style={[estilos.comparadorImagen, { backgroundColor: TINTE_CATEGORIA[producto.categoria] }]}>
                  <ImagenProducto producto={producto} radio={8} tamanoIcono={28} />
                </View>
                <Text style={estilos.comparadorNombre}>{producto.nombre}</Text>
                <TouchableOpacity style={estilos.comparadorQuitar} onPress={() => alQuitar(producto.id)}>
                  <MaterialCommunityIcons name="close-circle-outline" size={16} color={COLORES.agotado} />
                  <Text style={estilos.comparadorQuitarTexto}>Quitar</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
          {filas.map((fila) => (
            <View key={fila.etiqueta} style={estilos.comparadorFila}>
              <View style={estilos.comparadorCeldaEtiqueta}>
                <Text style={estilos.comparadorEtiquetaTexto}>{fila.etiqueta}</Text>
              </View>
              {productos.map((producto) => (
                <View key={producto.id} style={estilos.comparadorCeldaValor}>
                  <Text style={estilos.comparadorValorTexto}>{fila.valor(producto)}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
      <NotaSimulacion texto="La comparación solo consulta información del catálogo. No modifica existencias, favoritos ni carrito." />
    </ScrollView>
  );
}

// HU27 + HU28: seguimiento, simulación de avance y cancelación.
function PantallaPedido({ pedido, alAvanzar, alCancelar }) {
  const [confirmando, setConfirmando] = useState(false);
  const esFinal = pedido.estado === 'Entregado' || pedido.estado === 'Cancelado';
  const cancelable = pedido.estado === 'Confirmado' || pedido.estado === 'Preparando';

  function pedirCancelacion() {
    if (!cancelable) {
      alCancelar(pedido.codigo);
      return;
    }
    setConfirmando(true);
  }

  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="receipt-text-outline" texto={pedido.codigo} />
      <Text style={estilos.pedidoFechaDetalle}>{pedido.fecha}</Text>

      <View style={estilos.bloque}>
        <View style={estilos.estadoFila}>
          <Text style={estilos.bloqueTitulo}>Estado del pedido</Text>
          <InsigniaEstado estado={pedido.estado} />
        </View>
        <Text style={estilos.timelineTitulo}>Historial de estados</Text>
        {pedido.historial.map((evento, indice) => (
          <View key={evento.estado + indice} style={estilos.timelineFila}>
            <View style={estilos.timelineColumna}>
              <View style={[estilos.timelinePunto, { backgroundColor: COLOR_ESTADO[evento.estado] }]} />
              {indice < pedido.historial.length - 1 ? <View style={estilos.timelineLinea} /> : null}
            </View>
            <View style={{ flex: 1, paddingBottom: 12 }}>
              <Text style={estilos.timelineEstado}>{evento.estado}</Text>
              <Text style={estilos.timelineFecha}>{evento.fecha}</Text>
            </View>
          </View>
        ))}

        <TouchableOpacity style={[estilos.botonIr, estilos.botonAncho, esFinal && estilos.botonAgregarInactivo]} onPress={() => alAvanzar(pedido.codigo)}>
          <Text style={estilos.botonIrTexto}>Simular avance de entrega</Text>
        </TouchableOpacity>

        {confirmando ? (
          <View style={estilos.confirmarCancelacion}>
            <Text style={estilos.confirmarCancelacionTexto}>¿Seguro que deseas cancelar este pedido? Se devolverán las unidades al inventario.</Text>
            <View style={estilos.filtrosAcciones}>
              <TouchableOpacity style={[estilos.botonSecundario, estilos.filtrosAccionBoton]} onPress={() => setConfirmando(false)}>
                <Text style={estilos.botonSecundarioTexto}>No, mantener</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[estilos.botonIr, estilos.filtrosAccionBoton, { marginTop: 10, backgroundColor: COLORES.agotado }]}
                onPress={() => {
                  setConfirmando(false);
                  alCancelar(pedido.codigo);
                }}
              >
                <Text style={estilos.botonIrTexto}>Sí, cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[estilos.botonSecundario, estilos.botonAncho, !cancelable && { borderColor: COLORES.gris }]} onPress={pedirCancelacion}>
            <Text style={[estilos.botonSecundarioTexto, !cancelable && { color: COLORES.gris }]}>Cancelar pedido</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={estilos.bloque}>
        <Text style={estilos.bloqueTitulo}>Productos</Text>
        {pedido.lineas.map((linea) => (
          <FilaDato key={linea.varianteId || linea.id} etiqueta={linea.cantidad + ' × ' + linea.nombre + ' (' + (linea.varianteEtiqueta || 'Única') + ')'} valor={formatearCOP(linea.cantidad * linea.precio)} />
        ))}
      </View>
      <BloqueResumen subtotal={pedido.subtotal} descuento={pedido.descuento || 0} envio={pedido.envio} total={pedido.total} plazo={pedido.plazo} />
      <DatosEntrega comprador={pedido.comprador} direccion={pedido.direccion} modalidad={pedido.modalidad} plazo={pedido.plazo} />
      <NotaSimulacion texto="Pedido de simulación: el avance de entrega y el reintegro de stock son simulados. No se realizó ningún cobro real." />
    </ScrollView>
  );
}

// HU25: libreta de direcciones.
function PantallaDirecciones({ direcciones, alNueva, alEditar, alPrincipal }) {
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="map-marker-outline" texto="Mis direcciones" />
      {direcciones.length === 0 ? (
        <EstadoVacio icono="map-marker-outline" titulo="Aún no tienes direcciones" texto="Registra una dirección ficticia para tus pedidos de prueba." />
      ) : (
        direcciones.map((direccion) => (
          <View key={direccion.id} style={estilos.pedidoTarjeta}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.pedidoCodigo}>{direccion.alias}{direccion.principal ? '  ★ Principal' : ''}</Text>
              <Text style={estilos.pedidoFecha}>{direccion.municipio + ' · ' + direccion.descripcion}</Text>
              {!direccion.principal ? (
                <TouchableOpacity style={[estilos.botonPequeno, { alignSelf: 'flex-start' }]} onPress={() => alPrincipal(direccion.id)}>
                  <Text style={estilos.botonPequenoTexto}>Marcar como principal</Text>
                </TouchableOpacity>
              ) : null}
            </View>
            <TouchableOpacity style={estilos.botonEditar} onPress={() => alEditar(direccion)}>
              <Text style={estilos.botonEditarTexto}>Editar</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <TouchableOpacity style={estilos.botonContinuar} onPress={alNueva}>
        <Text style={estilos.botonAgregarTexto}>Agregar dirección</Text>
      </TouchableOpacity>
      <NotaSimulacion texto="Usa datos ficticios: no registres direcciones ni referencias reales." />
    </ScrollView>
  );
}

function FormDireccion({ inicial, alGuardar }) {
  const [alias, setAlias] = useState(inicial ? inicial.alias : '');
  const [municipio, setMunicipio] = useState(inicial ? inicial.municipio : '');
  const [descripcion, setDescripcion] = useState(inicial ? inicial.descripcion : '');
  const [errores, setErrores] = useState({});

  function guardar() {
    const nuevos = {};
    if (alias.trim().length < 2) nuevos.alias = 'El alias debe tener al menos 2 caracteres.';
    if (municipio.trim() === '') nuevos.municipio = 'Indica el municipio.';
    if (descripcion.trim().length < 5) nuevos.descripcion = 'La referencia debe tener al menos 5 caracteres.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    alGuardar({
      id: inicial ? inicial.id : null,
      alias: alias.trim(),
      municipio: municipio.trim(),
      descripcion: descripcion.trim(),
    });
  }

  return (
    <KeyboardAvoidingView style={estilos.seccion} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
        <TituloPantalla icono="map-marker-plus-outline" texto={inicial ? 'Editar dirección' : 'Nueva dirección'} />
        <CampoFormulario etiqueta="Alias" valor={alias} alCambiar={setAlias} error={errores.alias} placeholder="Ej.: Casa" />
        <View style={estilos.campo}>
          <Text style={estilos.campoEtiqueta}>Municipio</Text>
          <View style={estilos.chipsFormulario}>
            {MUNICIPIOS_SUGERIDOS.map((nombre) => (
              <TouchableOpacity key={nombre} style={[estilos.chip, normalizarTexto(municipio) === normalizarTexto(nombre) && estilos.chipActivo]} onPress={() => setMunicipio(nombre)}>
                <Text style={[estilos.chipTexto, normalizarTexto(municipio) === normalizarTexto(nombre) && estilos.chipTextoActivo]}>{nombre}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <TextInput style={[estilos.campoInput, { marginTop: 8 }, errores.municipio && estilos.campoInputError]} value={municipio} onChangeText={setMunicipio} placeholder="Escribe el municipio" placeholderTextColor={COLORES.gris} />
          {errores.municipio ? <Text style={estilos.campoError}>{errores.municipio}</Text> : null}
        </View>
        <CampoFormulario etiqueta="Referencia de entrega" valor={descripcion} alCambiar={setDescripcion} error={errores.descripcion} placeholder="Ej.: Conjunto ficticio, casa 4" />
        <NotaSimulacion texto="Solo se ofrece envío a Mosquera, Funza y Madrid. Otros municipios se pueden guardar, pero no tendrán envío." />
        <TouchableOpacity style={estilos.botonContinuar} onPress={guardar}>
          <Text style={estilos.botonAgregarTexto}>Guardar dirección</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// HU29: centro de notificaciones interno.
function PantallaNotificaciones({ notificaciones, alAbrir, alMarcarTodas }) {
  return (
    <View style={estilos.seccion}>
      <TituloPantalla icono="bell-outline" texto="Notificaciones" />
      <FlatList
        data={notificaciones}
        keyExtractor={(item) => item.id}
        contentContainerStyle={estilos.carritoScroll}
        ListHeaderComponent={
          notificaciones.length > 0 ? (
            <View>
              <NotaSimulacion texto="Son avisos dentro de la app, no notificaciones push." />
              <TouchableOpacity style={[estilos.botonPequeno, { alignSelf: 'flex-end', marginRight: 16 }]} onPress={alMarcarTodas}>
                <Text style={estilos.botonPequenoTexto}>Marcar todas como leídas</Text>
              </TouchableOpacity>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[estilos.pedidoTarjeta, !item.leida && estilos.notificacionNoLeida]} onPress={() => alAbrir(item)}>
            <MaterialCommunityIcons name={item.tipo === 'Reposición' ? 'package-variant' : 'truck-delivery-outline'} size={24} color={item.leida ? COLORES.gris : COLORES.acento} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={[estilos.notificacionMensaje, !item.leida && { fontFamily: FUENTE.semi }]}>{item.mensaje}</Text>
              <Text style={estilos.pedidoFecha}>{item.tipo + ' · ' + item.fecha}</Text>
            </View>
            {!item.leida ? <View style={estilos.puntoNoLeido} /> : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<EstadoVacio icono="bell-outline" titulo="No tienes notificaciones" texto="Cuando cambie el estado de un pedido o repongan un producto, el aviso aparecerá aquí." />}
      />
    </View>
  );
}

// HU32: centro de ayuda y solicitudes.
function PantallaAyuda({ pedidos, tickets, alCrear, alSimularRespuesta }) {
  const [modo, setModo] = useState('lista');
  const [pedidoSel, setPedidoSel] = useState(null);
  const [motivo, setMotivo] = useState(null);
  const [descripcion, setDescripcion] = useState('');
  const [errores, setErrores] = useState({});

  function enviar() {
    const nuevos = {};
    if (!pedidoSel) nuevos.pedido = 'Selecciona un pedido.';
    if (!motivo) nuevos.motivo = 'Elige un motivo.';
    if (descripcion.trim().length < 15) nuevos.descripcion = 'La descripción debe tener al menos 15 caracteres.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    alCrear({ pedido: pedidoSel, motivo, descripcion: descripcion.trim() });
    setPedidoSel(null);
    setMotivo(null);
    setDescripcion('');
    setErrores({});
    setModo('lista');
  }

  if (modo === 'form') {
    return (
      <KeyboardAvoidingView style={estilos.seccion} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
          <TituloPantalla icono="lifebuoy" texto="Nueva solicitud" />
          <View style={estilos.bloque}>
            <Text style={estilos.bloqueTitulo}>Pedido</Text>
            {pedidos.length === 0 ? (
              <Text style={estilos.textoSecundario}>Aún no tienes pedidos para asociar a una solicitud.</Text>
            ) : (
              <View style={estilos.opcionesFila}>
                {pedidos.map((pedido) => (
                  <TouchableOpacity key={pedido.codigo} style={[estilos.opcionVariante, pedidoSel === pedido.codigo && estilos.opcionVarianteActiva]} onPress={() => setPedidoSel(pedido.codigo)}>
                    <Text style={[estilos.opcionVarianteTexto, pedidoSel === pedido.codigo && estilos.opcionVarianteTextoActivo]}>{pedido.codigo}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            {errores.pedido ? <Text style={estilos.campoError}>{errores.pedido}</Text> : null}
          </View>
          <View style={estilos.bloque}>
            <Text style={estilos.bloqueTitulo}>Motivo</Text>
            <View style={estilos.opcionesFila}>
              {MOTIVOS_AYUDA.map((item) => (
                <TouchableOpacity key={item} style={[estilos.opcionVariante, motivo === item && estilos.opcionVarianteActiva]} onPress={() => setMotivo(item)}>
                  <Text style={[estilos.opcionVarianteTexto, motivo === item && estilos.opcionVarianteTextoActivo]}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {errores.motivo ? <Text style={estilos.campoError}>{errores.motivo}</Text> : null}
          </View>
          <CampoFormulario etiqueta="Descripción" valor={descripcion} alCambiar={setDescripcion} error={errores.descripcion} placeholder="Cuéntanos qué pasó (mínimo 15 caracteres)" />
          <NotaSimulacion texto="Las respuestas de soporte son simuladas: no se conecta con chats ni correos reales." />
          <TouchableOpacity style={estilos.botonContinuar} onPress={enviar}><Text style={estilos.botonAgregarTexto}>Enviar solicitud</Text></TouchableOpacity>
          <TouchableOpacity style={[estilos.botonSecundario, estilos.botonAncho]} onPress={() => setModo('lista')}>
            <Text style={estilos.botonSecundarioTexto}>Cancelar</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="lifebuoy" texto="Centro de ayuda" />
      <TouchableOpacity style={[estilos.botonContinuar, { marginTop: 0, marginBottom: 12 }]} onPress={() => setModo('form')}>
        <Text style={estilos.botonAgregarTexto}>Nueva solicitud</Text>
      </TouchableOpacity>
      {tickets.length === 0 ? (
        <EstadoVacio icono="lifebuoy" titulo="No tienes solicitudes" texto="Si algo salió mal con un pedido, registra una solicitud de ayuda." />
      ) : (
        tickets.map((ticket) => (
          <View key={ticket.id} style={estilos.bloque}>
            <View style={estilos.estadoFila}>
              <Text style={estilos.pedidoCodigo}>{ticket.id}</Text>
              <InsigniaEstado estado={ticket.estado} />
            </View>
            <Text style={estilos.pedidoFecha}>{ticket.pedido + ' · ' + ticket.motivo + ' · ' + ticket.fecha}</Text>
            <Text style={estilos.preguntaTexto}>{ticket.descripcion}</Text>
            {ticket.respuesta ? (
              <Text style={estilos.preguntaRespuesta}>{ticket.respuesta}</Text>
            ) : (
              <TouchableOpacity style={[estilos.botonPequeno, { alignSelf: 'flex-start' }]} onPress={() => alSimularRespuesta(ticket.id)}>
                <Text style={estilos.botonPequenoTexto}>Simular respuesta</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

function PantallaMas({ noLeidas, alIr }) {
  const items = [
    { clave: 'direcciones', icono: 'map-marker-outline', texto: 'Mis direcciones', insignia: 0 },
    { clave: 'notificaciones', icono: 'bell-outline', texto: 'Notificaciones', insignia: noLeidas },
    { clave: 'ayuda', icono: 'lifebuoy', texto: 'Centro de ayuda', insignia: 0 },
    { clave: 'vendedor', icono: 'storefront-outline', texto: 'Panel de vendedor', insignia: 0 },
  ];
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="dots-horizontal-circle-outline" texto="Más opciones" />
      {items.map((item) => (
        <TouchableOpacity key={item.clave} style={estilos.pedidoTarjeta} onPress={() => alIr(item.clave)}>
          <MaterialCommunityIcons name={item.icono} size={24} color={COLORES.texto} />
          <Text style={[estilos.pedidoCodigo, { flex: 1, marginLeft: 12 }]}>{item.texto}</Text>
          {item.insignia > 0 ? (
            <View style={[estilos.insignia, estilos.insigniaInline]}>
              <Text style={estilos.insigniaTexto}>{item.insignia > 9 ? '9+' : item.insignia}</Text>
            </View>
          ) : null}
          <MaterialCommunityIcons name="chevron-right" size={24} color={COLORES.gris} />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

function PanelLista({ productos, alEditar, alNuevo }) {
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="storefront-outline" texto="Panel de vendedor" />
      <TouchableOpacity style={[estilos.botonContinuar, { marginTop: 0, marginBottom: 12 }]} onPress={alNuevo}>
        <Text style={estilos.botonAgregarTexto}>Nuevo producto</Text>
      </TouchableOpacity>
      {productos.map((producto) => (
        <View key={producto.id} style={estilos.pedidoTarjeta}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.pedidoCodigo} numberOfLines={1}>{producto.nombre}</Text>
            <Text style={estilos.pedidoFecha}>
              {producto.id + ' · ' + formatearCOP(producto.precio) + ' · Stock ' + obtenerStockTotal(producto)}
            </Text>
          </View>
          <TouchableOpacity style={estilos.botonEditar} onPress={() => alEditar(producto)}>
            <Text style={estilos.botonEditarTexto}>Editar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const CAMPOS_PRODUCTO = [
  ['marca', 'Marca', 'Ej.: Samsung o No especificada'],
  ['precio', 'Precio (COP)', 'Ej.: 120000', 'number-pad'],
  ['stock', 'Stock', 'Ej.: 10', 'number-pad'],
  ['descripcion', 'Descripción', 'Mínimo 15 caracteres'],
];

function PanelFormulario({ form, errores, editando, tieneVariantes, resumenVariantes, alCambiar, alGuardar }) {
  return (
    <KeyboardAvoidingView style={estilos.seccion} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
        <TituloPantalla icono="storefront-outline" texto={editando ? 'Editar producto' : 'Nuevo producto'} />
        <CampoFormulario etiqueta="Nombre" valor={form.nombre} alCambiar={(valor) => alCambiar('nombre', valor)} error={errores.nombre} placeholder="Ej.: Gorra urbana" />
        <View style={estilos.campo}>
          <Text style={estilos.campoEtiqueta}>Categoría</Text>
          <View style={estilos.chipsFormulario}>
            {CATEGORIAS_FILTRO.slice(1).map((categoria) => (
              <TouchableOpacity key={categoria} style={[estilos.chip, form.categoria === categoria && estilos.chipActivo]} onPress={() => alCambiar('categoria', categoria)}>
                <Text style={[estilos.chipTexto, form.categoria === categoria && estilos.chipTextoActivo]}>{categoria}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {errores.categoria ? <Text style={estilos.campoError}>{errores.categoria}</Text> : null}
        </View>
        {CAMPOS_PRODUCTO.map(([campo, etiqueta, placeholder, teclado]) => (
          <CampoFormulario
            key={campo}
            etiqueta={etiqueta}
            valor={form[campo]}
            alCambiar={(valor) => alCambiar(campo, valor)}
            error={errores[campo]}
            placeholder={placeholder}
            teclado={teclado}
            editable={campo !== 'stock' || !tieneVariantes}
          />
        ))}
        {tieneVariantes ? (
          <View style={[estilos.notaSimulacion, { marginBottom: 12 }]}>
            <MaterialCommunityIcons name="information-outline" size={20} color={COLORES.apoyo} />
            <Text style={estilos.notaSimulacionTexto}>
              Este producto administra el inventario por talla y color. Para evitar alterar una variante sin elegirla, el stock general se muestra como solo lectura. Existencias: {resumenVariantes}.
            </Text>
          </View>
        ) : null}
        <TouchableOpacity style={estilos.botonContinuar} onPress={alGuardar}>
          <Text style={estilos.botonAgregarTexto}>Guardar producto</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MensajeVacio({ hayProductos, hayFiltros, alLimpiar }) {
  return (
    <EstadoVacio
      icono="magnify"
      titulo={hayProductos ? 'No encontramos productos' : 'No hay productos disponibles'}
      texto={hayProductos ? (hayFiltros ? 'Ningún producto cumple la búsqueda y los filtros elegidos. Prueba con otros valores.' : 'Prueba con otra palabra o con otra categoría.') : 'Por ahora el catálogo está vacío. Vuelve a intentarlo más tarde.'}
      textoBoton={hayProductos ? 'Limpiar búsqueda y filtros' : null}
      alBoton={alLimpiar}
    />
  );
}

// ---------- APLICACIÓN ----------
export default function App() {
  const [fuentesListas] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });

  const [productos, setProductos] = useState(PRODUCTOS_INICIALES);
  const [busqueda, setBusqueda] = useState('');
  const [categoriaActiva, setCategoriaActiva] = useState('Todas');
  const [orden, setOrden] = useState('asc');
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [borradorFiltros, setBorradorFiltros] = useState(BORRADOR_INICIAL);
  const [errorFiltro, setErrorFiltro] = useState(null);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [seccion, setSeccion] = useState('catalogo');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [productosComparacion, setProductosComparacion] = useState([]);
  const [mostrarComparador, setMostrarComparador] = useState(false);
  const [carrito, setCarrito] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [flujo, setFlujo] = useState(null);
  const [pedidos, setPedidos] = useState(PEDIDOS_INICIALES);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [comprador, setComprador] = useState({ nombre: '', telefono: '' });
  const [errores, setErrores] = useState({});
  const [codigoCupon, setCodigoCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [resenas, setResenas] = useState(RESENAS_INICIALES);
  const [valorResena, setValorResena] = useState('');
  const [errorResena, setErrorResena] = useState(null);
  const [datosCargados, setDatosCargados] = useState(false);
  const [panel, setPanel] = useState(null);
  const [productoEdicion, setProductoEdicion] = useState(null);
  const [formProducto, setFormProducto] = useState(FORMULARIO_VACIO);
  const [erroresProducto, setErroresProducto] = useState({});

  // Estados nuevos del Taller 5.
  const [preguntas, setPreguntas] = useState(PREGUNTAS_INICIALES);
  const [direcciones, setDirecciones] = useState(DIRECCIONES_INICIALES);
  const [direccionSel, setDireccionSel] = useState(null);
  const [modalidad, setModalidad] = useState(null);
  const [direccionEdicion, setDireccionEdicion] = useState(null);
  const [pantallaExtra, setPantallaExtra] = useState(null);
  const [notificaciones, setNotificaciones] = useState([]);
  const [suscripciones, setSuscripciones] = useState([]);
  const [tickets, setTickets] = useState([]);
  const cancelacionesEnCurso = useRef(new Set());

  // Recupera los favoritos y migra el carrito antiguo cuando sea posible.
  useEffect(() => {
    async function cargarDatos() {
      try {
        const guardado = await AsyncStorage.getItem('bifrost_datos');
        if (guardado) {
          const datos = JSON.parse(guardado);
          const idsValidos = PRODUCTOS_INICIALES.map((producto) => producto.id);
          const carritoGuardado = Array.isArray(datos.carrito) ? datos.carrito : [];
          const carritoValido = [];

          carritoGuardado.forEach((linea) => {
            const productoId = linea.productoId || linea.id;
            const producto = PRODUCTOS_INICIALES.find((item) => item.id === productoId);
            if (!producto || !Number.isInteger(linea.cantidad) || linea.cantidad < 1) return;

            // Los registros antiguos no guardaban variante. Solo se migran
            // automáticamente si el producto tiene una única variante.
            const varianteId = linea.varianteId || (producto.variantes.length === 1 ? producto.variantes[0].id : null);
            if (!varianteId) return;
            const variante = producto.variantes.find((item) => item.id === varianteId);
            if (!variante || linea.cantidad > variante.stock) return;

            const clave = crearClaveCarrito(producto.id, variante.id);
            const existente = carritoValido.find((item) => item.clave === clave);
            if (existente) existente.cantidad += linea.cantidad;
            else carritoValido.push({ clave, productoId: producto.id, varianteId: variante.id, cantidad: linea.cantidad });
          });

          const carritoDentroDeStock = carritoValido.filter((linea) => {
            const producto = PRODUCTOS_INICIALES.find((item) => item.id === linea.productoId);
            const variante = producto?.variantes.find((item) => item.id === linea.varianteId);
            return variante && linea.cantidad <= variante.stock;
          });

          const favoritosValidos = Array.isArray(datos.favoritos)
            ? datos.favoritos.filter((id) => idsValidos.includes(id))
            : [];

          setCarrito(carritoDentroDeStock);
          setFavoritos(favoritosValidos);
        }
      } catch (error) {
        // Si el almacenamiento está dañado, se usan los estados iniciales.
      }
      setDatosCargados(true);
    }
    cargarDatos();
  }, []);

  useEffect(() => {
    if (!datosCargados) return;
    AsyncStorage.setItem('bifrost_datos', JSON.stringify({ carrito, favoritos })).catch(() => {});
  }, [carrito, favoritos, datosCargados]);

  if (!fuentesListas) return null;

  // ----- Catálogo: búsqueda + categoría + filtros combinados -----
  const textoBusqueda = busqueda.trim().toLowerCase();
  const marcasDisponibles = ['Todas', ...[...new Set(productos.map((producto) => producto.marca || 'No especificada'))].sort()];
  const cantidadFiltrosActivos =
    (filtros.marca !== 'Todas' ? 1 : 0) +
    (filtros.min !== null ? 1 : 0) +
    (filtros.max !== null ? 1 : 0) +
    (filtros.soloDisp ? 1 : 0);

  const productosVisibles = productos
    .filter((producto) => categoriaActiva === 'Todas' || producto.categoria === categoriaActiva)
    .filter((producto) => producto.nombre.toLowerCase().includes(textoBusqueda))
    .filter((producto) => filtros.marca === 'Todas' || (producto.marca || 'No especificada') === filtros.marca)
    .filter((producto) => filtros.min === null || producto.precio >= filtros.min)
    .filter((producto) => filtros.max === null || producto.precio <= filtros.max)
    .filter((producto) => !filtros.soloDisp || obtenerStockTotal(producto) > 0)
    .sort((a, b) => (orden === 'asc' ? a.precio - b.precio : b.precio - a.precio));

  function mostrarAviso(texto, tipo = 'info') {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 2600);
  }

  function cambiarBorrador(campo, valor) {
    setBorradorFiltros({ ...borradorFiltros, [campo]: valor });
    if (errorFiltro) setErrorFiltro(null);
  }

  function aplicarFiltros() {
    const textoMin = borradorFiltros.min.trim();
    const textoMax = borradorFiltros.max.trim();
    const min = textoMin === '' ? null : Number(textoMin.replace(/\./g, ''));
    const max = textoMax === '' ? null : Number(textoMax.replace(/\./g, ''));

    if ((min !== null && (!Number.isFinite(min) || min < 0)) || (max !== null && (!Number.isFinite(max) || max < 0))) {
      setErrorFiltro('Escribe solo números válidos en el rango de precio.');
      return;
    }

    if (min !== null && max !== null && min > max) {
      setErrorFiltro('El precio mínimo no puede ser mayor que el máximo.');
      return;
    }

    setErrorFiltro(null);
    setFiltros({ marca: borradorFiltros.marca, min, max, soloDisp: borradorFiltros.soloDisp });
    mostrarAviso('Filtros aplicados.');
  }

  function restablecerFiltros() {
    setFiltros(FILTROS_INICIALES);
    setBorradorFiltros(BORRADOR_INICIAL);
    setErrorFiltro(null);
  }

  // ----- Notificaciones (HU29) -----
  function agregarNotificaciones(nuevas) {
    setNotificaciones((actuales) => {
      const claves = new Set(actuales.map((item) => item.clave));
      const sinRepetir = nuevas.filter((item) => {
        if (claves.has(item.clave)) return false;
        claves.add(item.clave);
        return true;
      });
      return sinRepetir.length > 0 ? [...sinRepetir, ...actuales] : actuales;
    });
  }

  function abrirNotificacion(notificacion) {
    setNotificaciones((actuales) =>
      actuales.map((item) => (item.id === notificacion.id ? { ...item, leida: true } : item))
    );
  }

  function marcarTodasLeidas() {
    setNotificaciones((actuales) => actuales.map((item) => ({ ...item, leida: true })));
  }

  const noLeidas = notificaciones.filter((item) => !item.leida).length;

  // ----- Inventario único por variante (HU21, HU28, HU30) -----
  // Aplica cambios de stock por id de variante y avisa a las suscripciones activas.
  function aplicarStock(deltas) {
    const repuestas = [];
    productos.forEach((producto) =>
      producto.variantes.forEach((variante) => {
        if (variante.stock === 0 && (deltas[variante.id] || 0) > 0) repuestas.push(variante.id);
      })
    );

    setProductos((actuales) =>
      actuales.map((producto) => ({
        ...producto,
        variantes: producto.variantes.map((variante) =>
          deltas[variante.id]
            ? { ...variante, stock: Math.max(0, variante.stock + deltas[variante.id]) }
            : variante
        ),
      }))
    );

    const suscritas = suscripciones.filter(
      (item) => item.estado === 'Activa' && repuestas.includes(item.varianteId)
    );

    if (suscritas.length > 0) {
      setSuscripciones((actuales) =>
        actuales.map((item) =>
          suscritas.some((suscrita) => suscrita.id === item.id) ? { ...item, estado: 'Notificada' } : item
        )
      );
      agregarNotificaciones(
        suscritas.map((item) =>
          crearNotificacion(
            'Reposición',
            `${item.nombre} (${item.etiqueta}) ya está disponible nuevamente.`,
            item.productoId,
            `repo:${item.id}`
          )
        )
      );
    }
  }

  function solicitarAviso(producto, variante) {
    if (!variante) return;

    if (variante.stock > 0) {
      mostrarAviso('Esta opción ya tiene unidades disponibles.');
      return;
    }

    if (suscripciones.some((item) => item.estado === 'Activa' && item.varianteId === variante.id)) {
      mostrarAviso('Ya tienes un aviso activo para este artículo.', 'error');
      return;
    }

    setSuscripciones((actuales) => [
      ...actuales,
      {
        id: 'SUS-' + Date.now(),
        productoId: producto.id,
        varianteId: variante.id,
        nombre: producto.nombre,
        etiqueta: obtenerEtiquetaVariante(variante),
        estado: 'Activa',
      },
    ]);
    mostrarAviso('Te avisaremos dentro de la app cuando haya stock.');
  }

  function cancelarAviso(suscripcionId) {
    setSuscripciones((actuales) =>
      actuales.map((item) => (item.id === suscripcionId ? { ...item, estado: 'Cancelada' } : item))
    );
    mostrarAviso('Aviso de reposición cancelado.');
  }

  function simularReposicion(producto, variante) {
    aplicarStock({ [variante.id]: UNIDADES_REPOSICION });
    mostrarAviso(`Demo: se simuló la reposición de ${textoUnidades(UNIDADES_REPOSICION)}.`);
  }

  // ----- Carrito -----
  function agregarAlCarrito(producto, variante, cantidad = 1) {
    if (!variante) {
      mostrarAviso('Selecciona una talla y un color antes de agregar.', 'error');
      return;
    }
    if (variante.stock <= 0) {
      mostrarAviso('La variante seleccionada está agotada.', 'error');
      return;
    }

    const clave = crearClaveCarrito(producto.id, variante.id);
    const lineaExistente = carrito.find((linea) => linea.clave === clave);
    const cantidadActual = lineaExistente ? lineaExistente.cantidad : 0;
    const maximoAdicional = variante.stock - cantidadActual;

    if (cantidad > maximoAdicional) {
      mostrarAviso(
        maximoAdicional <= 0
          ? `Ya tienes en el carrito todas las unidades disponibles (${variante.stock}).`
          : `Máximo permitido: ${textoUnidades(maximoAdicional)} más (stock ${variante.stock}, ya tienes ${cantidadActual}).`,
        'error'
      );
      return;
    }

    if (lineaExistente) {
      setCarrito(carrito.map((linea) => (linea.clave === clave ? { ...linea, cantidad: linea.cantidad + cantidad } : linea)));
    } else {
      setCarrito([...carrito, { clave, productoId: producto.id, varianteId: variante.id, cantidad }]);
    }
    mostrarAviso(`Agregado al carrito: ${textoUnidades(cantidad)}.`);
  }

  function aumentarCantidad(clave) {
    const linea = carrito.find((item) => item.clave === clave);
    if (!linea) return;

    const producto = productos.find((item) => item.id === linea.productoId);
    const variante = producto?.variantes.find((item) => item.id === linea.varianteId);

    if (!variante) {
      mostrarAviso('No encontramos esta variante del producto.', 'error');
      return;
    }

    if (linea.cantidad + 1 > variante.stock) {
      mostrarAviso('Solo hay ' + textoUnidades(variante.stock) + ' disponibles de esta variante.', 'error');
      return;
    }

    setCarrito(carrito.map((item) =>
      item.clave === clave ? { ...item, cantidad: item.cantidad + 1 } : item
    ));
  }

  function eliminarDelCarrito(clave) {
    setCarrito(carrito.filter((linea) => linea.clave !== clave));
    mostrarAviso('Producto eliminado del carrito.');
  }

  function disminuirCantidad(clave) {
    const linea = carrito.find((item) => item.clave === clave);
    if (!linea) return;

    if (linea.cantidad <= 1) {
      eliminarDelCarrito(clave);
      return;
    }

    setCarrito(carrito.map((item) =>
      item.clave === clave ? { ...item, cantidad: item.cantidad - 1 } : item
    ));
  }

  const lineasCarrito = carrito
    .map((linea) => {
      const producto = productos.find((item) => item.id === linea.productoId);
      const variante = producto?.variantes.find((item) => item.id === linea.varianteId);

      if (!producto || !variante) return null;

      return { ...linea, producto, variante };
    })
    .filter(Boolean);

  const subtotal = lineasCarrito.reduce(
    (suma, linea) => suma + linea.cantidad * linea.variante.precio,
    0
  );

  // ----- Envío (HU26): se calcula una sola vez a partir de dirección + modalidad -----
  const direccionActual = direcciones.find((item) => item.id === direccionSel) || null;
  const tarifaEnvio = direccionActual ? obtenerTarifa(direccionActual.municipio, modalidad) : null;
  const sinCobertura = Boolean(direccionActual && !TARIFAS[normalizarTexto(direccionActual.municipio)]);
  const estimacionEnvio = tarifaEnvio || null;
  const envio = subtotal === 0 ? 0 : estimacionEnvio ? estimacionEnvio.costo : null;
  const descuento = cuponAplicado ? Math.round(subtotal * CUPONES[cuponAplicado]) : 0;
  const total = subtotal - descuento + (envio || 0);

  function iniciarCompra() {
    if (carrito.length === 0) {
      mostrarAviso('Tu carrito está vacío.', 'error');
      return;
    }
    setErrores({});
    setFlujo('datos');
  }

  function cambiarDato(campo, valor) {
    setComprador({ ...comprador, [campo]: valor });
    if (errores[campo]) setErrores({ ...errores, [campo]: null });
  }

  function seleccionarDireccion(id) {
    setDireccionSel(id);
    if (errores.direccion) setErrores({ ...errores, direccion: null });
  }

  function seleccionarModalidad(clave) {
    setModalidad(clave);
    if (errores.modalidad) setErrores({ ...errores, modalidad: null });
  }

  function validarDatos() {
    const nuevos = {};

    if (comprador.nombre.trim() === '') nuevos.nombre = 'Falta tu nombre.';
    if (comprador.telefono.trim() === '') nuevos.telefono = 'Falta tu teléfono.';
    else if (!/^[0-9+\s-]{7,15}$/.test(comprador.telefono.trim())) {
      nuevos.telefono = 'Escribe un teléfono válido (solo números, mínimo 7 dígitos).';
    }

    if (!direccionActual) nuevos.direccion = 'Elige una dirección de entrega antes de continuar.';
    else if (sinCobertura) nuevos.direccion = 'No hay envío disponible para ese municipio. Elige otra dirección.';
    if (!modalidad) nuevos.modalidad = 'Elige una modalidad de envío.';

    setErrores(nuevos);

    if (Object.keys(nuevos).length > 0) {
      mostrarAviso('Completa los datos faltantes para continuar.', 'error');
      return;
    }

    setFlujo('revision');
  }

  function confirmarPedido() {
    if (!direccionActual || !modalidad || !estimacionEnvio) {
      mostrarAviso('Completa la dirección y la modalidad de envío.', 'error');
      setFlujo('datos');
      return;
    }

    // Se valida cada variante antes de descontar cualquier existencia.
    const sinStock = lineasCarrito.find((linea) => linea.cantidad > linea.variante.stock);

    if (sinStock) {
      mostrarAviso(
        'No hay stock suficiente de ' + sinStock.producto.nombre +
        ' (' + obtenerEtiquetaVariante(sinStock.variante) + '). Ajusta tu carrito.',
        'error'
      );
      setFlujo(null);
      setSeccion('carrito');
      return;
    }

    const fechaActual = formatearFecha(new Date());
    const pedido = {
      codigo: 'PED-' + String(pedidos.length + 1).padStart(4, '0'),
      fecha: fechaActual,
      comprador: { ...comprador },
      direccion: {
        alias: direccionActual.alias,
        municipio: direccionActual.municipio,
        descripcion: direccionActual.descripcion,
      },
      modalidad,
      plazo: estimacionEnvio.plazo,
      // Los precios se guardan tal como estaban al comprar (pedido inmutable).
      lineas: lineasCarrito.map((linea) => ({
        id: linea.clave,
        productoId: linea.producto.id,
        varianteId: linea.variante.id,
        varianteEtiqueta: obtenerEtiquetaVariante(linea.variante),
        talla: linea.variante.talla,
        color: linea.variante.color,
        nombre: linea.producto.nombre,
        cantidad: linea.cantidad,
        precio: linea.variante.precio,
      })),
      subtotal,
      descuento,
      envio: estimacionEnvio.costo,
      total,
      estado: 'Confirmado',
      historial: [{ estado: 'Confirmado', fecha: fechaActual }],
      stockRestituido: false,
    };

    // El descuento se aplica exclusivamente a las variantes compradas.
    const cantidadesPorVariante = lineasCarrito.reduce((acumulado, linea) => {
      acumulado[linea.variante.id] = (acumulado[linea.variante.id] || 0) + linea.cantidad;
      return acumulado;
    }, {});

    setProductos((productosActuales) => productosActuales.map((producto) => ({
      ...producto,
      variantes: producto.variantes.map((variante) => {
        const cantidadComprada = cantidadesPorVariante[variante.id] || 0;

        return cantidadComprada > 0
          ? { ...variante, stock: Math.max(0, variante.stock - cantidadComprada) }
          : variante;
      }),
    })));

    setPedidos([pedido, ...pedidos]);
    agregarNotificaciones([
      crearNotificacion('Pedido', `Tu pedido ${pedido.codigo} está Confirmado.`, pedido.codigo, `${pedido.codigo}:Confirmado`),
    ]);
    setCarrito([]);
    setCuponAplicado(null);
    setCodigoCupon('');
    setDireccionSel(null);
    setModalidad(null);
    setPedidoConfirmado(pedido);
    setFlujo('confirmado');
  }

  // ----- Seguimiento (HU27) -----
  function simularAvance(codigo) {
    const pedido = pedidos.find((item) => item.codigo === codigo);
    if (!pedido) return;

    if (pedido.estado === 'Entregado' || pedido.estado === 'Cancelado') {
      mostrarAviso(`El pedido está ${pedido.estado}: no se permiten nuevas transiciones.`, 'error');
      return;
    }

    const siguiente = ESTADOS_PEDIDO[ESTADOS_PEDIDO.indexOf(pedido.estado) + 1];
    const fecha = formatearFecha(new Date());

    setPedidos((actuales) => actuales.map((item) =>
      item.codigo === codigo
        ? { ...item, estado: siguiente, historial: [...item.historial, { estado: siguiente, fecha }] }
        : item
    ));
    agregarNotificaciones([
      crearNotificacion('Pedido', `Tu pedido ${codigo} cambió a ${siguiente}.`, codigo, `${codigo}:${siguiente}`),
    ]);
    mostrarAviso(`Pedido ${codigo}: ${siguiente}.`);
  }

  // ----- Cancelación lógica con reintegro único de stock (HU28) -----
  function cancelarPedido(codigo) {
    const pedido = pedidos.find((item) => item.codigo === codigo);
    if (!pedido) return;

    if (pedido.estado === 'Cancelado') {
      mostrarAviso('Este pedido ya estaba cancelado. No se repiten reintegros.', 'error');
      return;
    }

    if (pedido.estado !== 'Confirmado' && pedido.estado !== 'Preparando') {
      mostrarAviso(`No se puede cancelar un pedido que está ${pedido.estado}: ya salió del despacho.`, 'error');
      return;
    }

    if (cancelacionesEnCurso.current.has(codigo)) return;
    cancelacionesEnCurso.current.add(codigo);

    if (!pedido.stockRestituido) {
      const deltas = pedido.lineas.reduce((acumulado, linea) => {
        acumulado[linea.varianteId] = (acumulado[linea.varianteId] || 0) + linea.cantidad;
        return acumulado;
      }, {});
      aplicarStock(deltas);
    }

    const fecha = formatearFecha(new Date());
    setPedidos((actuales) => actuales.map((item) =>
      item.codigo === codigo
        ? { ...item, estado: 'Cancelado', stockRestituido: true, historial: [...item.historial, { estado: 'Cancelado', fecha }] }
        : item
    ));
    agregarNotificaciones([
      crearNotificacion('Pedido', `Tu pedido ${codigo} fue Cancelado.`, codigo, `${codigo}:Cancelado`),
    ]);
    mostrarAviso(`Pedido ${codigo} cancelado. Las unidades volvieron al inventario.`);
  }

  function aplicarCupon() {
    const codigo = codigoCupon.trim().toUpperCase();

    if (codigo === '') {
      mostrarAviso('Escribe un código de cupón.', 'error');
      return;
    }

    if (carrito.length === 0) {
      mostrarAviso('Agrega productos antes de aplicar un cupón.', 'error');
      return;
    }

    if (!CUPONES[codigo]) {
      mostrarAviso('El cupón no es válido.', 'error');
      return;
    }

    if (cuponAplicado === codigo) {
      mostrarAviso('Este cupón ya está aplicado.', 'error');
      return;
    }

    setCuponAplicado(codigo);
    mostrarAviso('Cupón aplicado: ' + codigo + '.');
  }

  function abrirProducto(producto) {
    setValorResena('');
    setErrorResena(null);
    setProductoSeleccionado(producto);
  }

  function enviarResena(idProducto) {
    const texto = valorResena.trim();
    const numero = Number(texto);

    if (texto === '' || !Number.isInteger(numero) || numero < 1 || numero > 5) {
      setErrorResena('La valoración debe ser un número entero entre 1 y 5.');
      return;
    }

    setResenas({
      ...resenas,
      [idProducto]: [...(resenas[idProducto] || []), numero],
    });

    setValorResena('');
    setErrorResena(null);
    mostrarAviso('¡Gracias por tu reseña!');
  }

  // ----- Preguntas del producto (HU24) -----
  function enviarPregunta(productoId, texto) {
    const nueva = {
      id: 'PRE-' + Date.now(),
      pregunta: texto,
      respuesta: null,
      fecha: formatearFecha(new Date()),
      estado: 'Pendiente',
    };
    setPreguntas((actuales) => ({
      ...actuales,
      [productoId]: [...(actuales[productoId] || []), nueva],
    }));
    mostrarAviso('Pregunta enviada. Queda pendiente de respuesta.');
  }

  function simularRespuestaPregunta(productoId, preguntaId) {
    setPreguntas((actuales) => ({
      ...actuales,
      [productoId]: (actuales[productoId] || []).map((item) =>
        item.id === preguntaId
          ? {
              ...item,
              estado: 'Respondida',
              respuesta: 'Respuesta automática de demostración: gracias por tu pregunta. Este texto es simulado y no fue escrito por una persona real.',
            }
          : item
      ),
    }));
    mostrarAviso('Respuesta simulada generada (demo).');
  }

  // ----- Direcciones (HU25) -----
  function guardarDireccion(datos) {
    if (datos.id) {
      setDirecciones((actuales) => actuales.map((item) =>
        item.id === datos.id
          ? { ...item, alias: datos.alias, municipio: datos.municipio, descripcion: datos.descripcion }
          : item
      ));
      mostrarAviso('Dirección actualizada.');
    } else {
      const nueva = {
        id: 'DIR-' + Date.now(),
        alias: datos.alias,
        municipio: datos.municipio,
        descripcion: datos.descripcion,
        principal: direcciones.length === 0,
      };
      setDirecciones((actuales) => [...actuales, nueva]);
      mostrarAviso('Dirección agregada.');
    }
    setDireccionEdicion(null);
    setPantallaExtra('direcciones');
  }

  function marcarPrincipal(id) {
    setDirecciones((actuales) => actuales.map((item) => ({ ...item, principal: item.id === id })));
    mostrarAviso('Dirección principal actualizada.');
  }

  // ----- Ayuda (HU32) -----
  function crearTicket(datos) {
    const ticket = {
      id: 'CASO-' + String(tickets.length + 1).padStart(4, '0'),
      pedido: datos.pedido,
      motivo: datos.motivo,
      descripcion: datos.descripcion,
      estado: 'Abierto',
      respuesta: null,
      fecha: formatearFecha(new Date()),
    };
    setTickets((actuales) => [ticket, ...actuales]);
    mostrarAviso(`Solicitud ${ticket.id} creada.`);
  }

  function simularRespuestaTicket(ticketId) {
    setTickets((actuales) => actuales.map((item) =>
      item.id === ticketId
        ? { ...item, estado: 'Respondido', respuesta: 'Mensaje de prueba (simulado): recibimos tu solicitud y la revisamos. Esta respuesta no proviene de un agente real.' }
        : item
    ));
    mostrarAviso('Respuesta de soporte simulada.');
  }

  // ----- Panel de vendedor -----
  function abrirNuevoProducto() {
    setProductoEdicion(null);
    setFormProducto(FORMULARIO_VACIO);
    setErroresProducto({});
    setPanel('formulario');
  }

  function abrirEditarProducto(producto) {
    setProductoEdicion(producto);
    setFormProducto({
      nombre: producto.nombre,
      marca: producto.marca || 'No especificada',
      categoria: producto.categoria,
      precio: String(producto.precio),
      stock: String(obtenerStockTotal(producto)),
      descripcion: producto.descripcion,
    });

    setErroresProducto({});
    setPanel('formulario');
  }

  function cambiarCampoProducto(campo, valor) {
    setFormProducto({ ...formProducto, [campo]: valor });

    if (erroresProducto[campo]) {
      setErroresProducto({ ...erroresProducto, [campo]: null });
    }
  }

  function guardarProducto() {
    const nuevos = {};
    const nombre = formProducto.nombre.trim();
    const textoPrecio = formProducto.precio.trim();
    const textoStock = formProducto.stock.trim();
    const descripcion = formProducto.descripcion.trim();
    const precio = Number(textoPrecio);
    const stock = Number(textoStock);

    if (nombre === '') nuevos.nombre = 'Falta el nombre del producto.';
    if (formProducto.categoria === '') nuevos.categoria = 'Elige una categoría.';

    if (textoPrecio === '' || !Number.isInteger(precio) || precio <= 0) {
      nuevos.precio = 'El precio debe ser un número entero mayor que 0.';
    }

    const inventarioPorVariantes = productoEdicion && productoEdicion.variantes.length > 1;

    if (!inventarioPorVariantes && (textoStock === '' || !Number.isInteger(stock) || stock < 0)) {
      nuevos.stock = 'El stock debe ser un número entero de 0 o más.';
    }

    if (descripcion.length < 15) {
      nuevos.descripcion = 'La descripción debe tener al menos 15 caracteres.';
    }

    setErroresProducto(nuevos);

    if (Object.keys(nuevos).length > 0) {
      mostrarAviso('Revisa los campos marcados.', 'error');
      return;
    }

    if (productoEdicion) {
      setProductos((actuales) => actuales.map((producto) => {
        if (producto.id !== productoEdicion.id) return producto;

        const variantesActualizadas = producto.variantes.map((variante) => ({
          ...variante,
          precio,
          stock: producto.variantes.length === 1 && !inventarioPorVariantes
            ? stock
            : variante.stock,
        }));

        return {
          ...producto,
          nombre,
          marca: formProducto.marca.trim() || 'No especificada',
          categoria: formProducto.categoria,
          precio,
          descripcion,
          variantes: variantesActualizadas,
        };
      }));

      mostrarAviso('Producto actualizado.');
    } else {
      const numeros = productos.map((producto) =>
        parseInt(producto.id.replace('PROD-', ''), 10)
      );

      const siguiente = Math.max(...numeros) + 1;
      const idNuevo = 'PROD-' + String(siguiente).padStart(3, '0');

      const nuevo = {
        id: idNuevo,
        nombre,
        marca: formProducto.marca.trim() || 'No especificada',
        categoria: formProducto.categoria,
        precio,
        descripcion,
        variantes: crearVarianteUnica(
          String(siguiente).padStart(3, '0'),
          precio,
          stock
        ),
      };

      setProductos([...productos, nuevo]);
      setResenas({ ...resenas, [nuevo.id]: [] });
      mostrarAviso('Producto creado.');
    }

    setPanel('lista');
  }

  const bannerAviso = aviso ? (
    <View style={[
      estilos.aviso,
      { bottom: productoSeleccionado || flujo || pedidoSeleccionado || panel || pantallaExtra || mostrarComparador ? 24 : 96 },
      aviso.tipo === 'error' && { backgroundColor: COLORES.agotado },
    ]}>
      <Text style={estilos.avisoTexto}>{aviso.texto}</Text>
    </View>
  ) : null;

  function alternarFavorito(id) {
    setFavoritos((actuales) =>
      actuales.includes(id)
        ? actuales.filter((item) => item !== id)
        : [...actuales, id]
    );
  }

  function alternarComparacion(id) {
    if (productosComparacion.includes(id)) {
      setProductosComparacion((actuales) =>
        actuales.filter((productoId) => productoId !== id)
      );
      mostrarAviso('Producto retirado de la comparación.');
      return;
    }

    if (productosComparacion.length >= 3) {
      mostrarAviso('El comparador permite un máximo de 3 productos.', 'error');
      return;
    }

    setProductosComparacion((actuales) => [...actuales, id]);
    mostrarAviso('Producto agregado a la comparación.');
  }

  function abrirComparador() {
    if (productosComparacion.length < 2) {
      mostrarAviso('Selecciona al menos 2 productos para comparar.', 'error');
      return;
    }

    setMostrarComparador(true);
  }

  function quitarDeComparacion(id) {
    setProductosComparacion((actuales) =>
      actuales.filter((productoId) => productoId !== id)
    );
    mostrarAviso('Producto retirado de la comparación.');
  }

  const productosSeleccionadosComparacion = productosComparacion
    .map((id) => productos.find((producto) => producto.id === id))
    .filter(Boolean);

  function irDesdeMas(clave) {
    if (clave === 'vendedor') setPanel('lista');
    else setPantallaExtra(clave);
  }

  function limpiarCatalogo() {
    setBusqueda('');
    setCategoriaActiva('Todas');
    restablecerFiltros();
  }

  function renderSeccion() {
    if (seccion === 'favoritos') {
      return (
        <PantallaFavoritos
          productos={productos}
          favoritos={favoritos}
          alAbrir={abrirProducto}
          alAlternar={alternarFavorito}
          alIrCatalogo={() => setSeccion('catalogo')}
        />
      );
    }

    if (seccion === 'carrito') {
      return (
        <PantallaCarrito
          lineas={lineasCarrito}
          subtotal={subtotal}
          envio={envio}
          total={total}
          alMas={aumentarCantidad}
          alMenos={disminuirCantidad}
          alEliminar={eliminarDelCarrito}
          alContinuar={iniciarCompra}
          alIrCatalogo={() => setSeccion('catalogo')}
          codigoCupon={codigoCupon}
          alCambiarCupon={setCodigoCupon}
          alAplicarCupon={aplicarCupon}
          cuponAplicado={cuponAplicado}
          descuento={descuento}
        />
      );
    }

    if (seccion === 'historial') {
      return (
        <PantallaHistorial
          pedidos={pedidos}
          alAbrir={(pedido) => setPedidoSeleccionado(pedido.codigo)}
          alIrCatalogo={() => setSeccion('catalogo')}
        />
      );
    }

    if (seccion === 'mas') {
      return <PantallaMas noLeidas={noLeidas} alIr={irDesdeMas} />;
    }

    return (
      <View style={estilos.seccion}>
        <BarraBusqueda valor={busqueda} alCambiar={setBusqueda} />
        <ChipsCategorias activa={categoriaActiva} alCambiar={setCategoriaActiva} />
        <SelectorOrden orden={orden} alCambiar={setOrden} />

        <CuadriculaProductos
          data={productosVisibles}
          favoritos={favoritos}
          alAbrir={abrirProducto}
          alAlternar={alternarFavorito}
          mostrarComparacion
          productosComparacion={productosComparacion}
          alAlternarComparacion={alternarComparacion}
          encabezado={
            <PanelFiltros
              abierto={filtrosAbiertos}
              alAlternar={() => setFiltrosAbiertos(!filtrosAbiertos)}
              marcas={marcasDisponibles}
              borrador={borradorFiltros}
              alCambiar={cambiarBorrador}
              error={errorFiltro}
              alAplicar={aplicarFiltros}
              alRestablecer={restablecerFiltros}
              cantidadActivos={cantidadFiltrosActivos}
            />
          }
          vacio={
            <MensajeVacio
              hayProductos={productos.length > 0}
              hayFiltros={busqueda.trim() !== '' || categoriaActiva !== 'Todas' || cantidadFiltrosActivos > 0}
              alLimpiar={limpiarCatalogo}
            />
          }
          pie={
            <TouchableOpacity
              style={estilos.enlaceVendedor}
              onPress={() => setPanel('lista')}
            >
              <MaterialCommunityIcons name="storefront-outline" size={18} color={COLORES.gris} />
              <Text style={estilos.enlaceVendedorTexto}>Panel de vendedor</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }

  if (mostrarComparador) {
    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={() => setMostrarComparador(false)} />
        <Encabezado />
        <PantallaComparador
          productos={productosSeleccionadosComparacion}
          alQuitar={quitarDeComparacion}
        />
        {bannerAviso}
      </View>
    );
  }

  if (panel) {
    const tieneVariantes = Boolean(
      productoEdicion && productoEdicion.variantes.length > 1
    );

    const resumenVariantes = productoEdicion
      ? productoEdicion.variantes
          .map((variante) => obtenerEtiquetaVariante(variante) + ': ' + variante.stock)
          .join(' · ')
      : '';

    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver
          alVolver={() => setPanel(panel === 'formulario' ? 'lista' : null)}
        />
        <Encabezado />

        {panel === 'lista' ? (
          <PanelLista
            productos={productos}
            alEditar={abrirEditarProducto}
            alNuevo={abrirNuevoProducto}
          />
        ) : null}

        {panel === 'formulario' ? (
          <PanelFormulario
            form={formProducto}
            errores={erroresProducto}
            editando={productoEdicion !== null}
            tieneVariantes={tieneVariantes}
            resumenVariantes={resumenVariantes}
            alCambiar={cambiarCampoProducto}
            alGuardar={guardarProducto}
          />
        ) : null}

        {bannerAviso}
      </View>
    );
  }

  // Pantallas secundarias: direcciones, notificaciones y ayuda.
  if (pantallaExtra) {
    const volverExtra = pantallaExtra === 'formDireccion'
      ? () => setPantallaExtra('direcciones')
      : () => setPantallaExtra(null);

    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={volverExtra} />
        <Encabezado />

        {pantallaExtra === 'direcciones' ? (
          <PantallaDirecciones
            direcciones={direcciones}
            alNueva={() => {
              setDireccionEdicion(null);
              setPantallaExtra('formDireccion');
            }}
            alEditar={(direccion) => {
              setDireccionEdicion(direccion);
              setPantallaExtra('formDireccion');
            }}
            alPrincipal={marcarPrincipal}
          />
        ) : null}

        {pantallaExtra === 'formDireccion' ? (
          <FormDireccion
            key={direccionEdicion ? direccionEdicion.id : 'nueva'}
            inicial={direccionEdicion}
            alGuardar={guardarDireccion}
          />
        ) : null}

        {pantallaExtra === 'notificaciones' ? (
          <PantallaNotificaciones
            notificaciones={notificaciones}
            alAbrir={abrirNotificacion}
            alMarcarTodas={marcarTodasLeidas}
          />
        ) : null}

        {pantallaExtra === 'ayuda' ? (
          <PantallaAyuda
            pedidos={pedidos}
            tickets={tickets}
            alCrear={crearTicket}
            alSimularRespuesta={simularRespuestaTicket}
          />
        ) : null}

        {bannerAviso}
      </View>
    );
  }

  if (productoSeleccionado) {
    const productoActual = productos.find(
      (producto) => producto.id === productoSeleccionado.id
    );

    if (!productoActual) {
      return (
        <View style={estilos.contenedor}>
          <BarraEstado style="dark" />
          <FilaVolver alVolver={() => setProductoSeleccionado(null)} />
          <EstadoVacio
            titulo="Producto no disponible"
            texto="Este producto ya no está en el catálogo."
            textoBoton="Volver al catálogo"
            alBoton={() => {
              setProductoSeleccionado(null);
              setSeccion('catalogo');
            }}
          />
        </View>
      );
    }

    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={() => setProductoSeleccionado(null)} />
        <Encabezado />

        <PantallaDetalle
          key={productoActual.id}
          producto={productoActual}
          productos={productos}
          esFavorito={favoritos.includes(productoActual.id)}
          alAlternarFavorito={alternarFavorito}
          alAgregar={agregarAlCarrito}
          resenas={resenas[productoActual.id] || []}
          valorResena={valorResena}
          errorResena={errorResena}
          alCambiarResena={setValorResena}
          alEnviarResena={enviarResena}
          preguntas={preguntas[productoActual.id] || []}
          alEnviarPregunta={enviarPregunta}
          alSimularRespuesta={simularRespuestaPregunta}
          suscripciones={suscripciones}
          alSolicitarAviso={solicitarAviso}
          alCancelarAviso={cancelarAviso}
          alSimularReposicion={simularReposicion}
          alAbrirProducto={abrirProducto}
        />

        {bannerAviso}
      </View>
    );
  }

  if (flujo) {
    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />

        {flujo === 'datos' ? (
          <FilaVolver alVolver={() => setFlujo(null)} />
        ) : null}

        {flujo === 'revision' ? (
          <FilaVolver alVolver={() => setFlujo('datos')} />
        ) : null}

        <Encabezado />

        {flujo === 'datos' ? (
          <PantallaEntrega
            comprador={comprador}
            errores={errores}
            alCambiar={cambiarDato}
            direcciones={direcciones}
            direccionSel={direccionSel}
            alSeleccionarDireccion={seleccionarDireccion}
            modalidad={modalidad}
            alModalidad={seleccionarModalidad}
            direccionActual={direccionActual}
            estimacion={estimacionEnvio}
            sinCobertura={sinCobertura}
            subtotal={subtotal}
            descuento={descuento}
            envio={envio}
            total={total}
            alAdministrar={() => setPantallaExtra('direcciones')}
            alContinuar={validarDatos}
          />
        ) : null}

        {flujo === 'revision' && direccionActual && estimacionEnvio ? (
          <PantallaRevision
            lineas={lineasCarrito}
            comprador={comprador}
            direccion={direccionActual}
            modalidad={modalidad}
            plazo={estimacionEnvio.plazo}
            subtotal={subtotal}
            descuento={descuento}
            envio={envio}
            total={total}
            alConfirmar={confirmarPedido}
          />
        ) : null}

        {flujo === 'confirmado' ? (
          <PantallaConfirmacion
            pedido={pedidoConfirmado}
            alVerHistorial={() => {
              setFlujo(null);
              setSeccion('historial');
            }}
            alSeguir={() => {
              setFlujo(null);
              setSeccion('catalogo');
            }}
          />
        ) : null}

        {bannerAviso}
      </View>
    );
  }

  if (pedidoSeleccionado) {
    const pedidoActual = pedidos.find((item) => item.codigo === pedidoSeleccionado);

    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={() => setPedidoSeleccionado(null)} />
        <Encabezado />
        {pedidoActual ? (
          <PantallaPedido
            key={pedidoActual.codigo}
            pedido={pedidoActual}
            alAvanzar={simularAvance}
            alCancelar={cancelarPedido}
          />
        ) : (
          <EstadoVacio titulo="Pedido no encontrado" texto="No pudimos encontrar este pedido." />
        )}
        {bannerAviso}
      </View>
    );
  }

  return (
    <View style={estilos.contenedor}>
      <BarraEstado style="dark" />
      <Encabezado />

      <View style={estilos.seccion}>
        {renderSeccion()}
      </View>

      {seccion === 'catalogo' && productosComparacion.length > 0 ? (
        <BarraComparacion
          cantidad={productosComparacion.length}
          alAbrir={abrirComparador}
          alLimpiar={() => setProductosComparacion([])}
        />
      ) : null}

      <BarraNavegacion seccionActiva={seccion} alCambiar={setSeccion} insignias={{ mas: noLeidas }} />

      {seccion === 'carrito' ? (
        <TouchableOpacity
          style={estilos.flechaCarrito}
          onPress={() => setSeccion('catalogo')}
        >
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORES.texto} />
        </TouchableOpacity>
      ) : null}

      {bannerAviso}
    </View>
  );
}

// ---------- ESTILOS ----------
const MARGEN_SUPERIOR = Platform.OS === 'android'
  ? StatusBar.currentHeight || 24
  : 50;

const estilos = StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: COLORES.fondo, paddingTop: MARGEN_SUPERIOR },
  encabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16, paddingVertical: 10 },
  logo: { width: 64, height: 59 },
  divisor: { width: 1, height: 40, backgroundColor: COLORES.texto, marginHorizontal: 12 },
  marcaNombre: { fontFamily: FUENTE.negrita, fontSize: 20, color: COLORES.texto },
  marcaEslogan: { fontFamily: FUENTE.normal, fontSize: 11, color: COLORES.texto, marginTop: 2 },
  busqueda: { flexDirection: 'row', alignItems: 'center', height: 46, marginHorizontal: 16, marginTop: 6, paddingLeft: 14, paddingRight: 4, borderRadius: 23, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.blanco },
  busquedaInput: { flex: 1, marginLeft: 8, fontFamily: FUENTE.normal, fontSize: 13, color: COLORES.texto },
  busquedaBoton: { width: 46, height: 38, borderRadius: 19, backgroundColor: COLORES.acento, alignItems: 'center', justifyContent: 'center' },
  chipsScroll: { flexGrow: 0, marginTop: 12 },
  chipsFila: { paddingHorizontal: 16, alignItems: 'center', gap: 6 },
  chip: { backgroundColor: COLORES.chip, borderRadius: 18, paddingVertical: 8, paddingHorizontal: 12, maxWidth: 110 },
  chipActivo: { backgroundColor: COLORES.acento },
  chipTexto: { fontFamily: FUENTE.media, fontSize: 11.5, lineHeight: 14, color: COLORES.texto, textAlign: 'center' },
  chipTextoActivo: { color: COLORES.blanco },
  orden: { flexDirection: 'row', alignSelf: 'center', width: '86%', height: 34, marginTop: 12, marginBottom: 12, borderRadius: 17, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.segmento, overflow: 'hidden' },
  ordenOpcion: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  ordenOpcionActiva: { backgroundColor: COLORES.apoyo },
  ordenTexto: { fontFamily: FUENTE.media, fontSize: 12, color: COLORES.texto },
  ordenTextoActivo: { color: COLORES.blanco },
  lista: { paddingHorizontal: 16, paddingBottom: 24, flexGrow: 1 },
  fila: { justifyContent: 'space-between' },
  tarjeta: { width: '48.5%', backgroundColor: COLORES.blanco, borderRadius: 14, borderWidth: 1, borderColor: COLORES.borde, padding: 6, marginBottom: 10 },
  tarjetaImagen: { height: 100, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  tarjetaImagenAbrir: { width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' },
  botonComparar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 7, marginTop: 8, borderRadius: 12, backgroundColor: COLORES.segmento },
  botonCompararActivo: { backgroundColor: COLORES.apoyo },
  botonCompararTexto: { fontFamily: FUENTE.media, fontSize: 11, color: COLORES.texto },
  botonCompararTextoActivo: { color: COLORES.blanco },
  corazon: { position: 'absolute', top: 6, right: 6 },
  tarjetaNombre: { fontFamily: FUENTE.semi, fontSize: 13, lineHeight: 17, color: COLORES.texto, minHeight: 34, paddingHorizontal: 2 },
  tarjetaPrecio: { fontFamily: FUENTE.negrita, fontSize: 16, color: COLORES.texto, marginTop: 4, paddingHorizontal: 2 },
  etiqueta: { alignSelf: 'flex-start', maxWidth: '100%', backgroundColor: COLORES.chip, borderRadius: 10, paddingVertical: 3, paddingHorizontal: 8, marginTop: 6, marginLeft: 2 },
  etiquetaTexto: { fontFamily: FUENTE.normal, fontSize: 9.5, color: COLORES.texto },
  disponibilidadFila: { flexDirection: 'row', alignItems: 'center', marginTop: 8, marginBottom: 2, paddingHorizontal: 2 },
  punto: { width: 7, height: 7, borderRadius: 4, marginRight: 5 },
  disponibilidadTexto: { fontFamily: FUENTE.media, fontSize: 11 },
  volver: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingTop: 8 },
  volverTexto: { fontFamily: FUENTE.media, fontSize: 15, color: COLORES.texto },
  detalle: { paddingHorizontal: 16, paddingBottom: 28 },
  detalleImagen: { height: 178, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  detalleCorazon: { position: 'absolute', top: 10, right: 10 },
  detalleNombre: { fontFamily: FUENTE.semi, fontSize: 21, color: COLORES.texto, marginTop: 14 },
  detalleEtiqueta: { marginLeft: 0, marginTop: 8, paddingVertical: 5, paddingHorizontal: 14, borderRadius: 14 },
  detalleEtiquetaTexto: { fontFamily: FUENTE.media, fontSize: 13, color: COLORES.texto },
  detallePrecio: { fontFamily: FUENTE.negrita, fontSize: 32, color: COLORES.texto, marginTop: 8 },
  detalleStock: { fontFamily: FUENTE.media, fontSize: 13, flex: 1 },
  selectorVariante: { marginTop: 12, padding: 12, borderWidth: 1, borderColor: COLORES.borde, borderRadius: 14, backgroundColor: COLORES.blanco },
  grupoOpciones: { marginBottom: 10 },
  opcionesTitulo: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.texto, marginBottom: 7 },
  opcionesFila: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  opcionVariante: { minWidth: 48, paddingVertical: 8, paddingHorizontal: 13, borderRadius: 16, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.segmento, alignItems: 'center' },
  opcionVarianteActiva: { backgroundColor: COLORES.acento, borderColor: COLORES.acento },
  opcionVarianteTexto: { fontFamily: FUENTE.media, fontSize: 13, color: COLORES.texto },
  opcionVarianteTextoActivo: { color: COLORES.blanco },
  calificacionFila: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  estrellas: { flexDirection: 'row' },
  calificacionTexto: { fontFamily: FUENTE.media, fontSize: 15, color: COLORES.texto, marginLeft: 8 },
  detalleLinea: { height: 1, backgroundColor: COLORES.borde, marginTop: 12 },
  detalleDescripcion: { fontFamily: FUENTE.normal, fontSize: 14, lineHeight: 21, color: COLORES.texto, marginTop: 12 },
  botonAgregar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 26, backgroundColor: COLORES.acento, marginTop: 20, paddingHorizontal: 12 },
  botonAgregarInactivo: { backgroundColor: '#C9CCCB' },
  botonAgregarTexto: { fontFamily: FUENTE.semi, fontSize: 16, color: COLORES.blanco },
  campo: { marginHorizontal: 16, marginBottom: 12 },
  campoEtiqueta: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.texto, marginBottom: 6 },
  campoInput: { height: 46, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.blanco, fontFamily: FUENTE.normal, fontSize: 14, color: COLORES.texto },
  campoInputError: { borderColor: COLORES.agotado },
  campoDeshabilitado: { backgroundColor: COLORES.segmento, color: COLORES.gris },
  campoError: { fontFamily: FUENTE.media, fontSize: 12, color: COLORES.agotado, marginTop: 4 },
  notaSimulacion: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginTop: 4, padding: 12, borderRadius: 12, backgroundColor: COLORES.chip },
  notaSimulacionTexto: { flex: 1, fontFamily: FUENTE.normal, fontSize: 12.5, lineHeight: 18, color: COLORES.texto },
  bloque: { marginHorizontal: 16, marginBottom: 12, padding: 14, borderRadius: 14, backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: COLORES.borde },
  bloqueTitulo: { fontFamily: FUENTE.negrita, fontSize: 15, color: COLORES.texto, marginBottom: 6 },
  filaDato: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  filaDatoEtiqueta: { flex: 1, fontFamily: FUENTE.normal, fontSize: 13, color: COLORES.texto, marginRight: 10 },
  filaDatoValor: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.texto, maxWidth: '55%', textAlign: 'right' },
  confirmacion: { alignItems: 'center', paddingHorizontal: 16, paddingTop: 28, paddingBottom: 24 },
  codigoChip: { backgroundColor: COLORES.acento, borderRadius: 16, paddingVertical: 6, paddingHorizontal: 18, marginBottom: 10 },
  codigoTexto: { fontFamily: FUENTE.negrita, fontSize: 16, color: COLORES.blanco },
  botonSecundario: { marginTop: 10, height: 46, paddingHorizontal: 28, borderRadius: 23, borderWidth: 1.5, borderColor: COLORES.acento, alignItems: 'center', justifyContent: 'center' },
  botonSecundarioTexto: { fontFamily: FUENTE.semi, fontSize: 15, color: COLORES.acento },
  pedidoTarjeta: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 10, padding: 14, borderRadius: 14, backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: COLORES.borde },
  pedidoCodigo: { fontFamily: FUENTE.negrita, fontSize: 15, color: COLORES.texto },
  pedidoFecha: { fontFamily: FUENTE.normal, fontSize: 12, color: COLORES.gris, marginTop: 2 },
  pedidoTotal: { fontFamily: FUENTE.negrita, fontSize: 15, color: COLORES.texto, marginRight: 6 },
  pedidoFechaDetalle: { fontFamily: FUENTE.normal, fontSize: 13, color: COLORES.gris, marginHorizontal: 16, marginBottom: 12 },
  bloqueResena: { marginTop: 20, padding: 14, borderRadius: 14, backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: COLORES.borde },
  enlaceVendedor: { flexDirection: 'row', alignSelf: 'center', alignItems: 'center', gap: 6, paddingVertical: 10, marginTop: 4 },
  enlaceVendedorTexto: { fontFamily: FUENTE.media, fontSize: 12.5, color: COLORES.gris },
  chipsFormulario: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  botonEditar: { paddingHorizontal: 16, paddingVertical: 7, borderRadius: 14, borderWidth: 1.5, borderColor: COLORES.acento },
  botonEditarTexto: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.acento },
  carritoScroll: { paddingBottom: 24 },
  carritoVacio: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 24 },
  linea: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORES.blanco, borderRadius: 14, borderWidth: 1, borderColor: COLORES.borde, padding: 8, marginHorizontal: 16, marginBottom: 10 },
  lineaImagen: { width: 84, height: 84, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  lineaDatos: { flex: 1, marginLeft: 12 },
  lineaNombre: { fontFamily: FUENTE.semi, fontSize: 14, color: COLORES.texto },
  lineaVariante: { fontFamily: FUENTE.normal, fontSize: 11, color: COLORES.gris, marginTop: 2 },
  lineaPrecio: { fontFamily: FUENTE.negrita, fontSize: 15, color: COLORES.texto, marginTop: 2 },
  cantidad: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: COLORES.chip, borderRadius: 16, marginTop: 6 },
  cantidadBoton: { width: 34, height: 30, alignItems: 'center', justifyContent: 'center' },
  cantidadTexto: { fontFamily: FUENTE.semi, fontSize: 14, color: COLORES.texto, minWidth: 24, textAlign: 'center' },
  lineaSeparador: { width: 1, height: 56, backgroundColor: COLORES.borde, marginHorizontal: 8 },
  eliminar: { alignItems: 'center', paddingHorizontal: 6, gap: 2 },
  eliminarTexto: { fontFamily: FUENTE.normal, fontSize: 10.5, color: COLORES.gris },
  cuponFila: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 4, gap: 8 },
  cuponCampo: { flex: 1, flexDirection: 'row', alignItems: 'center', height: 46, paddingHorizontal: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.blanco },
  cuponInput: { flex: 1, marginLeft: 8, fontFamily: FUENTE.normal, fontSize: 13, color: COLORES.texto },
  cuponBoton: { height: 46, paddingHorizontal: 22, borderRadius: 14, backgroundColor: COLORES.acento, alignItems: 'center', justifyContent: 'center' },
  cuponBotonTexto: { fontFamily: FUENTE.semi, fontSize: 14, color: COLORES.blanco },
  resumen: { marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 14, backgroundColor: '#EFECE4', borderWidth: 1, borderColor: COLORES.borde },
  resumenFila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 3 },
  resumenEtiqueta: { fontFamily: FUENTE.normal, fontSize: 14, color: COLORES.texto },
  resumenValor: { fontFamily: FUENTE.semi, fontSize: 14, color: COLORES.texto },
  resumenLinea: { height: 1, backgroundColor: COLORES.texto, opacity: 0.25, marginVertical: 8 },
  resumenTotalEtiqueta: { fontFamily: FUENTE.negrita, fontSize: 18, color: COLORES.texto },
  resumenTotalValor: { fontFamily: FUENTE.negrita, fontSize: 22, color: COLORES.texto },
  botonContinuar: { height: 52, borderRadius: 26, backgroundColor: COLORES.acento, alignItems: 'center', justifyContent: 'center', marginHorizontal: 16, marginTop: 16 },
  flechaCarrito: { position: 'absolute', top: MARGEN_SUPERIOR + 16, left: 8 },
  aviso: { position: 'absolute', left: 16, right: 16, backgroundColor: COLORES.texto, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
  avisoTexto: { fontFamily: FUENTE.media, fontSize: 13, color: COLORES.blanco, textAlign: 'center' },
  tituloFila: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 4, marginBottom: 12 },
  tituloPantalla: { fontFamily: FUENTE.negrita, fontSize: 24, color: COLORES.texto, marginLeft: 8 },
  tituloLinea: { flex: 1, height: 1, backgroundColor: COLORES.texto, opacity: 0.35, marginLeft: 12 },
  vacioIcono: { width: 72, height: 72, borderRadius: 36, backgroundColor: COLORES.chip, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  botonIr: { marginTop: 18, height: 46, paddingHorizontal: 28, borderRadius: 23, backgroundColor: COLORES.acento, alignItems: 'center', justifyContent: 'center' },
  botonIrTexto: { fontFamily: FUENTE.semi, fontSize: 15, color: COLORES.blanco },
  seccion: { flex: 1 },
  barra: { flexDirection: 'row', backgroundColor: COLORES.blanco, borderTopWidth: 1, borderTopColor: COLORES.borde, paddingTop: 8, paddingBottom: Platform.OS === 'ios' ? 22 : 12 },
  barraItemContenedor: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  barraSeparador: { width: 1, height: 34, backgroundColor: COLORES.borde },
  barraItem: { flex: 1, alignItems: 'center', gap: 2 },
  barraTexto: { fontFamily: FUENTE.media, fontSize: 11 },
  vacio: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 48 },
  vacioTitulo: { fontFamily: FUENTE.negrita, fontSize: 18, color: COLORES.texto, textAlign: 'center' },
  vacioTexto: { fontFamily: FUENTE.normal, fontSize: 14, lineHeight: 20, color: COLORES.gris, textAlign: 'center', marginTop: 6 },
  barraComparacion: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, backgroundColor: COLORES.blanco, borderTopWidth: 1, borderTopColor: COLORES.borde },
  barraComparacionDatos: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 7 },
  barraComparacionTitulo: { fontFamily: FUENTE.semi, fontSize: 11, color: COLORES.texto },
  barraComparacionAyuda: { fontFamily: FUENTE.normal, fontSize: 9.5, color: COLORES.gris },
  barraComparacionLimpiar: { paddingHorizontal: 5, paddingVertical: 8 },
  barraComparacionLimpiarTexto: { fontFamily: FUENTE.media, fontSize: 10, color: COLORES.agotado },
  barraComparacionBoton: { paddingHorizontal: 13, paddingVertical: 9, borderRadius: 16, backgroundColor: COLORES.acento },
  barraComparacionBotonInactivo: { backgroundColor: '#C9CCCB' },
  barraComparacionBotonTexto: { fontFamily: FUENTE.semi, fontSize: 11, color: COLORES.blanco },
  comparadorScroll: { paddingBottom: 24 },
  comparadorAyuda: { fontFamily: FUENTE.normal, fontSize: 12, lineHeight: 18, color: COLORES.gris, marginHorizontal: 16, marginBottom: 12 },
  comparadorTabla: { paddingHorizontal: 12, paddingBottom: 8 },
  comparadorFila: { flexDirection: 'row' },
  comparadorCeldaEtiqueta: { width: 105, minHeight: 76, justifyContent: 'center', paddingHorizontal: 9, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.segmento },
  comparadorCeldaCabecera: { minHeight: 205, justifyContent: 'flex-start', paddingTop: 10 },
  comparadorCabeceraTexto: { fontFamily: FUENTE.semi, fontSize: 12, color: COLORES.texto },
  comparadorCeldaProducto: { width: 170, minHeight: 205, alignItems: 'center', padding: 9, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.blanco },
  comparadorImagen: { width: 130, height: 88, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  comparadorNombre: { fontFamily: FUENTE.semi, fontSize: 12, lineHeight: 16, color: COLORES.texto, textAlign: 'center', marginTop: 7, minHeight: 34 },
  comparadorQuitar: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 7 },
  comparadorQuitarTexto: { fontFamily: FUENTE.media, fontSize: 10, color: COLORES.agotado },
  comparadorEtiquetaTexto: { fontFamily: FUENTE.semi, fontSize: 11, color: COLORES.texto },
  comparadorCeldaValor: { width: 170, minHeight: 76, justifyContent: 'center', paddingHorizontal: 10, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.blanco },
  comparadorValorTexto: { fontFamily: FUENTE.media, fontSize: 11, color: COLORES.texto, textAlign: 'center' },
  comparadorProductoRestante: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginHorizontal: 16, marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: COLORES.borde },
  comparadorProductoRestanteNombre: { flex: 1, fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.texto },

  // ----- Estilos nuevos del Taller 5 -----
  textoSecundario: { fontFamily: FUENTE.normal, fontSize: 13, lineHeight: 19, color: COLORES.gris },
  filtrosContenedor: { marginBottom: 10 },
  filtrosCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filtrosBoton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 16, backgroundColor: COLORES.segmento, borderWidth: 1, borderColor: COLORES.borde },
  filtrosBotonTexto: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.texto },
  filtrosRestablecerTexto: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.agotado },
  filtrosPanel: { marginTop: 8, padding: 14, borderRadius: 14, backgroundColor: COLORES.blanco, borderWidth: 1, borderColor: COLORES.borde },
  filtrosPrecioFila: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  filtrosPrecioInput: { flex: 1 },
  filtrosGuion: { fontFamily: FUENTE.media, fontSize: 16, color: COLORES.gris },
  filtrosAcciones: { flexDirection: 'row', gap: 10 },
  filtrosAccionBoton: { flex: 1, paddingHorizontal: 8 },
  estadoBadge: { alignSelf: 'flex-start', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 10 },
  estadoBadgeTexto: { fontFamily: FUENTE.semi, fontSize: 11, color: COLORES.blanco },
  estadoFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  timelineTitulo: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.gris, marginTop: 6, marginBottom: 8 },
  timelineFila: { flexDirection: 'row' },
  timelineColumna: { width: 22, alignItems: 'center' },
  timelinePunto: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  timelineLinea: { flex: 1, width: 2, backgroundColor: COLORES.borde, marginTop: 2 },
  timelineEstado: { fontFamily: FUENTE.semi, fontSize: 14, color: COLORES.texto },
  timelineFecha: { fontFamily: FUENTE.normal, fontSize: 12, color: COLORES.gris },
  botonAncho: { alignSelf: 'stretch', marginHorizontal: 0 },
  confirmarCancelacion: { marginTop: 12, padding: 12, borderRadius: 12, backgroundColor: '#FBE9E7' },
  confirmarCancelacionTexto: { fontFamily: FUENTE.medium || FUENTE.media, fontSize: 13, lineHeight: 19, color: COLORES.texto },
  botonPequeno: { alignSelf: 'flex-start', marginTop: 8, paddingVertical: 7, paddingHorizontal: 14, borderRadius: 14, backgroundColor: COLORES.segmento, borderWidth: 1, borderColor: COLORES.borde },
  botonPequenoTexto: { fontFamily: FUENTE.semi, fontSize: 12, color: COLORES.texto },
  bloqueAgotado: { marginTop: 16, padding: 14, borderRadius: 14, backgroundColor: '#FBE9E7', borderWidth: 1, borderColor: COLORES.borde },
  cantidadDetalleFila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 16 },
  preguntaTarjeta: { marginTop: 10, padding: 12, borderRadius: 12, backgroundColor: COLORES.fondo, borderWidth: 1, borderColor: COLORES.borde },
  preguntaCabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  preguntaFecha: { fontFamily: FUENTE.normal, fontSize: 11, color: COLORES.gris },
  preguntaTexto: { fontFamily: FUENTE.media, fontSize: 13, lineHeight: 19, color: COLORES.texto, marginTop: 4 },
  preguntaRespuesta: { fontFamily: FUENTE.normal, fontSize: 12.5, lineHeight: 18, color: COLORES.apoyo, marginTop: 6 },
  relacionadoTarjeta: { width: 140, padding: 8, borderRadius: 12, backgroundColor: COLORES.fondo, borderWidth: 1, borderColor: COLORES.borde },
  relacionadoImagen: { height: 80, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  relacionadoNombre: { fontFamily: FUENTE.semi, fontSize: 12, lineHeight: 16, color: COLORES.texto, marginTop: 6, minHeight: 32 },
  relacionadoPrecio: { fontFamily: FUENTE.negrita, fontSize: 14, color: COLORES.texto, marginTop: 2 },
  relacionadoDisp: { fontFamily: FUENTE.normal, fontSize: 10.5, color: COLORES.disponible, marginTop: 2 },
  direccionOpcion: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 10, marginBottom: 8, borderRadius: 12, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.fondo },
  direccionOpcionActiva: { borderColor: COLORES.acento, backgroundColor: '#FCEFE9' },
  direccionAlias: { fontFamily: FUENTE.semi, fontSize: 14, color: COLORES.texto },
  direccionDetalle: { fontFamily: FUENTE.normal, fontSize: 12, color: COLORES.gris, marginTop: 2 },
  estimacionTexto: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.disponible, marginTop: 10 },
  insignia: { position: 'absolute', top: -4, right: -8, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: COLORES.agotado, alignItems: 'center', justifyContent: 'center' },
  insigniaInline: { position: 'relative', top: 0, right: 0, marginRight: 8 },
  insigniaTexto: { fontFamily: FUENTE.negrita, fontSize: 10, color: COLORES.blanco },
  notificacionNoLeida: { backgroundColor: '#FCEFE9', borderColor: COLORES.acento },
  notificacionMensaje: { fontFamily: FUENTE.normal, fontSize: 13, lineHeight: 18, color: COLORES.texto },
  puntoNoLeido: { width: 10, height: 10, borderRadius: 5, backgroundColor: COLORES.acento, marginLeft: 8 },
});