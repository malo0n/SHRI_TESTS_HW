import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';

import '@testing-library/jest-dom';
import { GenerateMoreButton } from './GenerateMoreButton';

vi.mock('react-router-dom', () => ({
    useNavigate: () => mockNavigate,
}));

vi.mock('@ui/Button', () => ({
    Button: ({ children, onClick, variant }: { children: React.ReactNode; onClick: () => void; variant: string }) => (
        <button data-testid="generate-button" data-variant={variant} onClick={onClick}>
            {children}
        </button>
    ),
}));

const mockNavigate = vi.fn();

describe('GenerateMoreButton - Функциональное тестирование', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('Навигационная функциональность', () => {
        it('Переходит на страницу генерации при клике', () => {
            render(<GenerateMoreButton />);

            fireEvent.click(screen.getByTestId('generate-button'));

            expect(mockNavigate).toHaveBeenCalledWith('/generate');
            expect(mockNavigate).toHaveBeenCalledTimes(1);
        });

    });

});
