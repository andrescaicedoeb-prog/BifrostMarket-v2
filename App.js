import { useEffect, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { StatusBar as BarraEstado } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans';

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

// Cupones disponibles (código y porcentaje de descuento)
const CUPONES = { BIENVENIDO10: 0.1 };

const FORMULARIO_VACIO = { nombre: '', categoria: '', precio: '', stock: '', descripcion: '' };

// Reglas de envío
const UMBRAL_ENVIO_GRATIS = 150000;
const COSTO_ENVIO = 8000;

const SECCIONES = [
  { clave: 'catalogo', etiqueta: 'Catálogo', icono: 'home-outline', iconoActivo: 'home' },
  { clave: 'favoritos', etiqueta: 'Favoritos', icono: 'heart-outline', iconoActivo: 'heart' },
  { clave: 'carrito', etiqueta: 'Carrito', icono: 'cart-outline', iconoActivo: 'cart' },
  { clave: 'historial', etiqueta: 'Historial', icono: 'history', iconoActivo: 'history' },
];

// Color de fondo provisional del espacio de imagen, según la categoría
const TINTE_CATEGORIA = {
  'Tecnología': '#D5DED7',
  'Moda': '#F6DDCF',
  'Accesorios': '#E6E2D6',
  'Cosmética e higiene personal': '#F5E6CC',
};

// ---------- DATOS INICIALES ----------
const PRODUCTOS_INICIALES = [
  { id: 'PROD-001', nombre: 'Audífonos Samsung Galaxy Buds', categoria: 'Tecnología', precio: 299000, stock: 15, descripcion: 'Diseño de Corea del Sur: audífonos inalámbricos con estuche de carga y sonido envolvente.', imagen: require('./assets/audifonos_samsung_buds.webp') },
  { id: 'PROD-002', nombre: 'Huawei MateBook Fold Ultimate Design', categoria: 'Tecnología', precio: 13100000, stock: 0, descripcion: 'Diseño de China: computador plegable de pantalla grande para trabajar en cualquier lugar.', imagen: require('./assets/huawei_matebook_fold.jpg') },
  { id: 'PROD-003', nombre: 'Abrigo Pujovik', categoria: 'Moda', precio: 980000, stock: 6, descripcion: 'Origen Rusia: abrigo de plumas muy usado en el invierno ruso, ideal para climas extremos.', imagen: require('./assets/abrigo_pujovik.jpg') },
  { id: 'PROD-004', nombre: 'Li-Ning Way of Wade 12', categoria: 'Moda', precio: 900000, stock: 8, descripcion: 'Origen China: zapatillas de baloncesto de alto rendimiento, con gran amortiguación y máxima comodidad.', imagen: require('./assets/tenis_li_ning_wade_12.webp') },
  { id: 'PROD-005', nombre: 'Torriden pack', categoria: 'Cosmética e higiene personal', precio: 211000, stock: 10, descripcion: 'Cosmética coreana: pack de cuidado facial con ingredientes hidratantes.', imagen: require('./assets/torriden_pack.jpg') },
  { id: 'PROD-006', nombre: 'Perfume Ariana Grande Cloud Pink EDP', categoria: 'Cosmética e higiene personal', precio: 200000, stock: 12, descripcion: 'Eau de parfum de aroma dulce y suave, importado de Estados Unidos.', imagen: require('./assets/perfume_ariana_cloud_pink.webp') },
  { id: 'PROD-007', nombre: 'Argollas de matrimonio oro 18k', categoria: 'Accesorios', precio: 3500000, stock: 3, descripcion: 'Par de argollas de matrimonio en oro de 18k con acabado pulido.', imagen: require('./assets/argollas_matrimonio_oro_18k.webp') },
  { id: 'PROD-008', nombre: 'Ray-Ban Aviator Classic', categoria: 'Accesorios', precio: 477000, stock: 7, descripcion: 'Gafas de sol de estilo clásico aviador con protección UV y montura metálica.', imagen: require('./assets/rayban_aviator_classic.avif') },
  { id: 'PROD-009', nombre: 'Jabón Dove', categoria: 'Cosmética e higiene personal', precio: 16000, stock: 50, descripcion: 'Jabón de tocador hidratante y suave para el cuidado diario de la piel.', imagen: require('./assets/jabon_dov.avif') },
  { id: 'PROD-010', nombre: 'Camisa popelina', categoria: 'Moda', precio: 355000, stock: 20, descripcion: 'Camisa de popelina de algodón, fresca y elegante para el trabajo o los viajes.', imagen: require('./assets/camisa_popelina.jpg') },
  { id: 'PROD-011', nombre: 'Celular Google Pixel 11', categoria: 'Tecnología', precio: 7300000, stock: 4, descripcion: 'Diseño de Estados Unidos: celular de gama alta con cámara avanzada y última generación.', imagen: require('./assets/google_pixel_11.png') },
  { id: 'PROD-012', nombre: 'Toalla de baño de algodón egipcio', categoria: 'Cosmética e higiene personal', precio: 400000, stock: 14, descripcion: 'Origen Egipto: toalla de baño de algodón egipcio, suave y muy absorbente.', imagen: require('./assets/toalla_algodon_egipcio.webp') },
];

// Reseñas ficticias iniciales: dos valoraciones (5 y 4) por producto
const RESENAS_INICIALES = PRODUCTOS_INICIALES.reduce((acc, p) => ({ ...acc, [p.id]: [5, 4] }), {});

// ---------- FUNCIONES AUXILIARES ----------
function calcularPromedio(lista) {
  if (!lista || lista.length === 0) {
    return 0;
  }
  const suma = lista.reduce((s, n) => s + n, 0);
  return Math.round((suma / lista.length) * 10) / 10;
}

// Convierte 299000 en "$299.000"
function formatearCOP(valor) {
  return '$' + String(valor).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function dosDigitos(n) {
  return n < 10 ? '0' + n : String(n);
}

function formatearFecha(fecha) {
  return (
    dosDigitos(fecha.getDate()) + '/' + dosDigitos(fecha.getMonth() + 1) + '/' +
    fecha.getFullYear() + ' ' + dosDigitos(fecha.getHours()) + ':' + dosDigitos(fecha.getMinutes())
  );
}

function textoUnidades(n) {
  return n === 1 ? '1 unidad' : n + ' unidades';
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
      <Image
        source={require('./assets/logo_bm.png')}
        style={estilos.logo}
        resizeMode="contain"
      />
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={estilos.chipsScroll}
      contentContainerStyle={estilos.chipsFila}
    >
      {CATEGORIAS_FILTRO.map((categoria) => {
        const esActiva = categoria === activa;
        return (
          <TouchableOpacity
            key={categoria}
            style={[estilos.chip, esActiva && estilos.chipActivo]}
            onPress={() => alCambiar(categoria)}
          >
            <Text
              style={[estilos.chipTexto, esActiva && estilos.chipTextoActivo]}
              numberOfLines={2}
            >
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
      {opciones.map((o) => {
        const activa = o.clave === orden;
        return (
          <TouchableOpacity
            key={o.clave}
            style={[estilos.ordenOpcion, activa && estilos.ordenOpcionActiva]}
            onPress={() => alCambiar(o.clave)}
          >
            <MaterialCommunityIcons
              name="swap-vertical"
              size={15}
              color={activa ? COLORES.blanco : COLORES.texto}
            />
            <Text style={[estilos.ordenTexto, activa && estilos.ordenTextoActivo]}>
              {o.etiqueta}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function TarjetaProducto({ producto, alAbrir, esFavorito, alAlternarFavorito }) {
  const disponible = producto.stock > 0;
  return (
    <TouchableOpacity
      style={estilos.tarjeta}
      activeOpacity={0.85}
      onPress={() => alAbrir(producto)}
    >
      <View
        style={[
          estilos.tarjetaImagen,
          { backgroundColor: TINTE_CATEGORIA[producto.categoria] },
        ]}
      >
        <ImagenProducto producto={producto} radio={10} tamanoIcono={30} />
        <TouchableOpacity
          style={estilos.corazon}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => alAlternarFavorito(producto.id)}
        >
          <MaterialCommunityIcons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={20}
            color={esFavorito ? COLORES.acento : COLORES.texto}
          />
        </TouchableOpacity>
      </View>
      <Text style={estilos.tarjetaNombre} numberOfLines={2}>
        {producto.nombre}
      </Text>
      <Text style={estilos.tarjetaPrecio}>{formatearCOP(producto.precio)}</Text>
      <View style={estilos.etiqueta}>
        <Text
          style={estilos.etiquetaTexto}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.85}
        >
          {producto.categoria}
        </Text>
      </View>
      <View style={estilos.disponibilidadFila}>
        <View
          style={[
            estilos.punto,
            { backgroundColor: disponible ? COLORES.disponible : COLORES.agotado },
          ]}
        />
        <Text
          style={[
            estilos.disponibilidadTexto,
            { color: disponible ? COLORES.disponible : COLORES.agotado },
          ]}
        >
          {disponible ? 'Disponible' : 'Agotado'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function BarraNavegacion({ seccionActiva, alCambiar }) {
  return (
    <View style={estilos.barra}>
      {SECCIONES.map((s, indice) => {
        const activa = s.clave === seccionActiva;
        const color = activa ? COLORES.acento : COLORES.texto;
        return (
          <View key={s.clave} style={estilos.barraItemContenedor}>
            {indice > 0 && <View style={estilos.barraSeparador} />}
            <TouchableOpacity style={estilos.barraItem} onPress={() => alCambiar(s.clave)}>
              <MaterialCommunityIcons
                name={activa ? s.iconoActivo : s.icono}
                size={24}
                color={color}
              />
              <Text style={[estilos.barraTexto, { color }]}>{s.etiqueta}</Text>
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
      {[1, 2, 3, 4, 5].map((n) => {
        let nombre = 'star-outline';
        if (valor >= n) nombre = 'star';
        else if (valor >= n - 0.5) nombre = 'star-half-full';
        return <MaterialCommunityIcons key={n} name={nombre} size={22} color={COLORES.acento} />;
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

function PantallaDetalle({
  producto,
  esFavorito,
  alAlternarFavorito,
  alAgregar,
  resenas,
  valorResena,
  errorResena,
  alCambiarResena,
  alEnviarResena,
}) {
  const disponible = producto.stock > 0;
  const promedio = calcularPromedio(resenas);
  const cantidadResenas = resenas.length;
  const textoStock =
    producto.stock === 1 ? 'Stock: 1 unidad' : 'Stock: ' + producto.stock + ' unidades';
  return (
    <ScrollView contentContainerStyle={estilos.detalle}>
      <View
        style={[
          estilos.detalleImagen,
          { backgroundColor: TINTE_CATEGORIA[producto.categoria] },
        ]}
      >
        <ImagenProducto producto={producto} radio={14} tamanoIcono={48} />
        <TouchableOpacity
          style={estilos.detalleCorazon}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          onPress={() => alAlternarFavorito(producto.id)}
        >
          <MaterialCommunityIcons
            name={esFavorito ? 'heart' : 'heart-outline'}
            size={26}
            color={esFavorito ? COLORES.acento : COLORES.texto}
          />
        </TouchableOpacity>
      </View>
      <Text style={estilos.detalleNombre}>{producto.nombre}</Text>
      <View style={[estilos.etiqueta, estilos.detalleEtiqueta]}>
        <Text style={estilos.detalleEtiquetaTexto}>{producto.categoria}</Text>
      </View>
      <Text style={estilos.detallePrecio}>{formatearCOP(producto.precio)}</Text>
      <View style={estilos.disponibilidadFila}>
        <View
          style={[
            estilos.punto,
            { backgroundColor: disponible ? COLORES.disponible : COLORES.agotado },
          ]}
        />
        <Text
          style={[
            estilos.detalleStock,
            { color: disponible ? COLORES.texto : COLORES.agotado },
          ]}
        >
          {disponible ? textoStock : 'Agotado'}
        </Text>
      </View>
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
      <TouchableOpacity
        style={[estilos.botonAgregar, !disponible && estilos.botonAgregarInactivo]}
        disabled={!disponible}
        onPress={() => alAgregar(producto)}
      >
        <MaterialCommunityIcons name="cart-outline" size={22} color={COLORES.blanco} />
        <Text style={estilos.botonAgregarTexto}>
          {disponible ? 'Agregar al carrito' : 'Agotado'}
        </Text>
      </TouchableOpacity>
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
        data={productos.filter((p) => favoritos.includes(p.id))}
        favoritos={favoritos}
        alAbrir={alAbrir}
        alAlternar={alAlternar}
        vacio={
          <EstadoVacio
            icono="heart-outline"
            titulo="Aún no tienes favoritos"
            texto="Toca el corazón de un producto para guardarlo aquí."
            textoBoton="Ir al catálogo"
            alBoton={alIrCatalogo}
          />
        }
      />
    </View>
  );
}

function LineaCarrito({ linea, alMas, alMenos, alEliminar }) {
  const p = linea.producto;
  return (
    <View style={estilos.linea}>
      <View style={[estilos.lineaImagen, { backgroundColor: TINTE_CATEGORIA[p.categoria] }]}>
        <ImagenProducto producto={p} radio={10} tamanoIcono={26} />
      </View>
      <View style={estilos.lineaDatos}>
        <Text style={estilos.lineaNombre} numberOfLines={2}>
          {p.nombre}
        </Text>
        <Text style={estilos.lineaPrecio}>{formatearCOP(p.precio)}</Text>
        <View style={estilos.cantidad}>
          <TouchableOpacity style={estilos.cantidadBoton} onPress={() => alMenos(p.id)}>
            <MaterialCommunityIcons name="minus" size={18} color={COLORES.texto} />
          </TouchableOpacity>
          <Text style={estilos.cantidadTexto}>{linea.cantidad}</Text>
          <TouchableOpacity style={estilos.cantidadBoton} onPress={() => alMas(p.id)}>
            <MaterialCommunityIcons name="plus" size={18} color={COLORES.texto} />
          </TouchableOpacity>
        </View>
      </View>
      <View style={estilos.lineaSeparador} />
      <TouchableOpacity style={estilos.eliminar} onPress={() => alEliminar(p.id)}>
        <MaterialCommunityIcons name="trash-can-outline" size={22} color={COLORES.gris} />
        <Text style={estilos.eliminarTexto}>Eliminar</Text>
      </TouchableOpacity>
    </View>
  );
}

function PantallaCarrito({
  lineas,
  subtotal,
  envio,
  total,
  alMas,
  alMenos,
  alEliminar,
  alContinuar,
  alIrCatalogo,
  codigoCupon,
  alCambiarCupon,
  alAplicarCupon,
  cuponAplicado,
  descuento,
}) {
  const vacio = lineas.length === 0;
  return (
    <ScrollView
      contentContainerStyle={estilos.carritoScroll}
      keyboardShouldPersistTaps="handled"
    >
      <TituloPantalla icono="cart-outline" texto="Tu carrito" />
      {vacio ? (
        <EstadoVacio
          estilo={estilos.carritoVacio}
          icono="cart-outline"
          titulo="Tu carrito está vacío"
          texto="Agrega productos desde el catálogo."
          textoBoton="Ir al catálogo"
          alBoton={alIrCatalogo}
        />
      ) : (
        lineas.map((l) => (
          <LineaCarrito
            key={l.id}
            linea={l}
            alMas={alMas}
            alMenos={alMenos}
            alEliminar={alEliminar}
          />
        ))
      )}
      <View style={estilos.cuponFila}>
        <View style={estilos.cuponCampo}>
          <MaterialCommunityIcons name="ticket-percent-outline" size={22} color={COLORES.gris} />
          <TextInput
            style={estilos.cuponInput}
            placeholder="¿Tienes un cupón?"
            placeholderTextColor={COLORES.gris}
            value={codigoCupon}
            onChangeText={alCambiarCupon}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        </View>
        <TouchableOpacity style={estilos.cuponBoton} onPress={alAplicarCupon}>
          <Text style={estilos.cuponBotonTexto}>Aplicar</Text>
        </TouchableOpacity>
      </View>
      <BloqueResumen
        estilo={estilos.resumen}
        subtotal={subtotal}
        descuento={descuento}
        etiquetaDescuento={'Descuento (' + cuponAplicado + ')'}
        envio={envio}
        total={total}
        vacio={vacio}
      />
      <TouchableOpacity
        style={[estilos.botonContinuar, vacio && estilos.botonAgregarInactivo]}
        disabled={vacio}
        onPress={alContinuar}
      >
        <Text style={estilos.botonAgregarTexto}>Continuar compra</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function EstadoVacio({ icono, titulo, texto, textoBoton, alBoton, estilo }) {
  return (
    <View style={estilo || estilos.vacio}>
      {icono && (
        <View style={estilos.vacioIcono}>
          <MaterialCommunityIcons name={icono} size={34} color={COLORES.apoyo} />
        </View>
      )}
      <Text style={estilos.vacioTitulo}>{titulo}</Text>
      <Text style={estilos.vacioTexto}>{texto}</Text>
      {textoBoton && (
        <TouchableOpacity style={estilos.botonIr} onPress={alBoton}>
          <Text style={estilos.botonIrTexto}>{textoBoton}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function CuadriculaProductos({ data, favoritos, alAbrir, alAlternar, vacio, pie }) {
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
        />
      )}
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

function BloqueResumen({ subtotal, descuento = 0, envio, total, estilo, etiquetaDescuento = 'Descuento', vacio = false }) {
  const gratis = !vacio && envio === 0;
  return (
    <View style={estilo || estilos.bloque}>
      <View style={estilos.resumenFila}>
        <Text style={estilos.resumenEtiqueta}>Subtotal</Text>
        <Text style={estilos.resumenValor}>{formatearCOP(subtotal)}</Text>
      </View>
      {descuento > 0 && (
        <View style={estilos.resumenFila}>
          <Text style={estilos.resumenEtiqueta}>{etiquetaDescuento}</Text>
          <Text style={[estilos.resumenValor, { color: COLORES.disponible }]}>
            {'-' + formatearCOP(descuento)}
          </Text>
        </View>
      )}
      <View style={estilos.resumenFila}>
        <Text style={estilos.resumenEtiqueta}>Envío</Text>
        <Text style={[estilos.resumenValor, gratis && { color: COLORES.disponible }]}>
          {gratis ? 'Gratis' : formatearCOP(envio)}
        </Text>
      </View>
      <View style={estilos.resumenLinea} />
      <View style={estilos.resumenFila}>
        <Text style={estilos.resumenTotalEtiqueta}>Total</Text>
        <Text style={estilos.resumenTotalValor}>{formatearCOP(total)}</Text>
      </View>
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

function CampoFormulario({ etiqueta, valor, alCambiar, error, placeholder, teclado }) {
  return (
    <View style={estilos.campo}>
      <Text style={estilos.campoEtiqueta}>{etiqueta}</Text>
      <TextInput
        style={[estilos.campoInput, error && estilos.campoInputError]}
        value={valor}
        onChangeText={alCambiar}
        placeholder={placeholder}
        placeholderTextColor={COLORES.gris}
        keyboardType={teclado || 'default'}
      />
      {error ? <Text style={estilos.campoError}>{error}</Text> : null}
    </View>
  );
}

const CAMPOS_COMPRADOR = [
  ['nombre', 'Nombre completo', 'Ej.: Laura Gómez'],
  ['telefono', 'Teléfono', 'Ej.: 3001234567', 'phone-pad'],
  ['municipio', 'Municipio', 'Ej.: Mosquera'],
  ['direccion', 'Dirección', 'Ej.: Calle 5 # 10-20'],
];

function DatosEntrega({ comprador }) {
  return (
    <View style={estilos.bloque}>
      <Text style={estilos.bloqueTitulo}>Datos de entrega</Text>
      <FilaDato etiqueta="Nombre" valor={comprador.nombre.trim()} />
      <FilaDato etiqueta="Teléfono" valor={comprador.telefono.trim()} />
      <FilaDato etiqueta="Municipio" valor={comprador.municipio.trim()} />
      <FilaDato etiqueta="Dirección" valor={comprador.direccion.trim()} />
    </View>
  );
}

function PantallaDatos({ comprador, errores, alCambiar, alContinuar }) {
  return (
    <KeyboardAvoidingView
      style={estilos.seccion}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
        <TituloPantalla icono="account-outline" texto="Datos de entrega" />
        {CAMPOS_COMPRADOR.map(([campo, etiqueta, placeholder, teclado]) => (
          <CampoFormulario
            key={campo}
            etiqueta={etiqueta}
            valor={comprador[campo]}
            alCambiar={(v) => alCambiar(campo, v)}
            error={errores[campo]}
            placeholder={placeholder}
            teclado={teclado}
          />
        ))}
        <NotaSimulacion texto="Es un ejercicio académico: no pedimos tarjetas, contraseñas ni documentos." />
        <TouchableOpacity style={estilos.botonContinuar} onPress={alContinuar}>
          <Text style={estilos.botonAgregarTexto}>Continuar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PantallaRevision({ lineas, comprador, subtotal, descuento, envio, total, alConfirmar }) {
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="clipboard-check-outline" texto="Revisa tu pedido" />
      <DatosEntrega comprador={comprador} />
      <View style={estilos.bloque}>
        <Text style={estilos.bloqueTitulo}>Productos</Text>
        {lineas.map((l) => (
          <FilaDato
            key={l.id}
            etiqueta={l.cantidad + ' × ' + l.producto.nombre}
            valor={formatearCOP(l.cantidad * l.producto.precio)}
          />
        ))}
      </View>
      <BloqueResumen subtotal={subtotal} descuento={descuento} envio={envio} total={total} />
      <NotaSimulacion texto="Esto es una simulación: no se realiza ningún cobro real." />
      <TouchableOpacity style={estilos.botonContinuar} onPress={alConfirmar}>
        <Text style={estilos.botonAgregarTexto}>Confirmar compra</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PantallaConfirmacion({ pedido, alVerHistorial, alSeguir }) {
  return (
    <ScrollView contentContainerStyle={estilos.confirmacion}>
      <View style={estilos.vacioIcono}>
        <MaterialCommunityIcons name="check-circle-outline" size={40} color={COLORES.apoyo} />
      </View>
      <Text style={estilos.vacioTitulo}>¡Pedido confirmado!</Text>
      <View style={estilos.codigoChip}>
        <Text style={estilos.codigoTexto}>{pedido.codigo}</Text>
      </View>
      <Text style={estilos.vacioTexto}>Total del pedido: {formatearCOP(pedido.total)}</Text>
      <NotaSimulacion texto="Esto es una simulación: no se realizó ningún cobro real." />
      <TouchableOpacity style={estilos.botonIr} onPress={alVerHistorial}>
        <Text style={estilos.botonIrTexto}>Ver historial</Text>
      </TouchableOpacity>
      <TouchableOpacity style={estilos.botonSecundario} onPress={alSeguir}>
        <Text style={estilos.botonSecundarioTexto}>Seguir comprando</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function PantallaHistorial({ pedidos, alAbrir, alIrCatalogo }) {
  return (
    <View style={estilos.seccion}>
      <TituloPantalla icono="history" texto="Historial" />
      <FlatList
        data={pedidos}
        keyExtractor={(item) => item.codigo}
        contentContainerStyle={estilos.carritoScroll}
        renderItem={({ item }) => (
          <TouchableOpacity style={estilos.pedidoTarjeta} onPress={() => alAbrir(item)}>
            <View style={{ flex: 1 }}>
              <Text style={estilos.pedidoCodigo}>{item.codigo}</Text>
              <Text style={estilos.pedidoFecha}>{item.fecha}</Text>
            </View>
            <Text style={estilos.pedidoTotal}>{formatearCOP(item.total)}</Text>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORES.gris} />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <EstadoVacio
            icono="history"
            titulo="Aún no tienes pedidos registrados"
            texto="Cuando confirmes una compra aparecerá aquí."
            textoBoton="Ir al catálogo"
            alBoton={alIrCatalogo}
          />
        }
      />
    </View>
  );
}

function PantallaPedido({ pedido }) {
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="receipt-text-outline" texto={pedido.codigo} />
      <Text style={estilos.pedidoFechaDetalle}>{pedido.fecha}</Text>
      <View style={estilos.bloque}>
        <Text style={estilos.bloqueTitulo}>Productos</Text>
        {pedido.lineas.map((l) => (
          <FilaDato
            key={l.id}
            etiqueta={l.cantidad + ' × ' + l.nombre + ' (' + formatearCOP(l.precio) + ' c/u)'}
            valor={formatearCOP(l.cantidad * l.precio)}
          />
        ))}
      </View>
      <BloqueResumen subtotal={pedido.subtotal} descuento={pedido.descuento || 0} envio={pedido.envio} total={pedido.total} />
      <DatosEntrega comprador={pedido.comprador} />
      <NotaSimulacion texto="Pedido de simulación: no se realizó ningún cobro real." />
    </ScrollView>
  );
}

function PanelLista({ productos, alEditar, alNuevo }) {
  return (
    <ScrollView contentContainerStyle={estilos.carritoScroll}>
      <TituloPantalla icono="storefront-outline" texto="Panel de vendedor" />
      <TouchableOpacity
        style={[estilos.botonContinuar, { marginTop: 0, marginBottom: 12 }]}
        onPress={alNuevo}
      >
        <Text style={estilos.botonAgregarTexto}>Nuevo producto</Text>
      </TouchableOpacity>
      {productos.map((p) => (
        <View key={p.id} style={estilos.pedidoTarjeta}>
          <View style={{ flex: 1 }}>
            <Text style={estilos.pedidoCodigo} numberOfLines={1}>
              {p.nombre}
            </Text>
            <Text style={estilos.pedidoFecha}>
              {p.id + ' · ' + formatearCOP(p.precio) + ' · Stock ' + p.stock}
            </Text>
          </View>
          <TouchableOpacity style={estilos.botonEditar} onPress={() => alEditar(p)}>
            <Text style={estilos.botonEditarTexto}>Editar</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const CAMPOS_PRODUCTO = [
  ['precio', 'Precio (COP)', 'Ej.: 120000', 'number-pad'],
  ['stock', 'Stock', 'Ej.: 10', 'number-pad'],
  ['descripcion', 'Descripción', 'Mínimo 15 caracteres'],
];

function PanelFormulario({ form, errores, editando, alCambiar, alGuardar }) {
  return (
    <KeyboardAvoidingView
      style={estilos.seccion}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={estilos.carritoScroll} keyboardShouldPersistTaps="handled">
        <TituloPantalla
          icono="storefront-outline"
          texto={editando ? 'Editar producto' : 'Nuevo producto'}
        />
        <CampoFormulario
          etiqueta="Nombre"
          valor={form.nombre}
          alCambiar={(v) => alCambiar('nombre', v)}
          error={errores.nombre}
          placeholder="Ej.: Gorra urbana"
        />
        <View style={estilos.campo}>
          <Text style={estilos.campoEtiqueta}>Categoría</Text>
          <View style={estilos.chipsFormulario}>
            {CATEGORIAS_FILTRO.slice(1).map((c) => (
              <TouchableOpacity
                key={c}
                style={[estilos.chip, form.categoria === c && estilos.chipActivo]}
                onPress={() => alCambiar('categoria', c)}
              >
                <Text style={[estilos.chipTexto, form.categoria === c && estilos.chipTextoActivo]}>
                  {c}
                </Text>
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
            alCambiar={(v) => alCambiar(campo, v)}
            error={errores[campo]}
            placeholder={placeholder}
            teclado={teclado}
          />
        ))}
        <TouchableOpacity style={estilos.botonContinuar} onPress={alGuardar}>
          <Text style={estilos.botonAgregarTexto}>Guardar producto</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function MensajeVacio({ hayProductos, alLimpiar }) {
  return (
    <EstadoVacio
      titulo={hayProductos ? 'No encontramos productos' : 'No hay productos disponibles'}
      texto={
        hayProductos
          ? 'Prueba con otra palabra o con otra categoría.'
          : 'Por ahora el catálogo está vacío. Vuelve a intentarlo más tarde.'
      }
      textoBoton={hayProductos ? 'Limpiar búsqueda' : null}
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
  const [seccion, setSeccion] = useState('catalogo');
  const [productoSeleccionado, setProductoSeleccionado] = useState(null);
  const [favoritos, setFavoritos] = useState([]);
  const [carrito, setCarrito] = useState([]);
  const [aviso, setAviso] = useState(null);
  const [flujo, setFlujo] = useState(null); // null | 'datos' | 'revision' | 'confirmado'
  const [pedidos, setPedidos] = useState([]);
  const [pedidoSeleccionado, setPedidoSeleccionado] = useState(null);
  const [pedidoConfirmado, setPedidoConfirmado] = useState(null);
  const [comprador, setComprador] = useState({
    nombre: '',
    telefono: '',
    municipio: '',
    direccion: '',
  });
  const [errores, setErrores] = useState({});
  const [codigoCupon, setCodigoCupon] = useState('');
  const [cuponAplicado, setCuponAplicado] = useState(null);
  const [resenas, setResenas] = useState(RESENAS_INICIALES);
  const [valorResena, setValorResena] = useState('');
  const [errorResena, setErrorResena] = useState(null);
  const [datosCargados, setDatosCargados] = useState(false);
  const [panel, setPanel] = useState(null); // null | 'lista' | 'formulario'
  const [productoEdicion, setProductoEdicion] = useState(null);
  const [formProducto, setFormProducto] = useState(FORMULARIO_VACIO);
  const [erroresProducto, setErroresProducto] = useState({});
  // Persistencia local (HU20): se recuperan carrito y favoritos al abrir la app
  useEffect(() => {
    async function cargarDatos() {
      try {
        const guardado = await AsyncStorage.getItem('bifrost_datos');
        if (guardado) {
          const datos = JSON.parse(guardado);
          const idsValidos = PRODUCTOS_INICIALES.map((p) => p.id);
          const carritoValido = Array.isArray(datos.carrito)
            ? datos.carrito.filter((l) => {
                const p = PRODUCTOS_INICIALES.find((x) => x.id === l.id);
                return p && Number.isInteger(l.cantidad) && l.cantidad >= 1 && l.cantidad <= p.stock;
              })
            : [];
          const favoritosValidos = Array.isArray(datos.favoritos)
            ? datos.favoritos.filter((id) => idsValidos.includes(id))
            : [];
          setCarrito(carritoValido);
          setFavoritos(favoritosValidos);
        }
      } catch (error) {
        // Si los datos guardados están dañados, se usa el estado inicial
      }
      setDatosCargados(true);
    }
    cargarDatos();
  }, []);
  useEffect(() => {
    if (!datosCargados) {
      return;
    }
    AsyncStorage.setItem('bifrost_datos', JSON.stringify({ carrito, favoritos })).catch(() => {});
  }, [carrito, favoritos, datosCargados]);
  if (!fuentesListas) {
    return null;
  }
  // Búsqueda + categoría + orden, aplicados juntos
  const textoBusqueda = busqueda.trim().toLowerCase();
  const productosVisibles = productos
    .filter((p) => categoriaActiva === 'Todas' || p.categoria === categoriaActiva)
    .filter((p) => p.nombre.toLowerCase().includes(textoBusqueda))
    .sort((a, b) => (orden === 'asc' ? a.precio - b.precio : b.precio - a.precio));
  function mostrarAviso(texto, tipo = 'info') {
    setAviso({ texto, tipo });
    setTimeout(() => setAviso(null), 2200);
  }
  function agregarAlCarrito(producto) {
    if (producto.stock <= 0) {
      mostrarAviso('Este producto está agotado.', 'error');
      return;
    }
    const linea = carrito.find((l) => l.id === producto.id);
    if (linea && linea.cantidad >= producto.stock) {
      mostrarAviso('Ya tienes en el carrito todas las unidades disponibles.', 'error');
      return;
    }
    if (linea) {
      setCarrito(
        carrito.map((l) => (l.id === producto.id ? { ...l, cantidad: l.cantidad + 1 } : l))
      );
    } else {
      setCarrito([...carrito, { id: producto.id, cantidad: 1 }]);
    }
    mostrarAviso('Producto agregado al carrito.');
  }
  function aumentarCantidad(id) {
    const producto = productos.find((p) => p.id === id);
    const linea = carrito.find((l) => l.id === id);
    if (linea.cantidad >= producto.stock) {
      mostrarAviso('Solo hay ' + textoUnidades(producto.stock) + ' disponibles.', 'error');
      return;
    }
    setCarrito(carrito.map((l) => (l.id === id ? { ...l, cantidad: l.cantidad + 1 } : l)));
  }
  function eliminarDelCarrito(id) {
    setCarrito(carrito.filter((l) => l.id !== id));
    mostrarAviso('Producto eliminado del carrito.');
  }
  function disminuirCantidad(id) {
    const linea = carrito.find((l) => l.id === id);
    if (linea.cantidad <= 1) {
      eliminarDelCarrito(id);
      return;
    }
    setCarrito(carrito.map((l) => (l.id === id ? { ...l, cantidad: l.cantidad - 1 } : l)));
  }
  const lineasCarrito = carrito.map((l) => ({
    ...l,
    producto: productos.find((p) => p.id === l.id),
  }));
  const subtotal = lineasCarrito.reduce((suma, l) => suma + l.cantidad * l.producto.precio, 0);
  const envio = subtotal === 0 ? 0 : subtotal < UMBRAL_ENVIO_GRATIS ? COSTO_ENVIO : 0;
  const descuento = cuponAplicado ? Math.round(subtotal * CUPONES[cuponAplicado]) : 0;
  const total = subtotal - descuento + envio;
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
    if (errores[campo]) {
      setErrores({ ...errores, [campo]: null });
    }
  }
  function validarDatos() {
    const nuevos = {};
    if (comprador.nombre.trim() === '') {
      nuevos.nombre = 'Falta tu nombre.';
    }
    if (comprador.telefono.trim() === '') {
      nuevos.telefono = 'Falta tu teléfono.';
    } else if (!/^[0-9+\s-]{7,15}$/.test(comprador.telefono.trim())) {
      nuevos.telefono = 'Escribe un teléfono válido (solo números, mínimo 7 dígitos).';
    }
    if (comprador.municipio.trim() === '') {
      nuevos.municipio = 'Falta tu municipio.';
    }
    if (comprador.direccion.trim() === '') {
      nuevos.direccion = 'Falta tu dirección.';
    }
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) {
      mostrarAviso('Revisa los campos marcados.', 'error');
      return;
    }
    setFlujo('revision');
  }
  function confirmarPedido() {
    // Se verifica el stock de TODAS las líneas antes de descontar algo
    const sinStock = lineasCarrito.find((l) => l.cantidad > l.producto.stock);
    if (sinStock) {
      mostrarAviso('No hay stock suficiente de ' + sinStock.producto.nombre + '. Ajusta tu carrito.', 'error');
      setFlujo(null);
      setSeccion('carrito');
      return;
    }
    const pedido = {
      codigo: 'PED-' + String(pedidos.length + 1).padStart(4, '0'),
      fecha: formatearFecha(new Date()),
      comprador: { ...comprador },
      lineas: lineasCarrito.map((l) => ({
        id: l.id,
        nombre: l.producto.nombre,
        cantidad: l.cantidad,
        precio: l.producto.precio,
      })),
      subtotal: subtotal,
      descuento: descuento,
      envio: envio,
      total: total,
    };
    setProductos(
      productos.map((p) => {
        const linea = carrito.find((l) => l.id === p.id);
        return linea ? { ...p, stock: p.stock - linea.cantidad } : p;
      })
    );
    setPedidos([pedido, ...pedidos]);
    setCarrito([]);
    setCuponAplicado(null);
    setCodigoCupon('');
    setPedidoConfirmado(pedido);
    setFlujo('confirmado');
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
    setResenas({ ...resenas, [idProducto]: [...(resenas[idProducto] || []), numero] });
    setValorResena('');
    setErrorResena(null);
    mostrarAviso('¡Gracias por tu reseña!');
  }
  function abrirNuevoProducto() {
    setProductoEdicion(null);
    setFormProducto(FORMULARIO_VACIO);
    setErroresProducto({});
    setPanel('formulario');
  }
  function abrirEditarProducto(p) {
    setProductoEdicion(p);
    setFormProducto({
      nombre: p.nombre,
      categoria: p.categoria,
      precio: String(p.precio),
      stock: String(p.stock),
      descripcion: p.descripcion,
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
    if (nombre === '') {
      nuevos.nombre = 'Falta el nombre del producto.';
    }
    if (formProducto.categoria === '') {
      nuevos.categoria = 'Elige una categoría.';
    }
    if (textoPrecio === '' || !Number.isInteger(precio) || precio <= 0) {
      nuevos.precio = 'El precio debe ser un número entero mayor que 0.';
    }
    if (textoStock === '' || !Number.isInteger(stock) || stock < 0) {
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
      setProductos(
        productos.map((p) =>
          p.id === productoEdicion.id
            ? { ...p, nombre, categoria: formProducto.categoria, precio, stock, descripcion }
            : p
        )
      );
      mostrarAviso('Producto actualizado.');
    } else {
      const numeros = productos.map((p) => parseInt(p.id.replace('PROD-', ''), 10));
      const siguiente = Math.max(...numeros) + 1;
      const nuevo = {
        id: 'PROD-' + String(siguiente).padStart(3, '0'),
        nombre,
        categoria: formProducto.categoria,
        precio,
        stock,
        descripcion,
      };
      setProductos([...productos, nuevo]);
      setResenas({ ...resenas, [nuevo.id]: [] });
      mostrarAviso('Producto creado.');
    }
    setPanel('lista');
  }
  const bannerAviso = aviso ? (
    <View
      style={[
        estilos.aviso,
        { bottom: productoSeleccionado || flujo || pedidoSeleccionado || panel ? 24 : 96 },
        aviso.tipo === 'error' && { backgroundColor: COLORES.agotado },
      ]}
    >
      <Text style={estilos.avisoTexto}>{aviso.texto}</Text>
    </View>
  ) : null;
  function alternarFavorito(id) {
    setFavoritos((actuales) =>
      actuales.includes(id) ? actuales.filter((x) => x !== id) : [...actuales, id]
    );
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
          alAbrir={setPedidoSeleccionado}
          alIrCatalogo={() => setSeccion('catalogo')}
        />
      );
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
          vacio={
            <MensajeVacio
              hayProductos={productos.length > 0}
              alLimpiar={() => {
                setBusqueda('');
                setCategoriaActiva('Todas');
              }}
            />
          }
          pie={
            <TouchableOpacity style={estilos.enlaceVendedor} onPress={() => setPanel('lista')}>
              <MaterialCommunityIcons name="storefront-outline" size={18} color={COLORES.gris} />
              <Text style={estilos.enlaceVendedorTexto}>Panel de vendedor</Text>
            </TouchableOpacity>
          }
        />
      </View>
    );
  }
  if (panel) {
    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={() => setPanel(panel === 'formulario' ? 'lista' : null)} />
        <Encabezado />
        {panel === 'lista' && (
          <PanelLista
            productos={productos}
            alEditar={abrirEditarProducto}
            alNuevo={abrirNuevoProducto}
          />
        )}
        {panel === 'formulario' && (
          <PanelFormulario
            form={formProducto}
            errores={erroresProducto}
            editando={productoEdicion !== null}
            alCambiar={cambiarCampoProducto}
            alGuardar={guardarProducto}
          />
        )}
        {bannerAviso}
      </View>
    );
  }
  if (productoSeleccionado) {
    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={() => setProductoSeleccionado(null)} />
        <Encabezado />
        <PantallaDetalle
          producto={productos.find((p) => p.id === productoSeleccionado.id)}
          esFavorito={favoritos.includes(productoSeleccionado.id)}
          alAlternarFavorito={alternarFavorito}
          alAgregar={agregarAlCarrito}
          resenas={resenas[productoSeleccionado.id] || []}
          valorResena={valorResena}
          errorResena={errorResena}
          alCambiarResena={setValorResena}
          alEnviarResena={enviarResena}
        />
        {bannerAviso}
      </View>
    );
  }
  if (flujo) {
    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        {flujo === 'datos' && <FilaVolver alVolver={() => setFlujo(null)} />}
        {flujo === 'revision' && <FilaVolver alVolver={() => setFlujo('datos')} />}
        <Encabezado />
        {flujo === 'datos' && (
          <PantallaDatos
            comprador={comprador}
            errores={errores}
            alCambiar={cambiarDato}
            alContinuar={validarDatos}
          />
        )}
        {flujo === 'revision' && (
          <PantallaRevision
            lineas={lineasCarrito}
            comprador={comprador}
            subtotal={subtotal}
            descuento={descuento}
            envio={envio}
            total={total}
            alConfirmar={confirmarPedido}
          />
        )}
        {flujo === 'confirmado' && (
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
        )}
        {bannerAviso}
      </View>
    );
  }
  if (pedidoSeleccionado) {
    return (
      <View style={estilos.contenedor}>
        <BarraEstado style="dark" />
        <FilaVolver alVolver={() => setPedidoSeleccionado(null)} />
        <Encabezado />
        <PantallaPedido pedido={pedidoSeleccionado} />
        {bannerAviso}
      </View>
    );
  }
  return (
    <View style={estilos.contenedor}>
      <BarraEstado style="dark" />
      <Encabezado />
      <View style={estilos.seccion}>{renderSeccion()}</View>
      <BarraNavegacion seccionActiva={seccion} alCambiar={setSeccion} />
      {seccion === 'carrito' && (
        <TouchableOpacity style={estilos.flechaCarrito} onPress={() => setSeccion('catalogo')}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={COLORES.texto} />
        </TouchableOpacity>
      )}
      {bannerAviso}
    </View>
  );
}

// ---------- ESTILOS ----------
const MARGEN_SUPERIOR = Platform.OS === 'android' ? StatusBar.currentHeight || 24 : 50;

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
  detalleStock: { fontFamily: FUENTE.media, fontSize: 13 },
  calificacionFila: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  estrellas: { flexDirection: 'row' },
  calificacionTexto: { fontFamily: FUENTE.media, fontSize: 15, color: COLORES.texto, marginLeft: 8 },
  detalleLinea: { height: 1, backgroundColor: COLORES.borde, marginTop: 12 },
  detalleDescripcion: { fontFamily: FUENTE.normal, fontSize: 14, lineHeight: 21, color: COLORES.texto, marginTop: 12 },
  botonAgregar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 26, backgroundColor: COLORES.acento, marginTop: 20 },
  botonAgregarInactivo: { backgroundColor: '#C9CCCB' },
  botonAgregarTexto: { fontFamily: FUENTE.semi, fontSize: 16, color: COLORES.blanco },
  campo: { marginHorizontal: 16, marginBottom: 12 },
  campoEtiqueta: { fontFamily: FUENTE.semi, fontSize: 13, color: COLORES.texto, marginBottom: 6 },
  campoInput: { height: 46, paddingHorizontal: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORES.borde, backgroundColor: COLORES.blanco, fontFamily: FUENTE.normal, fontSize: 14, color: COLORES.texto },
  campoInputError: { borderColor: COLORES.agotado },
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
  vacioTitulo: { fontFamily: FUENTE.negrita, fontSize: 17, color: COLORES.texto, marginBottom: 6, textAlign: 'center' },
  vacioTexto: { fontFamily: FUENTE.normal, fontSize: 13, color: COLORES.gris, textAlign: 'center' },
});