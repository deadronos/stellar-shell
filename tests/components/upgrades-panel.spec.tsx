import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UpgradesPanel } from '../../src/components/UpgradesPanel';
import { useStore } from '../../src/state/store';

vi.mock('../../src/state/store', () => ({
  useStore: vi.fn(),
}));

const mockUseStore = useStore as unknown as ReturnType<typeof vi.fn>;

const makeState = (overrides: Record<string, unknown> = {}) => ({
  isUpgradesOpen: true,
  toggleUpgrades: vi.fn(),
  upgrades: { MINING_SPEED_1: false, DRONE_SPEED_1: false, LASER_EFFICIENCY_1: false, AUTO_REPLICATOR: false, DEEP_SCAN_1: false, ADVANCED_EXPLORER: false },
  purchaseUpgrade: vi.fn(),
  matter: 0,
  rareMatter: 0,
  research: 0,
  ...overrides,
});

describe('UpgradesPanel', () => {
  it('renders nothing when isUpgradesOpen is false', () => {
    mockUseStore.mockImplementation((selector) => {
      const state = makeState({ isUpgradesOpen: false });
      return selector ? selector(state) : state;
    });

    const { container } = render(<UpgradesPanel />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all upgrades when open', () => {
    mockUseStore.mockImplementation((selector) => {
      const state = makeState();
      return selector ? selector(state) : state;
    });

    render(<UpgradesPanel />);

    expect(screen.getByText('Fast Drill')).toBeInTheDocument();
    expect(screen.getByText('Thruster Boost')).toBeInTheDocument();
    expect(screen.getByText('Laser Capacitor')).toBeInTheDocument();
    expect(screen.getByText('Auto-Replicator')).toBeInTheDocument();
    expect(screen.getByText('Deep Scan')).toBeInTheDocument();
    expect(screen.getByText('Advanced Explorer')).toBeInTheDocument();
  });

  it('shows Owned for purchased upgrades', () => {
    mockUseStore.mockImplementation((selector) => {
      const state = makeState({
        upgrades: { MINING_SPEED_1: true, DRONE_SPEED_1: false, LASER_EFFICIENCY_1: false, AUTO_REPLICATOR: false, DEEP_SCAN_1: false, ADVANCED_EXPLORER: false },
        matter: 100,
        rareMatter: 5,
        research: 10,
      });
      return selector ? selector(state) : state;
    });

    render(<UpgradesPanel />);
    expect(screen.getByText(/✓ Owned/i)).toBeInTheDocument();
  });

  it('calls purchaseUpgrade when Buy button is clicked', () => {
    const mockPurchase = vi.fn();
    mockUseStore.mockImplementation((selector) => {
      const state = makeState({ purchaseUpgrade: mockPurchase, matter: 100, rareMatter: 20 });
      return selector ? selector(state) : state;
    });

    render(<UpgradesPanel />);

    const buyButtons = screen.getAllByRole('button', { name: /Buy/i });
    fireEvent.click(buyButtons[0]);
    expect(mockPurchase).toHaveBeenCalledWith('MINING_SPEED_1');
  });

  it('disables Buy button when resources are insufficient', () => {
    mockUseStore.mockImplementation((selector) => {
      const state = makeState();
      return selector ? selector(state) : state;
    });

    render(<UpgradesPanel />);

    const buyButtons = screen.getAllByRole('button', { name: /Buy/i });
    buyButtons.forEach((btn) => expect(btn).toBeDisabled());
  });

  it('shows research costs for research-gated upgrades', () => {
    mockUseStore.mockImplementation((selector) => {
      const state = makeState();
      return selector ? selector(state) : state;
    });

    render(<UpgradesPanel />);

    expect(screen.getByText('5 research')).toBeInTheDocument();
    expect(screen.getByText('10 research')).toBeInTheDocument();
  });

  it('calls toggleUpgrades when close button is clicked', () => {
    const mockToggle = vi.fn();
    mockUseStore.mockImplementation((selector) => {
      const state = makeState({ toggleUpgrades: mockToggle });
      return selector ? selector(state) : state;
    });

    render(<UpgradesPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Close upgrades panel/i }));
    expect(mockToggle).toHaveBeenCalled();
  });
});
