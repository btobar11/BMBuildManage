export interface Region {
  name: string;
  communes: string[];
}

export const chileRegions: Region[] = [
  {
    name: 'Arica y Parinacota',
    communes: ['Arica', 'Camarones', 'Putre', 'General Lagos'],
  },
  {
    name: 'Tarapacá',
    communes: ['Iquique', 'Alto Hospicio', 'Pozo Almonte', 'Pica', 'Huara', 'Camiña', 'Colchane'],
  },
  {
    name: 'Antofagasta',
    communes: ['Antofagasta', 'Mejillones', 'Taltal', 'Calama', 'San Pedro de Atacama', 'Tocopilla', 'María Elena'],
  },
  {
    name: 'Atacama',
    communes: ['Copiapó', 'Caldera', 'Tierra Amarilla', 'Chañaral', 'Diego de Almagro', 'Vallenar', 'Alto del Carmen', 'Freirina', 'Huasco'],
  },
  {
    name: 'Coquimbo',
    communes: ['La Serena', 'Coquimbo', 'Andacollo', 'La Higuera', 'Paihuano', 'Vicuña', 'Illapel', 'Canela', 'Los Vilos', 'Salamanca', 'Ovalle', 'Combarbalá', 'Monte Patria', 'Punitaqui', 'Río Hurtado'],
  },
  {
    name: 'Valparaíso',
    communes: ['Valparaíso', 'Casablanca', 'Concón', 'Juan Fernández', 'Puchuncaví', 'Quintero', 'Viña del Mar', 'Isla de Pascua', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban', 'La Ligua', 'Cabildo', 'Papudo', 'Petorca', 'Zapallar', 'Quillota', 'Calera', 'Hijuelas', 'La Cruz', 'Nogales', 'San Antonio', 'Algarrobo', 'Cabriterico', 'El Quisco', 'El Tabo', 'Santo Domingo', 'San Felipe', 'Catemu', 'Llaillay', 'Panquehue', 'Putaendo', 'Santa María'],
  },
  {
    name: 'Metropolitana',
    communes: ['Santiago', 'Cerrillos', 'Cerro Navia', 'Conchalí', 'El Bosque', 'Estación Central', 'Huechuraba', 'Independencia', 'La Cisterna', 'La Florida', 'La Granja', 'La Pintana', 'La Reina', 'Las Condes', 'Lo Barnechea', 'Lo Espejo', 'Lo Prado', 'Macul', 'Maipú', 'Ñuñoa', 'Pedro Aguirre Cerda', 'Peñalolén', 'Pirque', 'Providencia', 'Pudahuel', 'Quilicura', 'Quinta Normal', 'Recoleta', 'Renca', 'San Joaquín', 'San Miguel', 'San Ramón', 'Vitacura', 'Puente Alto', 'Pirque', 'San José de Maipo', 'Colina', 'Lampa', 'Tiltil', 'San Bernardo', 'Buin', 'Calera de Tango', 'Paine', 'Melipilla', 'Alhué', 'Curacaví', 'María Pinto', 'San Pedro', 'Talagante', 'El Monte', 'Isla de Maipo', 'Padre Hurtado', 'Peñaflor'],
  },
  {
    name: "O'Higgins",
    communes: ['Rancagua', 'Machalí', 'Graneros', 'San Fernando', 'Pichilemu', 'Litueche', 'La Estrella', 'Marchihue', 'Pichilemu', 'Navidad', 'Paredones', 'San Felipe', 'Aconcagua', 'Los Vilos', 'Salamanca', 'Illapel', 'Canela', 'Puerto Ventanas', 'Pichidangui', 'Los Andes', 'Calle Larga', 'Rinconada', 'San Esteban', 'San Felipe', 'Vicuña', 'Paihuano', 'Andacollo'],
  },
  {
    name: 'Maule',
    communes: ['Talca', 'Constitución', 'Curicó', 'Linares', 'Cauquenes', 'San Javier', 'Villa Alegre', 'La Loma', 'Pelarco', 'Retiro', 'Parral', 'San Rafael', 'Sagrada Familia', 'Hualañé', 'Licantén', 'Molina', 'Río Claro', 'San Carlos', 'Coihueco', 'Ñiquén', 'San Fabián', 'Pichaque', 'Pemuco', 'Yumbel', 'Los Ángeles', 'Antuco', 'Santa Bárbara', 'Mulchén', 'Negrete'],
  },
  {
    name: 'Ñuble',
    communes: ['Chillán', 'Chillán Viejo', 'San Carlos', 'San Fabián', 'Ñiquén', 'Pichidegu', 'Pemuco', 'Yumbel', 'Los Ángeles', 'Antuco', 'Santa Bárbara', 'Mulchén', 'Negrete', 'Alto Biobío', 'Quilleco', 'Tucapel'],
  },
  {
    name: 'Biobío',
    communes: ['Concepción', 'Talcahuano', 'San Pedro de la Paz', 'Coronel', 'Lota', 'Tomé', 'Penco', 'Tomé', 'Florida', 'Hualpén', 'Chiguayante', 'San Sebastián', 'La Florida', 'Monte Ágil', 'Nacimiento', 'Los Ángeles', 'Santa Rita', 'Canete', 'Curanilahue', 'Los Álamos', 'Cañete', 'Tirúa'],
  },
  {
    name: 'La Araucanía',
    communes: ['Temuco', 'Padre las Casas', 'Villarrica', 'Pucón', 'Angol', 'Victoria', 'Curacautín', 'Lonquimay', 'Melipeuco', 'Tolhuín', 'Concepción', 'Talcahuano', 'Chillán', 'Los Ángeles'],
  },
  {
    name: 'Los Ríos',
    communes: ['Valdivia', 'La Unión', 'Río Bueno', 'Osorno', 'San Pablo', 'Futrono', 'Lanco', 'Máfil', 'Mariquina', 'Paillaco', 'Pichoy', 'Reumavá', 'Ancu', 'Lican Ray'],
  },
  {
    name: 'Los Lagos',
    communes: ['Puerto Montt', 'Frutillar', 'Llanquihue', 'Puerto Varas', 'Osorno', 'Castro', 'Ancud', 'Quellón', 'Chaitén', 'Futaleufú', 'Palena', 'Chi', 'Maullín', 'Los Muermos', 'Puerto Octay', 'Purranque', 'Río Negro', 'San Juan de la Costa'],
  },
  {
    name: 'Aysén',
    communes: ['Coyhaique', 'Aysén', 'Chile Chico', 'Puyuhuapi', 'Cisnes', 'Guaitecas', 'Tortel', 'Río Ibáñez', 'Cochrane'],
  },
  {
    name: 'Magallanes',
    communes: ['Punta Arenas', 'Puerto Natales', 'Porvenir', 'Timaukel', 'Laguna Blanca', 'San Gregorio', 'Cabo de Hornos', 'Antártica'],
  },
];

export const getCommunesByRegion = (regionName: string): string[] => {
  const region = chileRegions.find((r) => r.name === regionName);
  return region ? region.communes : [];
};

export const getRegionNames = (): string[] => {
  return chileRegions.map((r) => r.name);
};