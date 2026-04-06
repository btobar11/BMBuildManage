"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var supabase_js_1 = require("@supabase/supabase-js");
var dotenv = require("dotenv");
var path_1 = require("path");
// Load .env from apps/api
dotenv.config({ path: (0, path_1.resolve)(__dirname, '.env') });
var supabaseUrl = process.env.SUPABASE_URL;
var supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
}
var supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
    auth: { autoRefreshToken: false, persistSession: false },
});
function seed() {
    return __awaiter(this, void 0, void 0, function () {
        var unitsData, _a, units, unitError, getUnitId, resourcesData, resourceIds, _i, resourcesData_1, res, existing, _b, inserted, error, getResId, apusData, _loop_1, _c, apusData_1, apuDef;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    console.log("Starting Global Library Seeding...");
                    unitsData = [
                        { name: 'Metro Lineal', symbol: 'ml', category: 'length' },
                        { name: 'Metro Cuadrado', symbol: 'm2', category: 'area' },
                        { name: 'Metro Cúbico', symbol: 'm3', category: 'volume' },
                        { name: 'Litro', symbol: 'L', category: 'volume' },
                        { name: 'Kilogramo', symbol: 'kg', category: 'weight' },
                        { name: 'Saco / Bolsa', symbol: 'saco', category: 'unit' },
                        { name: 'Unidad', symbol: 'un', category: 'unit' },
                        { name: 'Global', symbol: 'glb', category: 'global' },
                        { name: 'Hora', symbol: 'hr', category: 'time' },
                        { name: 'Día', symbol: 'dia', category: 'time' },
                        { name: 'Mes', symbol: 'mes', category: 'time' }
                    ];
                    console.log("Upserting Units...");
                    return [4 /*yield*/, supabase
                            .from('units')
                            .upsert(unitsData, { onConflict: 'symbol' })
                            .select()];
                case 1:
                    _a = _d.sent(), units = _a.data, unitError = _a.error;
                    if (unitError)
                        throw new Error("Unit Error: ".concat(unitError.message));
                    getUnitId = function (symbol) { var _a; return (_a = units.find(function (u) { return u.symbol === symbol; })) === null || _a === void 0 ? void 0 : _a.id; };
                    if (!getUnitId('hr')) {
                        throw new Error('Failed to load base units');
                    }
                    resourcesData = [
                        // --- Mano de Obra ---
                        { name: 'Maestro Albañil', type: 'labor', unit_id: getUnitId('hr'), base_price: 6500, category: 'Mano de Obra', company_id: null },
                        { name: 'Ayudante General', type: 'labor', unit_id: getUnitId('hr'), base_price: 4500, category: 'Mano de Obra', company_id: null },
                        { name: 'Maestro Carpintero', type: 'labor', unit_id: getUnitId('hr'), base_price: 6500, category: 'Mano de Obra', company_id: null },
                        { name: 'Maestro Enfierrador', type: 'labor', unit_id: getUnitId('hr'), base_price: 6500, category: 'Mano de Obra', company_id: null },
                        { name: 'Maestro Pintor', type: 'labor', unit_id: getUnitId('hr'), base_price: 6000, category: 'Mano de Obra', company_id: null },
                        { name: 'Maestro Eléctrico', type: 'labor', unit_id: getUnitId('hr'), base_price: 7000, category: 'Mano de Obra', company_id: null },
                        { name: 'Maestro Gafíter', type: 'labor', unit_id: getUnitId('hr'), base_price: 7000, category: 'Mano de Obra', company_id: null },
                        { name: 'Supervisor Técnico', type: 'labor', unit_id: getUnitId('hr'), base_price: 10000, category: 'Mano de Obra Especializada', company_id: null },
                        // --- Materiales Obra Gruesa ---
                        { name: 'Cemento Portland (Saco de 25kg)', type: 'material', unit_id: getUnitId('saco'), base_price: 4500, category: 'Obra Gruesa', company_id: null },
                        { name: 'Arena Fina', type: 'material', unit_id: getUnitId('m3'), base_price: 18000, category: 'Obra Gruesa', company_id: null },
                        { name: 'Arena Gruesa', type: 'material', unit_id: getUnitId('m3'), base_price: 16000, category: 'Obra Gruesa', company_id: null },
                        { name: 'Gravilla', type: 'material', unit_id: getUnitId('m3'), base_price: 18000, category: 'Obra Gruesa', company_id: null },
                        { name: 'Hormigón Premezclado H20', type: 'material', unit_id: getUnitId('m3'), base_price: 85000, category: 'Obra Gruesa', company_id: null },
                        { name: 'Acero Estructural A630 (Barras 12mm)', type: 'material', unit_id: getUnitId('kg'), base_price: 1200, category: 'Enfierradura', company_id: null },
                        { name: 'Acero Estructural A630 (Barras 8mm)', type: 'material', unit_id: getUnitId('kg'), base_price: 1200, category: 'Enfierradura', company_id: null },
                        { name: 'Madera Pino Bruto 2x4" x 3.2m', type: 'material', unit_id: getUnitId('un'), base_price: 3500, category: 'Obra Gruesa', company_id: null },
                        { name: 'Panel OSB 15mm 1.22x2.44m', type: 'material', unit_id: getUnitId('un'), base_price: 14500, category: 'Obra Gruesa', company_id: null },
                        { name: 'Ladrillo Titán', type: 'material', unit_id: getUnitId('un'), base_price: 360, category: 'Albañilería', company_id: null },
                        { name: 'Ladrillo Princesa', type: 'material', unit_id: getUnitId('un'), base_price: 420, category: 'Albañilería', company_id: null },
                        { name: 'Mortero Pega Predosificado 25kg', type: 'material', unit_id: getUnitId('saco'), base_price: 3200, category: 'Albañilería', company_id: null },
                        // --- Materiales Terminaciones ---
                        { name: 'Pintura Esmalte al Agua (Tinetta 15L)', type: 'material', unit_id: getUnitId('un'), base_price: 45000, category: 'Terminaciones', company_id: null },
                        { name: 'Pintura Látex Interior (Tinetta 15L)', type: 'material', unit_id: getUnitId('un'), base_price: 38000, category: 'Terminaciones', company_id: null },
                        { name: 'Pasta Muro Interior (Tineta 25kg)', type: 'material', unit_id: getUnitId('un'), base_price: 18000, category: 'Terminaciones', company_id: null },
                        { name: 'Cerámica de Piso 40x40cm (Caja 2m2)', type: 'material', unit_id: getUnitId('un'), base_price: 14000, category: 'Revestimientos', company_id: null },
                        { name: 'Adhesivo Cerámico Polvo 25kg', type: 'material', unit_id: getUnitId('saco'), base_price: 4500, category: 'Revestimientos', company_id: null },
                        { name: 'Yeso Cartón Standard 15mm 1.22x2.44m', type: 'material', unit_id: getUnitId('un'), base_price: 6800, category: 'Tabiquería', company_id: null },
                        { name: 'Yeso Cartón RH 15mm 1.22x2.44m', type: 'material', unit_id: getUnitId('un'), base_price: 9800, category: 'Tabiquería', company_id: null },
                        { name: 'Montante 60mmx3m x0.85', type: 'material', unit_id: getUnitId('un'), base_price: 2500, category: 'Tabiquería', company_id: null },
                        // --- Materiales Instalaciones ---
                        { name: 'Tubería PVC Sanitario 110mm x 6m', type: 'material', unit_id: getUnitId('un'), base_price: 12000, category: 'Instalación Sanitaria', company_id: null },
                        { name: 'Cable de Cobre THHN 12 AWG (100m)', type: 'material', unit_id: getUnitId('un'), base_price: 65000, category: 'Instalación Eléctrica', company_id: null },
                        { name: 'Tubería Conduit PVC 20mm x 3m', type: 'material', unit_id: getUnitId('un'), base_price: 1200, category: 'Instalación Eléctrica', company_id: null },
                        { name: 'Caja de Derivación Plástica Redonda', type: 'material', unit_id: getUnitId('un'), base_price: 500, category: 'Instalación Eléctrica', company_id: null },
                        { name: 'Módulo Enchufe Doble 10A Bticino', type: 'material', unit_id: getUnitId('un'), base_price: 3500, category: 'Instalación Eléctrica', company_id: null },
                        // --- Equipos ---
                        { name: 'Hormigonera 150L (Arriendo Diario)', type: 'equipment', unit_id: getUnitId('dia'), base_price: 15000, category: 'Maquinaria Menor', company_id: null },
                        { name: 'Vibrador de Inmersión (Arriendo Diario)', type: 'equipment', unit_id: getUnitId('dia'), base_price: 18000, category: 'Maquinaria Menor', company_id: null },
                        { name: 'Herramientas Menores', type: 'equipment', unit_id: getUnitId('glb'), base_price: 500, category: 'Herramientas', company_id: null },
                        { name: 'Andamio Metálico (Cuerpo x Día)', type: 'equipment', unit_id: getUnitId('dia'), base_price: 3500, category: 'Equipamiento Auxiliar', company_id: null },
                    ];
                    console.log("Checking existing Global Resources for UPSERT...");
                    resourceIds = {};
                    _i = 0, resourcesData_1 = resourcesData;
                    _d.label = 2;
                case 2:
                    if (!(_i < resourcesData_1.length)) return [3 /*break*/, 8];
                    res = resourcesData_1[_i];
                    return [4 /*yield*/, supabase
                            .from('resources')
                            .select('id, name')
                            .eq('name', res.name)
                            .is('company_id', null)
                            .maybeSingle()];
                case 3:
                    existing = (_d.sent()).data;
                    if (!existing) return [3 /*break*/, 5];
                    // Update
                    return [4 /*yield*/, supabase.from('resources').update(res).eq('id', existing.id)];
                case 4:
                    // Update
                    _d.sent();
                    resourceIds[res.name] = existing.id;
                    return [3 /*break*/, 7];
                case 5: return [4 /*yield*/, supabase.from('resources').insert([res]).select('id').single()];
                case 6:
                    _b = _d.sent(), inserted = _b.data, error = _b.error;
                    if (error) {
                        console.error("Error inserting resource", res.name, error);
                    }
                    else {
                        resourceIds[res.name] = inserted.id;
                    }
                    _d.label = 7;
                case 7:
                    _i++;
                    return [3 /*break*/, 2];
                case 8:
                    getResId = function (name) {
                        if (!resourceIds[name])
                            throw new Error("Resource missing: ".concat(name));
                        return resourceIds[name];
                    };
                    apusData = [
                        {
                            name: 'Excavación Manual Zanjas para Fundaciones',
                            description: 'Excavación en terreno blando, hasta 1,5m de profundidad.',
                            unit_id: getUnitId('m3'),
                            category: 'Obras Previas y Excavaciones',
                            resources: [
                                { name: 'Ayudante General', type: 'labor', coefficient: 3.5 }, // 3.5 horas por m3
                                { name: 'Herramientas Menores', type: 'equipment', coefficient: 1 },
                            ]
                        },
                        {
                            name: 'Hormigón Tipo H20 para Sobrecimientos',
                            description: 'Hormigón preparado en obra H20 (175 kg/cm2). Incluye materiales y confección.',
                            unit_id: getUnitId('m3'),
                            category: 'Obra Gruesa - Hormigones',
                            resources: [
                                { name: 'Cemento Portland (Saco de 25kg)', type: 'material', coefficient: 12 }, // 300kg por m3
                                { name: 'Arena Gruesa', type: 'material', coefficient: 0.5 },
                                { name: 'Gravilla', type: 'material', coefficient: 0.8 },
                                { name: 'Maestro Albañil', type: 'labor', coefficient: 1.5 },
                                { name: 'Ayudante General', type: 'labor', coefficient: 3 },
                                { name: 'Hormigonera 150L (Arriendo Diario)', type: 'equipment', coefficient: 0.25 },
                                { name: 'Vibrador de Inmersión (Arriendo Diario)', type: 'equipment', coefficient: 0.25 }
                            ]
                        },
                        {
                            name: 'Muro de Albañilería Ladrillo Titán 14cm',
                            description: 'Muro de albañilería tradicional soga, ladrillo tipo titán. Codos y tendeles con mortero premezclado.',
                            unit_id: getUnitId('m2'),
                            category: 'Obra Gruesa - Albañilería',
                            resources: [
                                { name: 'Ladrillo Titán', type: 'material', coefficient: 40 }, // Aprox 40 u/m2 considerando mermas
                                { name: 'Mortero Pega Predosificado 25kg', type: 'material', coefficient: 1.2 }, // 1.2 sacos por m2
                                { name: 'Maestro Albañil', type: 'labor', coefficient: 0.8 },
                                { name: 'Ayudante General', type: 'labor', coefficient: 0.8 },
                                { name: 'Herramientas Menores', type: 'equipment', coefficient: 1 }
                            ]
                        },
                        {
                            name: 'Estuco Interior Muros (Espesor 2.5cm)',
                            description: 'Revoque grueso afina con mortero hecho en obra.',
                            unit_id: getUnitId('m2'),
                            category: 'Terminaciones - Revestimientos',
                            resources: [
                                { name: 'Cemento Portland (Saco de 25kg)', type: 'material', coefficient: 0.35 },
                                { name: 'Arena Fina', type: 'material', coefficient: 0.03 },
                                { name: 'Maestro Albañil', type: 'labor', coefficient: 0.5 },
                                { name: 'Ayudante General', type: 'labor', coefficient: 0.5 },
                            ]
                        },
                        {
                            name: 'Enfierradura Refuerzo Losa A630',
                            description: 'Instalación y dimensionado de enfierradura de losa, amarras.',
                            unit_id: getUnitId('kg'),
                            category: 'Obra Gruesa - Enfierradura',
                            resources: [
                                { name: 'Acero Estructural A630 (Barras 12mm)', type: 'material', coefficient: 1.05 }, // 5% mermas
                                { name: 'Maestro Enfierrador', type: 'labor', coefficient: 0.05 }, // 20 kg por hr -> 0.05 hr/kg
                                { name: 'Ayudante General', type: 'labor', coefficient: 0.05 },
                            ]
                        },
                        {
                            name: 'Tabiquería Yeso Cartón 15mm 1 Cara',
                            description: 'Tabique simple, montantes c/60cm, placa yeso cartón 15mm estándar.',
                            unit_id: getUnitId('m2'),
                            category: 'Terminaciones - Tabiquería',
                            resources: [
                                { name: 'Yeso Cartón Standard 15mm 1.22x2.44m', type: 'material', coefficient: 0.35 }, // 1 placa cubre ~3m2 -> 0.33 + mermas
                                { name: 'Montante 60mmx3m x0.85', type: 'material', coefficient: 0.7 }, // 0.7 por m2 aprox
                                { name: 'Maestro Carpintero', type: 'labor', coefficient: 0.35 },
                                { name: 'Ayudante General', type: 'labor', coefficient: 0.35 },
                            ]
                        },
                        {
                            name: 'Cerámica de Piso 40x40cm',
                            description: 'Provisión e instalación de cerámica de piso interior, pegamento estándar.',
                            unit_id: getUnitId('m2'),
                            category: 'Terminaciones - Pisos',
                            resources: [
                                { name: 'Cerámica de Piso 40x40cm (Caja 2m2)', type: 'material', coefficient: 0.55 }, // Medio paquete por m2 + merma 10%
                                { name: 'Adhesivo Cerámico Polvo 25kg', type: 'material', coefficient: 0.15 }, // Un saco por ~6m2
                                { name: 'Maestro Albañil', type: 'labor', coefficient: 0.8 },
                                { name: 'Ayudante General', type: 'labor', coefficient: 0.4 },
                            ]
                        },
                        {
                            name: 'Empaste y Pintura Interior Látex (2 manos)',
                            description: 'Lijado, 1 mano de pasta muro completa, y 2 manos de látex.',
                            unit_id: getUnitId('m2'),
                            category: 'Terminaciones - Pintura',
                            resources: [
                                { name: 'Pasta Muro Interior (Tineta 25kg)', type: 'material', coefficient: 0.04 }, // Una tineta de 25kg da para ~25m2 
                                { name: 'Pintura Látex Interior (Tinetta 15L)', type: 'material', coefficient: 0.015 }, // Una tinetta ~65m2 en 2 manos
                                { name: 'Maestro Pintor', type: 'labor', coefficient: 0.25 }, // 4 m2 por hora empaste + pintura
                            ]
                        },
                        {
                            name: 'Instalación de Enchufe Doble Completo',
                            description: 'Punto eléctrico incl. tubería conduit (6m), cable 12AWG (18m), caja y módulo Bticino.',
                            unit_id: getUnitId('un'),
                            category: 'Instalaciones - Eléctricas',
                            resources: [
                                { name: 'Tubería Conduit PVC 20mm x 3m', type: 'material', coefficient: 2 },
                                { name: 'Cable de Cobre THHN 12 AWG (100m)', type: 'material', coefficient: 0.18 }, // 18m -> 0.18 de 100m
                                { name: 'Caja de Derivación Plástica Redonda', type: 'material', coefficient: 1 },
                                { name: 'Módulo Enchufe Doble 10A Bticino', type: 'material', coefficient: 1 },
                                { name: 'Maestro Eléctrico', type: 'labor', coefficient: 1.5 },
                            ]
                        },
                        {
                            name: 'Tubería Matriz Alcantarillado PVC 110mm',
                            description: 'Suministro e instalación de tubería 110mm por metro lineal en zanja superficial.',
                            unit_id: getUnitId('ml'),
                            category: 'Instalaciones - Sanitarias',
                            resources: [
                                { name: 'Tubería PVC Sanitario 110mm x 6m', type: 'material', coefficient: 0.17 }, // 1/6 + mermas
                                { name: 'Maestro Gafíter', type: 'labor', coefficient: 0.25 },
                                { name: 'Ayudante General', type: 'labor', coefficient: 0.25 },
                            ]
                        }
                    ];
                    console.log("Checking existing Global APUs for UPSERT...");
                    _loop_1 = function (apuDef) {
                        var existingApu, apuId, _e, inserted, error, links;
                        return __generator(this, function (_f) {
                            switch (_f.label) {
                                case 0: return [4 /*yield*/, supabase
                                        .from('apu_templates')
                                        .select('id')
                                        .eq('name', apuDef.name)
                                        .is('company_id', null)
                                        .maybeSingle()];
                                case 1:
                                    existingApu = (_f.sent()).data;
                                    apuId = existingApu === null || existingApu === void 0 ? void 0 : existingApu.id;
                                    if (!!apuId) return [3 /*break*/, 3];
                                    return [4 /*yield*/, supabase
                                            .from('apu_templates')
                                            .insert([{
                                                name: apuDef.name,
                                                description: apuDef.description,
                                                unit_id: apuDef.unit_id,
                                                category: apuDef.category,
                                                company_id: null
                                            }])
                                            .select('id')
                                            .single()];
                                case 2:
                                    _e = _f.sent(), inserted = _e.data, error = _e.error;
                                    if (error) {
                                        console.error("Error inserting APU", apuDef.name, error);
                                        return [2 /*return*/, "continue"];
                                    }
                                    apuId = inserted.id;
                                    return [3 /*break*/, 6];
                                case 3: 
                                // Update main
                                return [4 /*yield*/, supabase.from('apu_templates').update({
                                        description: apuDef.description,
                                        unit_id: apuDef.unit_id,
                                        category: apuDef.category,
                                    }).eq('id', apuId)];
                                case 4:
                                    // Update main
                                    _f.sent();
                                    // Delete existing connected resources as we will re-insert them cleanly
                                    return [4 /*yield*/, supabase.from('apu_resources').delete().eq('apu_id', apuId)];
                                case 5:
                                    // Delete existing connected resources as we will re-insert them cleanly
                                    _f.sent();
                                    _f.label = 6;
                                case 6:
                                    if (!apuId) return [3 /*break*/, 8];
                                    links = apuDef.resources.map(function (resDef) {
                                        var rid = getResId(resDef.name);
                                        return {
                                            apu_id: apuId,
                                            resource_id: rid,
                                            resource_type: resDef.type,
                                            coefficient: resDef.coefficient
                                        };
                                    });
                                    return [4 /*yield*/, supabase.from('apu_resources').insert(links)];
                                case 7:
                                    _f.sent();
                                    _f.label = 8;
                                case 8: return [2 /*return*/];
                            }
                        });
                    };
                    _c = 0, apusData_1 = apusData;
                    _d.label = 9;
                case 9:
                    if (!(_c < apusData_1.length)) return [3 /*break*/, 12];
                    apuDef = apusData_1[_c];
                    return [5 /*yield**/, _loop_1(apuDef)];
                case 10:
                    _d.sent();
                    _d.label = 11;
                case 11:
                    _c++;
                    return [3 /*break*/, 9];
                case 12:
                    console.log("✅ Global Library Seeding Completed Successfully.");
                    return [2 /*return*/];
            }
        });
    });
}
seed().catch(function (err) {
    console.error("Fatal Seeding Error:", err);
    process.exit(1);
});
