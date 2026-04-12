import { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, ChevronDown } from 'lucide-react';
import { Button } from '../../ui/Button/Button';

interface ExportMenuProps {
  onExportExcel: () => Promise<void>;
  onExportPdf: () => Promise<void>;
  isLoading?: boolean;
}

/**
 * Export Dropdown Menu
 * 
 * Accessible dropdown for exporting reports
 */
export function ExportMenu({
  onExportExcel,
  onExportPdf,
  isLoading = false,
}: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExportExcel = async () => {
    setIsOpen(false);
    try {
      await onExportExcel();
    } catch (error) {
      console.error('Excel export failed:', error);
    }
  };

  const handleExportPdf = async () => {
    setIsOpen(false);
    try {
      await onExportPdf();
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2"
      >
        <Download size={16} />
        Exportar
        <ChevronDown
          size={14}
          className={`transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 bg-background border border-border rounded-lg shadow-lg z-50 py-1">
          <button
            onClick={handleExportExcel}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FileSpreadsheet size={16} className="text-emerald-600" />
            Descargar Excel
          </button>
          <button
            onClick={handleExportPdf}
            disabled={isLoading}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-muted transition-colors disabled:opacity-50"
          >
            <FileText size={16} className="text-red-600" />
            Descargar PDF
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportMenu;