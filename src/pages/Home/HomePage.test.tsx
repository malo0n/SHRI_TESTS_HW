import { AnalysisHighlight } from '@app-types/analysis';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';
import { HomePage } from './HomePage';

vi.mock('@store/analysisStore');
vi.mock('@hooks/use-csv-analysis');
vi.mock('@utils/storage');
// для упрощения тестирования, здесь будем использовать упрощенные компоненты. Тесты для изначальных компонентов
// FileUploadSection, HighlightsSection и Typography будут написаны отдельно.
vi.mock('@components/FileUploadSection', () => ({
    FileUploadSection: ({
        onFileSelect,
        onSend,
        onClear,
    }: {
        onFileSelect: (file: File) => void;
        onSend: () => void;
        onClear: () => void;
    }) => (
        <div data-testid="file-upload-section">
            <button onClick={() => onFileSelect(new File([''], 'test.csv', { type: 'text/csv' }))}>Select File</button>
            <button onClick={onSend}>Send</button>
            <button onClick={onClear}>Clear</button>
        </div>
    ),
}));
vi.mock('@components/HighlightsSection', () => ({
    HighlightsSection: ({ highlights }: { highlights: AnalysisHighlight[] }) => (
        <div data-testid="highlights-section">
            {highlights && <span>Highlights: {JSON.stringify(highlights)}</span>}
        </div>
    ),
}));
vi.mock('@ui/Typography', () => ({
    Typography: ({ children }: { children: React.ReactNode | undefined }) => <div>{children}</div>,
}));

const mockUseAnalysisStore = vi.mocked(await import('@store/analysisStore')).useAnalysisStore;
const mockUseCsvAnalysis = vi.mocked(await import('@hooks/use-csv-analysis')).useCsvAnalysis;
const mockAddToHistory = vi.mocked(await import('@utils/storage')).addToHistory;

describe('HomePage', () => {
    const mockAnalyzeCsv = vi.fn();
    const mockSetFile = vi.fn();
    const mockSetStatus = vi.fn();
    const mockSetHighlights = vi.fn();
    const mockSetError = vi.fn();
    const mockReset = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseAnalysisStore.mockReturnValue({
            file: null,
            status: 'idle',
            highlights: null,
            error: null,
            setFile: mockSetFile,
            setStatus: mockSetStatus,
            setHighlights: mockSetHighlights,
            setError: mockSetError,
            reset: mockReset,
        });

        mockUseCsvAnalysis.mockReturnValue({
            analyzeCsv: mockAnalyzeCsv,
        });
    });

    it('Когда рендерится компонент обработки файлов (главная страница), отображаются кнопка загрузки, секция загрузки файла и секция обработанных данных', () => {
        render(<HomePage />);

        expect(screen.getByText(/Загрузите/)).toBeInTheDocument();
        expect(screen.getByTestId('file-upload-section')).toBeInTheDocument();
        expect(screen.getByTestId('highlights-section')).toBeInTheDocument();
    });

    it('При выборе файла, вызывается функция добавления выбранного файла в стор', () => {
        render(<HomePage />);

        fireEvent.click(screen.getByText('Select File'));

        expect(mockSetFile).toHaveBeenCalledWith(expect.any(File));
    });

    it('При успешном завершении обработки файла, отображаются результаты анализа и сохраняются в историю', async () => {
        const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
        const mockHighlights = {
            total_spend_galactic: 10000,
            rows_affected: 100,
            less_spent_at: 5000,
            big_spent_at: 15000,
            less_spent_value: 2000,
            big_spent_value: 8000,
            average_spend_galactic: 4000,
            big_spent_civ: 'humans',
            less_spent_civ: 'humans',
        };

        mockUseAnalysisStore.mockReturnValue({
            file: mockFile,
            status: 'idle',
            highlights: null,
            error: null,
            setFile: mockSetFile,
            setStatus: mockSetStatus,
            setHighlights: mockSetHighlights,
            setError: mockSetError,
            reset: mockReset,
        });

        const { rerender } = render(<HomePage />);

        fireEvent.click(screen.getByText('Send'));

        expect(mockSetStatus).toHaveBeenCalledWith('processing');
        expect(mockAnalyzeCsv).toHaveBeenCalledWith(mockFile);

        const onComplete = mockUseCsvAnalysis.mock.calls[0][0].onComplete;
        onComplete(mockHighlights);

        expect(mockSetStatus).toHaveBeenCalledWith('completed');
        expect(mockAddToHistory).toHaveBeenCalledWith({
            fileName: 'test.csv',
            highlights: mockHighlights,
        });
        mockUseAnalysisStore.mockReturnValue({
            file: mockFile,
            status: 'completed',
            highlights: mockHighlights,
            error: null,
            setFile: mockSetFile,
            setStatus: mockSetStatus,
            setHighlights: mockSetHighlights,
            setError: mockSetError,
            reset: mockReset,
        });

        rerender(<HomePage />);

        expect(screen.getByText(`Highlights: ${JSON.stringify(mockHighlights)}`)).toBeInTheDocument();
    });

    it('Если во время анализа данных произошла ошибка, отображается сообщение об ошибке', () => {
        const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
        const mockError = new Error('Analysis failed');

        mockUseAnalysisStore.mockReturnValue({
            file: mockFile,
            status: 'idle',
            highlights: null,
            error: null,
            setFile: mockSetFile,
            setStatus: mockSetStatus,
            setHighlights: mockSetHighlights,
            setError: mockSetError,
            reset: mockReset,
        });

        render(<HomePage />);

        const onError = mockUseCsvAnalysis.mock.calls[0][0].onError;
        onError(mockError);

        expect(mockSetError).toHaveBeenCalledWith('Analysis failed');
        expect(mockAddToHistory).toHaveBeenCalledWith({
            fileName: 'test.csv',
        });
    });

    it('Если никакой файл не выбран, кнопка отправки заблокирована', () => {
        render(<HomePage />);

        fireEvent.click(screen.getByText('Send'));

        expect(mockAnalyzeCsv).not.toHaveBeenCalled();
        expect(mockSetStatus).not.toHaveBeenCalled();
    });

    it('Если файл уже обрабатывается, заблокировать кнопку отправки', () => {
        const mockFile = new File([''], 'test.csv', { type: 'text/csv' });

        mockUseAnalysisStore.mockReturnValue({
            file: mockFile,
            status: 'processing',
            highlights: null,
            error: null,
            setFile: mockSetFile,
            setStatus: mockSetStatus,
            setHighlights: mockSetHighlights,
            setError: mockSetError,
            reset: mockReset,
        });

        render(<HomePage />);

        fireEvent.click(screen.getByText('Send'));

        expect(mockAnalyzeCsv).not.toHaveBeenCalled();
    });

    it('При получении потоковых данных, вызывается функция плавного', () => {
        const mockFile = new File([''], 'test.csv', { type: 'text/csv' });
        const streamingHighlights = [{ title: 'test_data', description: 'streaming test_data' }];

        mockUseAnalysisStore.mockReturnValue({
            file: mockFile,
            status: 'idle',
            highlights: null,
            error: null,
            setFile: mockSetFile,
            setStatus: mockSetStatus,
            setHighlights: mockSetHighlights,
            setError: mockSetError,
            reset: mockReset,
        });

        render(<HomePage />);

        const onData = mockUseCsvAnalysis.mock.calls[0][0].onData;
        onData(streamingHighlights);

        expect(mockSetHighlights).toHaveBeenCalledWith(streamingHighlights);
    });

    it('При клике на кнопку очистки выбранного файла, вызывается сброс состояния', () => {
        render(<HomePage />);

        fireEvent.click(screen.getByText('Clear'));

        expect(mockReset).toHaveBeenCalled();
    });
});
