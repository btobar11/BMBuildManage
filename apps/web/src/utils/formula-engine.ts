import { Parser } from 'expr-eval';

export interface CubicationParams {
  largo?: number;
  ancho?: number;
  alto?: number;
  espesor?: number;
  cantidad?: number;
  area?: number;
  perimetro?: number;
  radio?: number;
  diametro?: number;
  piezas?: number;
}

export const evaluateFormula = (formula: string, params: CubicationParams): number => {
  try {
    const parser = new Parser();
    const expr = parser.parse(formula);
    // Fill missing params with 0 to avoid errors if the formula uses them
    const cleanParams = {
      largo: 0,
      ancho: 0,
      alto: 0,
      espesor: 0,
      cantidad: 1,
      area: 0,
      perimetro: 0,
      radio: 0,
      diametro: 0,
      piezas: 1,
      ...params
    };
    return expr.evaluate(cleanParams);
  } catch (error) {
    console.error('Error evaluating formula:', error);
    return 0;
  }
};

export const DEFAULT_FORMULAS = {
  RADIER: 'area * espesor',
  MURO: 'largo * alto * piezas',
  EXCAVACION: 'largo * ancho * profundidad',
  CERAMICO: 'area * 1.05', // 5% loss
  PINTURA: 'area',
  ZAPATA: 'largo * ancho * alto * piezas',
};
