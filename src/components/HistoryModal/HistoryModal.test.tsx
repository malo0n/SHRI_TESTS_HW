import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';

import { HistoryModal } from './HistoryModal';

// Mock dependencies
vi.mock('@store/historyStore');
vi.mock('@ui/Modal', () => ({
    Modal: ({ isOpen, onClose, children }: { 
        isOpen: boolean; 
        onClose: () => void; 
        children: React.ReactNode;
    }) => (
        isOpen ? (
            <div data-testid="modal" onClick={onClose}>
                <div onClick={(e) => e.stopPropagation()}>
                    {children}
                </div>
            </div>
        ) : null
    ),
}));

vi.mock('@components/HighlightCard', () => ({
    HighlightCard: ({ highlight, className }: {
        highlight: { title: string; description: string };
        className?: string;
    }) => (
        <div data-testid="highlight-card" className={className}>
            <span data-testid="highlight-title">{highlight.title}</span>
            <span data-testid="highlight-description">{highlight.description}</span>
        </div>
    ),
}));

vi.mock('@utils/analysis', () => ({
    convertHighlightsToArray: vi.fn(),
}));

const mockUseHistoryStore = vi.mocked(await import('@store/historyStore')).useHistoryStore;
const mockConvertHighlightsToArray = vi.mocked(await import('@utils/analysis')).convertHighlightsToArray;

describe('HistoryModal - Модальное окно истории', () => {
    const mockHideModal = vi.fn();
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
    
    const mockSelectedItem = {
        id: '1',
        timestamp: Date.now(),
        fileName: 'test.csv',
        highlights: mockHighlights,
    };

    const mockConvertedHighlights = [
        { title: '1000', description: 'Общие расходы в галактических кредитах' },
        { title: '150', description: 'Средние расходы в галактических кредитах' },
        { title: 'humans', description: 'Цивилизация с максимальными расходами' },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        mockConvertHighlightsToArray.mockReturnValue(mockConvertedHighlights);
    });

    describe('Видимость модального окна', () => {

        it('Отображается когда модальное окно открыто', () => {
            mockUseHistoryStore.mockReturnValue({
                isOpenModal: true,
                selectedItem: mockSelectedItem,
                hideModal: mockHideModal,
            });

            render(<HistoryModal />);

            expect(screen.getByTestId('modal')).toBeInTheDocument();
        });

        it('Не отображается когда у selectedItem нет highlights', () => {
            const itemWithoutHighlights = {
                ...mockSelectedItem,
                highlights: undefined,
            };

            mockUseHistoryStore.mockReturnValue({
                isOpenModal: true,
                selectedItem: itemWithoutHighlights,
                hideModal: mockHideModal,
            });

            render(<HistoryModal />);

            expect(screen.queryByTestId('modal')).not.toBeInTheDocument();
        });
    });

    describe('Отображение хайлайтов', () => {
        beforeEach(() => {
            mockUseHistoryStore.mockReturnValue({
                isOpenModal: true,
                selectedItem: mockSelectedItem,
                hideModal: mockHideModal,
            });
        });

        it('Отображает все хайлайты', () => {
            render(<HistoryModal />);

            const highlightCards = screen.getAllByTestId('highlight-card');
            expect(highlightCards).toHaveLength(3);
        });

        it('Передает правильные данные в HighlightCard', () => {
            render(<HistoryModal />);

            expect(screen.getByText('1000')).toBeInTheDocument();
            expect(screen.getByText('Общие расходы в галактических кредитах')).toBeInTheDocument();
            
            expect(screen.getByText('150')).toBeInTheDocument();
            expect(screen.getByText('Средние расходы в галактических кредитах')).toBeInTheDocument();
            
            expect(screen.getByText('humans')).toBeInTheDocument();
            expect(screen.getByText('Цивилизация с максимальными расходами')).toBeInTheDocument();
        });
    });

    describe('Взаимодействие с модальным окном', () => {
        beforeEach(() => {
            mockUseHistoryStore.mockReturnValue({
                isOpenModal: true,
                selectedItem: mockSelectedItem,
                hideModal: mockHideModal,
            });
        });

        it('Вызывает hideModal при закрытии модального окна', () => {
            render(<HistoryModal />);

            const modal = screen.getByTestId('modal');
            fireEvent.click(modal);

            expect(mockHideModal).toHaveBeenCalled();
        });
    });

});
