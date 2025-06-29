import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, vi, expect } from 'vitest';

import '@testing-library/jest-dom';

import { Navigation } from './Navigation';

// Мокаем дочерние компоненты
vi.mock('./NavElement', () => ({
    NavElement: ({ to, title, icon, end }: {
        to: string;
        title: string;
        icon: React.ReactNode;
        end?: boolean;
    }) => (
        <div data-testid={`nav-element-${to.replace('/', '') || 'home'}`}>
            <span data-testid="nav-title">{title}</span>
            <span data-testid="nav-icon">{icon}</span>
            {end && <span data-testid="nav-end">end</span>}
        </div>
    ),
}));

vi.mock('@ui/icons/Upload', () => ({
    Upload: ({ size }: { size: number }) => (
        <div data-testid="upload-icon" data-size={size}>Upload Icon</div>
    ),
}));

vi.mock('@ui/icons/Create', () => ({
    Create: ({ size }: { size: number }) => (
        <div data-testid="create-icon" data-size={size}>Create Icon</div>
    ),
}));

vi.mock('@ui/icons/History', () => ({
    History: ({ size }: { size: number }) => (
        <div data-testid="history-icon" data-size={size}>History Icon</div>
    ),
}));

describe('Navigation - Навигационное меню', () => {
    const renderWithRouter = (initialEntries = ['/']) => {
        return render(
            <MemoryRouter initialEntries={initialEntries}>
                <Navigation />
            </MemoryRouter>
        );
    };

    describe('Структурное тестирование', () => {
        it('Отображает все навигационные элементы', () => {
            renderWithRouter();

            expect(screen.getByTestId('nav-element-home')).toBeInTheDocument();
            expect(screen.getByTestId('nav-element-generate')).toBeInTheDocument();
            expect(screen.getByTestId('nav-element-history')).toBeInTheDocument();
        });
    });

    describe('Реагирование на маршруты', () => {
        it('Работает корректно на главной странице', () => {
            renderWithRouter(['/']);

            expect(screen.getByTestId('nav-element-home')).toBeInTheDocument();
            expect(screen.getByText('CSV Аналитик')).toBeInTheDocument();
        });

        it('Работает корректно на странице генерации', () => {
            renderWithRouter(['/generate']);

            expect(screen.getByTestId('nav-element-generate')).toBeInTheDocument();
            expect(screen.getByText('CSV Генератор')).toBeInTheDocument();
        });

        it('Работает корректно на странице истории', () => {
            renderWithRouter(['/history']);

            expect(screen.getByTestId('nav-element-history')).toBeInTheDocument();
            expect(screen.getByText('История')).toBeInTheDocument();
        });

        it('Работает корректно с неизвестными маршрутами', () => {
            renderWithRouter(['/unknown']);

            // Навигация должна рендериться независимо от текущего маршрута
            expect(screen.getByTestId('nav-element-home')).toBeInTheDocument();
            expect(screen.getByTestId('nav-element-generate')).toBeInTheDocument();
            expect(screen.getByTestId('nav-element-history')).toBeInTheDocument();
        });
    });
});
