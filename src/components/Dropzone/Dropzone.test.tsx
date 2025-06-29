import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';

import { Dropzone } from './Dropzone';

vi.mock('@ui/Button', () => ({
    Button: ({ children, onClick, disabled, type, variant, ...props }: {
        children: React.ReactNode;
        onClick?: () => void;
        disabled?: boolean;
        type?: 'button' | 'submit' | 'reset';
        variant?: string;
        [key: string]: unknown;
    }) => (
        <button 
            onClick={onClick} 
            disabled={disabled} 
            type={type}
            data-variant={variant}
            {...props}
        >
            {children}
        </button>
    ),
}));

vi.mock('@ui/Loader', () => ({
    Loader: () => <div data-testid="loader">Loading...</div>,
}));

vi.mock('@ui/Typography', () => ({
    Typography: ({ children, color, size, ...props }: {
        children: React.ReactNode;
        color?: string;
        size?: string;
        [key: string]: unknown;
    }) => (
        <span data-color={color} data-size={size} {...props}>
            {children}
        </span>
    ),
}));

vi.mock('../FileDisplay', () => ({
    FileDisplay: ({ fileName, onClear, isCompleted, isProcessing }: {
        fileName: string;
        onClear: () => void;
        isCompleted?: boolean;
        isProcessing?: boolean;
    }) => (
        <div data-testid="file-display">
            <span>{fileName}</span>
            <span>Completed: {isCompleted ? 'yes' : 'no'}</span>
            <span>Processing: {isProcessing ? 'yes' : 'no'}</span>
            <button onClick={onClear}>Clear</button>
        </div>
    ),
}));

vi.mock('@utils/analysis', () => ({
    isCsvFile: vi.fn(),
}));

const mockIsCsvFile = vi.mocked(await import('@utils/analysis')).isCsvFile;

describe('Dropzone - Тестирование загрузки файлов', () => {
    const mockOnFileSelect = vi.fn();
    const mockOnClear = vi.fn();
    
    const defaultProps = {
        file: null,
        status: 'idle' as const,
        error: null,
        onFileSelect: mockOnFileSelect,
        onClear: mockOnClear,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockIsCsvFile.mockReturnValue(true);
    });

    describe('Состояния загрузки', () => {
        it('Показывает лоадер в состоянии processing', () => {
            render(<Dropzone {...defaultProps} status="processing" />);
            
            expect(screen.getByTestId('loader')).toBeInTheDocument();
            expect(screen.getByText('идёт парсинг файла')).toBeInTheDocument();
        });

        it('Показывает FileDisplay когда файл загружен', () => {
            const testFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            
            render(<Dropzone {...defaultProps} file={testFile} />);
            
            expect(screen.getByTestId('file-display')).toBeInTheDocument();
            expect(screen.getByText('test.csv')).toBeInTheDocument();
            expect(screen.getByText('файл загружен!')).toBeInTheDocument();
        });

        it('Показывает статус "готово!" когда обработка завершена', () => {
            const testFile = new File(['test'], 'test.csv', { type: 'text/csv' });
            
            render(<Dropzone {...defaultProps} file={testFile} status="completed" />);
            
            expect(screen.getByText('готово!')).toBeInTheDocument();
            expect(screen.getByText('Completed: yes')).toBeInTheDocument();
        });

        it('Показывает ошибку валидации', () => {
            render(<Dropzone {...defaultProps} error="Файл не найден" />);
            
            expect(screen.getByText('Файл не найден')).toBeInTheDocument();
        });
    });

    describe('Валидация файлов', () => {
        it('Принимает только CSV файлы', () => {
            mockIsCsvFile.mockReturnValue(false);
            const { container } = render(<Dropzone {...defaultProps} />);
            const input = container.querySelector('input[type="file"]') as HTMLInputElement;
            const testFile = new File(['test'], 'test.txt', { type: 'text/plain' });
            
            Object.defineProperty(input, 'files', {
                value: [testFile],
                writable: false,
            });
            
            fireEvent.change(input);
            
            expect(mockOnFileSelect).not.toHaveBeenCalled();
            expect(screen.getByText('Можно загружать только *.csv файлы')).toBeInTheDocument();
        });
    });
});
