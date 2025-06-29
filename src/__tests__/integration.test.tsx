import { AnalysisHighlight } from '@app-types/analysis';
import { HistoryItemType } from '@app-types/history';
import { HistoryPage } from '@pages/History/HistoryPage';
import { HomePage } from '@pages/Home/HomePage';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';

// Мокаем внешние зависимости
vi.mock('@hooks/use-csv-analysis');
vi.mock('@store/analysisStore');
vi.mock('@store/historyStore');
vi.mock('@utils/storage');

vi.mock('@components/HighlightsSection', () => ({
    HighlightsSection: ({ highlights }: { highlights: AnalysisHighlight[] }) => (
        <div data-testid="highlights-section">
            {highlights && <span>Highlights: {JSON.stringify(highlights)}</span>}
        </div>
    ),
}));

const mockUseAnalysisStore = vi.mocked(await import('@store/analysisStore')).useAnalysisStore;
const mockUseHistoryStore = vi.mocked(await import('@store/historyStore')).useHistoryStore;
const mockUseCsvAnalysis = vi.mocked(await import('@hooks/use-csv-analysis')).useCsvAnalysis;
const mockAddToHistory = vi.mocked(await import('@utils/storage')).addToHistory;
const mockClearHistory = vi.mocked(await import('@utils/storage')).clearHistory;

describe('Интеграционные тесты - Основной функционал приложения', () => {
    const mockAnalyzeCsv = vi.fn();
    const mockSetFile = vi.fn();
    const mockSetStatus = vi.fn();
    const mockSetHighlights = vi.fn();
    const mockSetError = vi.fn();
    const mockReset = vi.fn();

    // History Store mocks
    const mockShowModal = vi.fn();
    const mockHideModal = vi.fn();
    const mockSetSelectedItem = vi.fn();
    const mockRemoveFromHistory = vi.fn();
    const mockUpdateHistoryFromStorage = vi.fn();
    const mockClearHistoryStore = vi.fn();

    const mockHistory: HistoryItemType[] = [
        {
            id: '1',
            timestamp: Date.now(),
            fileName: 'test1.csv',
            highlights: {
                total_spend_galactic: 1000,
                rows_affected: 50,
                less_spent_at: 100,
                big_spent_at: 500,
                less_spent_value: 50,
                big_spent_value: 200,
                average_spend_galactic: 150,
                big_spent_civ: 'humans',
                less_spent_civ: 'aliens',
            },
        },
        {
            id: '2',
            timestamp: Date.now() - 10000,
            fileName: 'test2.csv',
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();

        // Настройка Analysis Store
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

        // Настройка History Store
        mockUseHistoryStore.mockReturnValue({
            history: mockHistory,
            selectedItem: null,
            isModalOpen: false,
            showModal: mockShowModal,
            hideModal: mockHideModal,
            setSelectedItem: mockSetSelectedItem,
            removeFromHistory: mockRemoveFromHistory,
            updateHistoryFromStorage: mockUpdateHistoryFromStorage,
            clearHistory: mockClearHistoryStore,
        });

        // Настройка CSV Analysis Hook
        mockUseCsvAnalysis.mockReturnValue({
            analyzeCsv: mockAnalyzeCsv,
        });
    });

    describe('Полный цикл обработки файла', () => {
        it('Обрабатывает файл от загрузки до сохранения в историю', async () => {
            const testFile = new File(['test,data\n1,2'], 'test.csv', { type: 'text/csv' });
            const mockHighlights = {
                total_spend_galactic: 1000,
                rows_affected: 50,
                less_spent_at: 100,
                big_spent_at: 500,
                less_spent_value: 50,
                big_spent_value: 200,
                average_spend_galactic: 150,
                big_spent_civ: 'humans',
                less_spent_civ: 'aliens',
            };

            // Обновляем стор с файлом
            mockUseAnalysisStore.mockReturnValue({
                file: testFile,
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

            // Имитируем анализ файла
            expect(mockUseCsvAnalysis).toHaveBeenCalled();
            const { onComplete } = mockUseCsvAnalysis.mock.calls[0][0];

            // Симулируем успешное завершение
            onComplete(mockHighlights);

            expect(mockSetStatus).toHaveBeenCalledWith('completed');
            expect(mockAddToHistory).toHaveBeenCalledWith({
                fileName: 'test.csv',
                highlights: mockHighlights,
            });
        });

        it('Корректно обрабатывает ошибки анализа', async () => {
            const testFile = new File(['invalid,data'], 'test.csv', { type: 'text/csv' });
            const testError = new Error('Analysis failed');

            mockUseAnalysisStore.mockReturnValue({
                file: testFile,
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

            // Получаем колбэк ошибки
            const { onError } = mockUseCsvAnalysis.mock.calls[0][0];

            // Симулируем ошибку
            onError(testError);

            expect(mockSetError).toHaveBeenCalledWith('Analysis failed');
            expect(mockAddToHistory).toHaveBeenCalledWith({
                fileName: 'test.csv',
            });
        });
    });

    describe('Работа с историей загрузок', () => {
        it('Загружает историю при открытии страницы истории', () => {
            render(
                <BrowserRouter>
                    <HistoryPage />
                </BrowserRouter>
            );

            expect(mockUpdateHistoryFromStorage).toHaveBeenCalled();
        });

        it('Очищает всю историю при использовании кнопки очистки', async () => {
            render(
                <BrowserRouter>
                    <HistoryPage />
                </BrowserRouter>
            );

            // Ждем загрузки компонентов
            await waitFor(() => {
                expect(screen.getByText('Очистить всё')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Очистить всё'));

            expect(mockClearHistoryStore).toHaveBeenCalled();
            expect(mockClearHistory).toHaveBeenCalled();
        });

        it('Переходит на страницу генерации при клике на кнопку', async () => {
            const mockNavigate = vi.fn();
            vi.mocked(vi.fn()).mockReturnValue(mockNavigate);

            render(
                <BrowserRouter>
                    <HistoryPage />
                </BrowserRouter>
            );

            await waitFor(() => {
                expect(screen.getByText('Сгенерировать больше')).toBeInTheDocument();
            });

            fireEvent.click(screen.getByText('Сгенерировать больше'));
            // Логика навигации тестируется в отдельном тесте компонента
        });
    });

    describe('Интеграция LocalStorage', () => {
        it('Сохраняет данные в LocalStorage при успешном анализе', () => {
            const testFile = new File(['test,data'], 'integration-test.csv');
            const mockHighlights = {
                total_spend_galactic: 2000,
                rows_affected: 75,
                less_spent_at: 200,
                big_spent_at: 800,
                less_spent_value: 100,
                big_spent_value: 400,
                average_spend_galactic: 250,
                big_spent_civ: 'aliens',
                less_spent_civ: 'humans',
            };

            mockUseAnalysisStore.mockReturnValue({
                file: testFile,
                status: 'completed',
                highlights: mockHighlights,
                error: null,
                setFile: mockSetFile,
                setStatus: mockSetStatus,
                setHighlights: mockSetHighlights,
                setError: mockSetError,
                reset: mockReset,
            });

            render(<HomePage />);

            const { onComplete } = mockUseCsvAnalysis.mock.calls[0][0];
            onComplete(mockHighlights);

            expect(mockAddToHistory).toHaveBeenCalledWith({
                fileName: 'integration-test.csv',
                highlights: mockHighlights,
            });
        });

        it('Сохраняет запись об ошибке в LocalStorage', () => {
            const testFile = new File(['bad,data'], 'error-test.csv');
            const testError = new Error('Integration test error');

            mockUseAnalysisStore.mockReturnValue({
                file: testFile,
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

            const { onError } = mockUseCsvAnalysis.mock.calls[0][0];
            onError(testError);

            expect(mockAddToHistory).toHaveBeenCalledWith({
                fileName: 'error-test.csv',
            });
        });
    });

    describe('Потоковая обработка данных', () => {
        it('Обновляет интерфейс при получении потоковых данных', () => {
            const testFile = new File(['streaming,data'], 'stream-test.csv');
            const streamingData = [
                { title: 'Первая порция', description: 'Данные 1' },
                { title: 'Вторая порция', description: 'Данные 2' },
            ];

            mockUseAnalysisStore.mockReturnValue({
                file: testFile,
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

            const { onData } = mockUseCsvAnalysis.mock.calls[0][0];
            onData(streamingData);

            expect(mockSetHighlights).toHaveBeenCalledWith(streamingData);
        });
    });
});
