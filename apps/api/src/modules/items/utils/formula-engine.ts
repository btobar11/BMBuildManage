import { Parser } from 'expr-eval';

export interface CubicationParams {
  largo?: number;
  ancho?: number;
  alto?: number;
  espesor?: number;
  cantidad?: number;
  area?: number;
  perimetro?: number;
  huecos?: number;
  piezas?: number;
}

export class FormulaEngine {
  static evaluate(formula: string, params: CubicationParams): number {
    if (!formula) return 0;
    
    try {
      const parser = new Parser();
      const expr = parser.parse(formula);
      
      const cleanParams = {
        largo: Number(params.largo) || 0,
        ancho: Number(params.ancho) || 0,
        alto: Number(params.alto) || 0,
        espesor: Number(params.espesor) || 0,
        cantidad: Number(params.cantidad) || 1,
        area: Number(params.area) || 0,
        perimetro: Number(params.perimetro) || 0,
        huecos: Number(params.huecos) || 0,
        piezas: Number(params.piezas) || 1,
      };

      const result = expr.evaluate(cleanParams);
      return isNaN(result) || !isFinite(result) ? 0 : result;
    } catch (error) {
      console.error(`Error evaluating formula [${formula}]:`, error.message);
      return 0;
    }
  }
}
