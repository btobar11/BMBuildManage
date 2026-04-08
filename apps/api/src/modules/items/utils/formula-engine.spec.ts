import { FormulaEngine, CubicationParams } from './formula-engine';

describe('FormulaEngine', () => {
  describe('evaluate', () => {
    it('should return 0 for empty formula', () => {
      const result = FormulaEngine.evaluate('', {});
      expect(result).toBe(0);
    });

    it('should return 0 for null formula', () => {
      const result = FormulaEngine.evaluate(null as any, {});
      expect(result).toBe(0);
    });

    it('should evaluate simple multiplication', () => {
      const params: CubicationParams = { largo: 10, ancho: 5 };
      const result = FormulaEngine.evaluate('largo * ancho', params);
      expect(result).toBe(50);
    });

    it('should evaluate volume calculation: largo * ancho * alto', () => {
      const params: CubicationParams = { largo: 10, ancho: 5, alto: 3 };
      const result = FormulaEngine.evaluate('largo * ancho * alto', params);
      expect(result).toBe(150);
    });

    it('should evaluate with cantidad multiplier', () => {
      const params: CubicationParams = { largo: 10, ancho: 5, cantidad: 3 };
      const result = FormulaEngine.evaluate('largo * ancho * cantidad', params);
      expect(result).toBe(150);
    });

    it('should evaluate area calculation: largo * ancho', () => {
      const params: CubicationParams = { largo: 10, ancho: 5 };
      const result = FormulaEngine.evaluate('largo * ancho', params);
      expect(result).toBe(50);
    });

    it('should evaluate with area parameter', () => {
      const params: CubicationParams = { area: 100, cantidad: 2 };
      const result = FormulaEngine.evaluate('area * cantidad', params);
      expect(result).toBe(200);
    });

    it('should handle perimetro calculation', () => {
      const params: CubicationParams = { largo: 10, ancho: 5 };
      const result = FormulaEngine.evaluate('(largo + ancho) * 2', params);
      expect(result).toBe(30);
    });

    it('should evaluate thickness calculation: area * espesor', () => {
      const params: CubicationParams = { area: 100, espesor: 0.15 };
      const result = FormulaEngine.evaluate('area * espesor', params);
      expect(result).toBe(15);
    });

    it('should handle huecos (holes) subtraction', () => {
      const params: CubicationParams = {
        largo: 10,
        ancho: 5,
        alto: 3,
        huecos: 2,
      };
      const result = FormulaEngine.evaluate(
        'largo * ancho * alto - huecos',
        params,
      );
      expect(result).toBe(148);
    });

    it('should handle piezas (pieces) multiplier', () => {
      const params: CubicationParams = { largo: 2, ancho: 2, piezas: 5 };
      const result = FormulaEngine.evaluate('largo * ancho * piezas', params);
      expect(result).toBe(20);
    });

    it('should return 0 for NaN result', () => {
      const params: CubicationParams = { largo: 10, ancho: 0 };
      const result = FormulaEngine.evaluate('largo / ancho', params);
      expect(result).toBe(0);
    });

    it('should return 0 for Infinity result', () => {
      const params: CubicationParams = { largo: 10, ancho: 0 };
      const result = FormulaEngine.evaluate('largo / ancho * 100', params);
      expect(result).toBe(0);
    });

    it('should return 0 for invalid formula', () => {
      const params: CubicationParams = { largo: 10 };
      const result = FormulaEngine.evaluate('invalid + formula', params);
      expect(result).toBe(0);
    });

    it('should return 0 for formula with missing params', () => {
      const params: CubicationParams = {};
      const result = FormulaEngine.evaluate('largo * ancho * alto', params);
      expect(result).toBe(0);
    });

    it('should handle complex formula', () => {
      const params: CubicationParams = {
        largo: 10,
        ancho: 5,
        alto: 3,
        area: 50,
        cantidad: 2,
      };
      const result = FormulaEngine.evaluate(
        '(largo * ancho * alto + area) * cantidad',
        params,
      );
      expect(result).toBe(400);
    });

    it('should default cantidad to 1 if not provided', () => {
      const params: CubicationParams = { largo: 10, ancho: 5 };
      const result = FormulaEngine.evaluate('largo * ancho * cantidad', params);
      expect(result).toBe(50);
    });

    it('should default piezas to 1 if not provided', () => {
      const params: CubicationParams = { largo: 10, ancho: 5 };
      const result = FormulaEngine.evaluate('largo * ancho * piezas', params);
      expect(result).toBe(50);
    });

    it('should handle decimal values', () => {
      const params: CubicationParams = { largo: 10.5, ancho: 5.2 };
      const result = FormulaEngine.evaluate('largo * ancho', params);
      expect(result).toBeCloseTo(54.6, 1);
    });
  });
});
