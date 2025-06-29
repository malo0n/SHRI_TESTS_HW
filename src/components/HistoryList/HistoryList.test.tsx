/* eslint-disable import/order */
import { HistoryItemType } from '@app-types/history';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';

import { HistoryList } from './HistoryList';

// Mock the store and utils
vi.mock('@store/historyStore');
vi.mock('@utils/storage');


const mockUseHistoryStore = vi.mocked(await import('@store/historyStore')).useHistoryStore;
const mockRemoveFromHistory = vi.mocked(await import('@utils/storage')).removeFromHistory;

vi.mock('@components/HistoryItem', () => ({
    HistoryItem: ({ item, onClick, onDelete }: { 
        item: HistoryItemType; 
        onClick: (item: HistoryItemType) => void; 
        onDelete: (id: string) => void; 
    }) => (
        <div data-testid={`history-item-${item.id}`}>
            <span>{item.fileName}</span>
            <button onClick={() => onClick(item)}>View</button>
            <button onClick={() => onDelete(item.id)}>Delete</button>
        </div>
    ),
}));

describe('HistoryList - Функциональное тестирование', () => {
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

    const mockShowModal = vi.fn();
    const mockSetSelectedItem = vi.fn();
    const mockRemoveFromHistoryStore = vi.fn();
    const mockUpdateHistoryFromStorage = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        mockUseHistoryStore.mockReturnValue({
            history: mockHistory,
            showModal: mockShowModal,
            setSelectedItem: mockSetSelectedItem,
            removeFromHistoryStore: mockRemoveFromHistoryStore,
            updateHistoryFromStorage: mockUpdateHistoryFromStorage,
        });
    });
    

    describe('Загрузка данных из LocalStorage', () => {
        it('Вызывает updateHistoryFromStorage при монтировании', () => {
            render(<HistoryList />);

            expect(mockUpdateHistoryFromStorage).toHaveBeenCalledWith();
            expect(mockUpdateHistoryFromStorage).toHaveBeenCalledTimes(1);
        });

        it('Отображает элементы истории из стора', () => {
            render(<HistoryList />);

            expect(screen.getByTestId('history-item-1')).toBeInTheDocument();
            expect(screen.getByTestId('history-item-2')).toBeInTheDocument();
            expect(screen.getByText('test1.csv')).toBeInTheDocument();
            expect(screen.getByText('test2.csv')).toBeInTheDocument();
        });

        it('Корректно работает с пустой историей', () => {
            mockUseHistoryStore.mockReturnValue({
                history: [],
                showModal: mockShowModal,
                setSelectedItem: mockSetSelectedItem,
                removeFromHistory: mockRemoveFromHistoryStore,
                updateHistoryFromStorage: mockUpdateHistoryFromStorage,
            });

            render(<HistoryList />);

            expect(mockUpdateHistoryFromStorage).toHaveBeenCalled();
            expect(screen.queryByTestId(/history-item-/)).not.toBeInTheDocument();
        });
    });

    describe('Взаимодействие с элементами истории', () => {
        it('Открывает модальное окно при клике на элемент', () => {
            render(<HistoryList />);

            const viewButton = screen.getAllByText('View')[0];
            fireEvent.click(viewButton);

            expect(mockSetSelectedItem).toHaveBeenCalledWith(mockHistory[0]);
            expect(mockShowModal).toHaveBeenCalled();
        });

        it('Удаляет элемент из истории и LocalStorage', () => {
            render(<HistoryList />);

            const deleteButton = screen.getAllByText('Delete')[0];
            fireEvent.click(deleteButton);

            expect(mockRemoveFromHistory).toHaveBeenCalledWith('1');
            expect(mockRemoveFromHistoryStore).toHaveBeenCalledWith('1');
        });

        it('Корректно обрабатывает клики на разные элементы', () => {
            render(<HistoryList />);

            // Клик на второй элемент
            const viewButtons = screen.getAllByText('View');
            fireEvent.click(viewButtons[1]);

            expect(mockSetSelectedItem).toHaveBeenCalledWith(mockHistory[1]);
            expect(mockShowModal).toHaveBeenCalled();
        });
    });

    
});
