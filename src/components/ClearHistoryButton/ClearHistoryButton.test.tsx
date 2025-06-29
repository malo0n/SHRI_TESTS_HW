import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';
import { ClearHistoryButton } from './ClearHistoryButton';

vi.mock('@store/historyStore');
vi.mock('@utils/storage');
vi.mock('@ui/Button', () => ({
    Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant: string }) => (
        <button data-testid="clear-button" data-variant={variant} onClick={onClick}>
            {children}
        </button>
    ),
}));

const mockUseHistoryStore = vi.mocked(await import('@store/historyStore')).useHistoryStore;
const mockClearHistoryStorage = vi.mocked(await import('@utils/storage')).clearHistory;

describe('ClearHistoryButton - Функциональное тестирование', () => {
    const mockClearHistory = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Отображение кнопки', () => {
        it('Отображается когда есть элементы в истории', () => {
            mockUseHistoryStore.mockReturnValue({
                clearHistory: mockClearHistory,
                history: [{ id: '1', fileName: 'test.csv', timestamp: Date.now() }],
            });

            render(<ClearHistoryButton />);

            expect(screen.getByTestId('clear-button')).toBeInTheDocument();
            expect(screen.getByText('Очистить всё')).toBeInTheDocument();
        });

        it('Скрывается когда история пуста', () => {
            mockUseHistoryStore.mockReturnValue({
                clearHistory: mockClearHistory,
                history: [],
            });

            render(<ClearHistoryButton />);

            expect(screen.queryByTestId('clear-button')).not.toBeInTheDocument();
        });
    });

    describe('Функциональность очистки', () => {
        it('Очищает историю при клике', () => {
            mockUseHistoryStore.mockReturnValue({
                clearHistory: mockClearHistory,
                history: [
                    { id: '1', fileName: 'test1.csv', timestamp: Date.now() },
                    { id: '2', fileName: 'test2.csv', timestamp: Date.now() - 1000 },
                ],
            });

            render(<ClearHistoryButton />);

            fireEvent.click(screen.getByTestId('clear-button'));

            expect(mockClearHistory).toHaveBeenCalledWith();
            expect(mockClearHistoryStorage).toHaveBeenCalledWith();
        });
    });
});
