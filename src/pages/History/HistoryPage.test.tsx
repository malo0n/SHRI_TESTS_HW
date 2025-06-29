import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

import '@testing-library/jest-dom';
import { HistoryPage } from './HistoryPage';

// Мокаем все дочерние компоненты для изоляции тестирования HistoryPage
vi.mock('@components/HistoryList', () => ({
    HistoryList: () => <div data-testid="history-list">History List Component</div>,
}));

vi.mock('@components/GenerateMoreButton', () => ({
    GenerateMoreButton: () => <button data-testid="generate-more-button">Generate More</button>,
}));

vi.mock('@components/ClearHistoryButton', () => ({
    ClearHistoryButton: () => <button data-testid="clear-history-button">Clear History</button>,
}));

vi.mock('@components/HistoryModal', () => ({
    HistoryModal: () => <div data-testid="history-modal">History Modal</div>,
}));

describe('HistoryPage - Структурное тестирование', () => {
    it('Рендерится без ошибок', () => {
        expect(() => render(<HistoryPage />)).not.toThrow();
    });

    it('Отображает все необходимые компоненты', () => {
        render(<HistoryPage />);

        expect(screen.getByTestId('history-list')).toBeInTheDocument();
        expect(screen.getByTestId('generate-more-button')).toBeInTheDocument();
        expect(screen.getByTestId('clear-history-button')).toBeInTheDocument();
        expect(screen.getByTestId('history-modal')).toBeInTheDocument();
    });



    it('Корректно отображает все дочерние компоненты', () => {
        render(<HistoryPage />);

        expect(screen.getByText('History List Component')).toBeInTheDocument();
        expect(screen.getByText('Generate More')).toBeInTheDocument();
        expect(screen.getByText('Clear History')).toBeInTheDocument();
        expect(screen.getByText('History Modal')).toBeInTheDocument();
    });
});
