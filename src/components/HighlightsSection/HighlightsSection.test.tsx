import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';

import '@testing-library/jest-dom';

import { HighlightsSection } from './HighlightsSection';

// Mock dependencies
vi.mock('@ui/Typography', () => ({
    Typography: ({ children, size, className }: {
        children: React.ReactNode;
        size?: string;
        className?: string;
    }) => (
        <span data-size={size} className={className}>
            {children}
        </span>
    ),
}));

vi.mock('@components/HighlightCard', () => ({
    HighlightCard: ({ highlight }: {
        highlight: { title: string; description: string };
    }) => (
        <div data-testid="highlight-card">
            <span data-testid="highlight-title">{highlight.title}</span>
            <span data-testid="highlight-description">{highlight.description}</span>
        </div>
    ),
}));

describe('HighlightsSection - Секция хайлайтов результатов', () => {
    const mockHighlights = [
        {
            title: '1000',
            description: 'Общие расходы в галактических кредитах',
        },
        {
            title: '150',
            description: 'Средние расходы в галактических кредитах',
        },
        {
            title: 'humans',
            description: 'Цивилизация с максимальными расходами',
        },
    ];

    describe('Отображение хайлайтов', () => {
        it('Отображает все переданные хайлайты', () => {
            render(<HighlightsSection highlights={mockHighlights} />);
            
            const highlightCards = screen.getAllByTestId('highlight-card');
            expect(highlightCards).toHaveLength(3);
            
            expect(screen.getByText('1000')).toBeInTheDocument();
            expect(screen.getByText('150')).toBeInTheDocument();
            expect(screen.getByText('humans')).toBeInTheDocument();
        });

        it('Передает правильные данные в HighlightCard', () => {
            render(<HighlightsSection highlights={mockHighlights} />);
            
            const titles = screen.getAllByTestId('highlight-title');
            const descriptions = screen.getAllByTestId('highlight-description');
            
            expect(titles[0]).toHaveTextContent('1000');
            expect(descriptions[0]).toHaveTextContent('Общие расходы в галактических кредитах');
            
            expect(titles[1]).toHaveTextContent('150');
            expect(descriptions[1]).toHaveTextContent('Средние расходы в галактических кредитах');
            
            expect(titles[2]).toHaveTextContent('humans');
            expect(descriptions[2]).toHaveTextContent('Цивилизация с максимальными расходами');
        });
    });

    describe('Обработка ошибок и edge cases', () => {
        it('Не падает при некорректных данных', () => {
            const invalidHighlights = [
                { title: null, description: 'Некорректный title' },
                { title: 'Корректный title', description: null },
            ] as { title: string | null; description: string | null }[];
            
            render(<HighlightsSection highlights={invalidHighlights as never} />);
            
            const highlightCards = screen.getAllByTestId('highlight-card');
            expect(highlightCards).toHaveLength(2);
        });

    });
});
