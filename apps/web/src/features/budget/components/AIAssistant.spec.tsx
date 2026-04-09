import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AIAssistant } from '../AIAssistant';
import { CHILEAN_COSTS } from '../costLibrary';

vi.mock('../costLibrary', () => ({
  CHILEAN_COSTS: [
    { id: '1', name: 'Hormigon G25', category: 'material', unit: 'm3', unitPrice: 105000 },
    { id: '2', name: 'Fierro 10mm', category: 'material', unit: 'kg', unitPrice: 1050 },
    { id: '3', name: 'Cerámica 30x30', category: 'material', unit: 'm2', unitPrice: 10500 },
  ],
}));

describe('AIAssistant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('should render the floating button when closed', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      expect(button).toBeInTheDocument();
    });

    it('should not render the chat panel when closed', () => {
      render(<AIAssistant />);
      
      expect(screen.queryByText('Asistente IA')).toBeNull();
    });
  });

  describe('Opening/Closing', () => {
    it('should open chat when clicking the button', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      expect(screen.getByText('Asistente IA')).toBeInTheDocument();
    });

    it('should close chat when clicking close button', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      const closeButton = screen.getByRole('button', { name: '' });
      fireEvent.click(closeButton);
      
      expect(screen.queryByText('Asistente IA')).toBeNull();
    });
  });

  describe('Initial Message', () => {
    it('should show welcome message when opened', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      expect(screen.getByText(/hola.*asistente de construcción/i)).toBeInTheDocument();
    });

    it('should show initial suggestions', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      expect(screen.getByText('Precios de materiales')).toBeInTheDocument();
      expect(screen.getByText('Calcular presupuesto')).toBeInTheDocument();
    });
  });

  describe('User Input', () => {
    it('should update input value', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      const input = screen.getByPlaceholderText(/pregunta sobre materiales/i);
      fireEvent.change(input, { target: { value: 'Hola' } });
      
      expect(input).toHaveValue('Hola');
    });

    it('should not send empty message', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      const sendButton = screen.getByRole('button', { name: '' });
      const initialMessages = screen.getAllByText(/hola.*asistente/i);
      
      fireEvent.click(sendButton);
      
      expect(screen.getAllByText(/hola.*asistente/i)).toHaveLength(initialMessages.length);
    });
  });

  describe('Message Sending', () => {
    it('should show user message when sending', async () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      const input = screen.getByPlaceholderText(/pregunta sobre materiales/i);
      fireEvent.change(input, { target: { value: 'Test message' } });
      
      const sendButton = screen.getByRole('button', { name: '' });
      fireEvent.click(sendButton);
      
      await waitFor(() => {
        expect(screen.getByText('Test message')).toBeInTheDocument();
      });
    });
  });

  describe('Suggestions', () => {
    it('should show suggestion buttons', () => {
      render(<AIAssistant />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      const suggestions = screen.getAllByRole('button');
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Project Context', () => {
    it('should accept projectContext prop', () => {
      const context = {
        name: 'Test Project',
        stages: [
          {
            name: 'Foundation',
            items: [
              { name: 'Concrete', quantity: 100, unit: 'm3', unit_cost: 50000, unit_price: 60000 },
            ],
          },
        ],
      };
      
      render(<AIAssistant projectContext={context} />);
      
      const button = screen.getByRole('button', { name: /asistente ia/i });
      fireEvent.click(button);
      
      expect(screen.getByText(/hola.*asistente/i)).toBeInTheDocument();
    });
  });
});

describe('analyzeBudget function', () => {
  it('should return null for empty stages', () => {
    const result = (global as any).analyzeBudget?.({ stages: [] });
    expect(result).toBeNull();
  });

  it('should return null for undefined context', () => {
    const result = (global as any).analyzeBudget?.(undefined);
    expect(result).toBeNull();
  });

  it('should calculate totals correctly', () => {
    const context = {
      name: 'Test',
      stages: [
        {
          name: 'Stage 1',
          items: [
            { name: 'Concrete', quantity: 10, unit_cost: 1000, unit_price: 1200 },
            { name: 'Steel', quantity: 5, unit_cost: 2000, unit_price: 2500 },
          ],
        },
      ],
    };
    
    const result = (global as any).analyzeBudget?.(context);
    
    expect(result).not.toBeNull();
    expect(result.totalCost).toBe(20000);
    expect(result.totalPrice).toBe(24500);
    expect(result.itemsCount).toBe(2);
  });
});

describe('generateResponse function', () => {
  it('should respond to hormigon query', () => {
    const result = (global as any).generateResponse?.('precios de hormigon');
    expect(result).toBeDefined();
    expect(result.content).toContain('hormón');
  });

  it('should respond to fierro query', () => {
    const result = (global as any).generateResponse?.('precios de fierro');
    expect(result).toBeDefined();
    expect(result.content).toContain('fierro');
  });

  it('should respond to piso query', () => {
    const result = (global as any).generateResponse?.('precios de pisos');
    expect(result).toBeDefined();
    expect(result.content).toContain('piso');
  });

  it('should provide suggestions', () => {
    const result = (global as any).generateResponse?.('que me recomiendas');
    expect(result).toBeDefined();
    expect(result.suggestions).toBeDefined();
    expect(Array.isArray(result.suggestions)).toBe(true);
  });
});
