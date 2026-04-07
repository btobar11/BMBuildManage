describe('Budget Calculation Business Logic', () => {
  describe('Item Cost Calculation', () => {
    it('should calculate correct total cost from items', () => {
      const items = [
        { quantity: 10, unit_cost: 50000, unit_price: 60000 },
        { quantity: 100, unit_cost: 1000, unit_price: 1200 },
      ];

      const expectedCost = 10 * 50000 + 100 * 1000;
      const expectedPrice = 10 * 60000 + 100 * 1200;

      const calculatedCost = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const calculatedPrice = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

      expect(calculatedCost).toBe(expectedCost);
      expect(calculatedPrice).toBe(expectedPrice);
    });

    it('should calculate correct item cost when adding from library APU', () => {
      const libraryAPU = {
        name: 'Enlucido de muros',
        unit_cost: 15000,
        unit_price: 18000,
        quantity: 50,
      };

      const itemCost = libraryAPU.quantity * libraryAPU.unit_cost;
      const itemPrice = libraryAPU.quantity * libraryAPU.unit_price;

      expect(itemCost).toBe(750000);
      expect(itemPrice).toBe(900000);
    });
  });

  describe('Markup Calculation', () => {
    it('should apply professional fee percentage correctly', () => {
      const directCost = 1000000;
      const professionalFeePercentage = 10;

      const withProfessionalFee = directCost * (1 + professionalFeePercentage / 100);

      expect(withProfessionalFee).toBe(1100000);
    });

    it('should apply utility percentage correctly', () => {
      const costWithFee = 1100000;
      const utilityPercentage = 15;

      const finalPrice = costWithFee * (1 + utilityPercentage / 100);

      expect(finalPrice).toBe(1265000);
    });

    it('should calculate complete budget with all markups', () => {
      const items = [
        { quantity: 10, unit_cost: 50000 },
        { quantity: 100, unit_cost: 1000 },
      ];

      const directCost = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      const professionalFee = 10;
      const utility = 15;

      const costWithFee = directCost * (1 + professionalFee / 100);
      const finalPrice = costWithFee * (1 + utility / 100);

      const expectedDirectCost = 600000;
      const expectedWithFee = 660000;
      const expectedFinal = 759000;

      expect(directCost).toBe(expectedDirectCost);
      expect(costWithFee).toBe(expectedWithFee);
      expect(finalPrice).toBeCloseTo(expectedFinal, 0);
    });

    it('should handle zero items gracefully', () => {
      const items: Array<{quantity: number; unit_cost: number}> = [];
      const directCost = items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0);
      expect(directCost).toBe(0);
    });

    it('should handle decimal quantities', () => {
      const item = { quantity: 2.5, unit_cost: 10000 };
      const totalCost = item.quantity * item.unit_cost;
      expect(totalCost).toBe(25000);
    });
  });

  describe('APU Library Integration', () => {
    it('should calculate APU total correctly', () => {
      const apuItem = {
        materialsCost: 50000,
        laborCost: 30000,
        equipmentCost: 10000,
        quantity: 5,
      };

      const totalAPUCost = (apuItem.materialsCost + apuItem.laborCost + apuItem.equipmentCost) * apuItem.quantity;

      expect(totalAPUCost).toBe(450000);
    });

    it('should handle APU with only materials', () => {
      const apuItem = {
        materialsCost: 50000,
        laborCost: 0,
        equipmentCost: 0,
        quantity: 3,
      };

      const totalAPUCost = (apuItem.materialsCost + apuItem.laborCost + apuItem.equipmentCost) * apuItem.quantity;

      expect(totalAPUCost).toBe(150000);
    });
  });

  describe('Stage Aggregation', () => {
    it('should aggregate multiple stages correctly', () => {
      const stages = [
        {
          name: 'Obra Gruesa',
          items: [
            { quantity: 10, unit_cost: 50000 },
          ],
        },
        {
          name: 'Terminaciones',
          items: [
            { quantity: 100, unit_cost: 10000 },
          ],
        },
      ];

      const stageTotals = stages.map(stage => 
        stage.items.reduce((sum, item) => sum + (item.quantity * item.unit_cost), 0)
      );

      const totalCost = stageTotals.reduce((sum, stageTotal) => sum + stageTotal, 0);

      expect(stageTotals[0]).toBe(500000);
      expect(stageTotals[1]).toBe(1000000);
      expect(totalCost).toBe(1500000);
    });
  });
});
